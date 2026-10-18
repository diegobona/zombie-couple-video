import { WaffoPancake, WebhookEventType } from '@waffo/pancake-ts';
import type { WebhookEvent, WebhookEventData } from '@waffo/pancake-ts';
import { config } from '@config';
import type { CreditPlan } from '@config';
import {
  PaymentProvider,
  PaymentParams,
  PaymentResult,
  WebhookVerification,
  OrderQueryResult,
  PaymentPlan
} from '../types';
import { db } from '@libs/database';
import {
  subscription as userSubscription,
  subscriptionStatus,
  paymentTypes
} from '@libs/database/schema/subscription';
import { order, orderStatus } from '@libs/database/schema/order';
import { user } from '@libs/database/schema/user';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { utcNow } from '@libs/database/utils/utc';
import { getPlanById } from '@libs/pricing';
import { claimOrderPaid, ensureCreditsForOrder, shouldFulfillNewEntitlements } from '../fulfillment';
import { decideWaffoRecurringFulfillment } from '../waffo-recurring';

const WAFFO_CONSUMER_PORTAL_URL = 'https://pancake.waffo.ai/consumer/portal/login';

type WaffoWebhookEvent = WebhookEvent<WebhookEventData>;

export class WaffoProvider implements PaymentProvider {
  private client: WaffoPancake;

  constructor() {
    const webhookPublicKey = config.payment.providers.waffo.webhookPublicKey;
    this.client = new WaffoPancake({
      merchantId: config.payment.providers.waffo.merchantId,
      privateKey: config.payment.providers.waffo.privateKey,
      ...(webhookPublicKey ? { webhookPublicKey } : {}),
    });
  }

  async createPayment(params: PaymentParams): Promise<PaymentResult> {
    const plan = params.plan || config.payment.plans[params.planId as keyof typeof config.payment.plans] as PaymentPlan;
    if (!plan) {
      throw new Error(`Plan not found: ${params.planId}`);
    }
    if (!plan.waffoProductId) {
      throw new Error(`Waffo product ID not configured for plan: ${params.planId}`);
    }

    const userRecord = await db.query.user.findFirst({
      where: eq(user.id, params.userId)
    });
    if (!userRecord) {
      throw new Error(`User not found: ${params.userId}`);
    }
    if (!userRecord.email) {
      throw new Error(`User email not found for user: ${params.userId}`);
    }

    try {
      const session = await this.client.checkout.authenticated.create({
        productId: plan.waffoProductId,
        currency: (params.currency || plan.currency).toUpperCase(),
        buyerIdentity: params.userId,
        buyerEmail: userRecord.email,
        orderMerchantExternalId: params.orderId,
        metadata: {
          orderId: params.orderId,
          userId: params.userId,
          planId: params.planId,
        },
        successUrl: `${config.app.payment.successUrl}?provider=waffo`,
      });

      if (!session?.checkoutUrl) {
        throw new Error('Failed to create Waffo checkout session: No URL returned');
      }

      return {
        paymentUrl: session.checkoutUrl,
        providerOrderId: session.sessionId,
        metadata: {
          sessionId: session.sessionId,
          expiresAt: session.expiresAt,
        }
      };
    } catch (error) {
      console.error('Waffo payment creation failed:', error);
      throw new Error(`Failed to create Waffo payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async handleWebhook(payload: string | Record<string, any>, signature: string): Promise<WebhookVerification> {
    try {
      const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);

      let webhookEvent: WaffoWebhookEvent;
      try {
        webhookEvent = this.client.webhooks.verify<WebhookEventData>(payloadString, signature);
      } catch (error) {
        console.error('Waffo webhook signature verification failed:', error);
        return { success: false };
      }

      switch (webhookEvent.eventType) {
        case WebhookEventType.OrderCompleted:
          return this.handleOrderCompleted(webhookEvent.data);
        case WebhookEventType.SubscriptionActivated:
          return this.handleSubscriptionActivated(webhookEvent.data);
        case WebhookEventType.SubscriptionPaymentSucceeded:
          return this.handleSubscriptionPaymentSucceeded(webhookEvent.data);
        case WebhookEventType.SubscriptionCanceling:
          return this.handleSubscriptionCanceling(webhookEvent.data);
        case WebhookEventType.SubscriptionUncanceled:
          return this.handleSubscriptionUncanceled(webhookEvent.data);
        case WebhookEventType.SubscriptionCanceled:
          return this.handleSubscriptionCanceled(webhookEvent.data);
        case WebhookEventType.SubscriptionPastDue:
          return this.handleSubscriptionPastDue(webhookEvent.data);
        case WebhookEventType.SubscriptionUpdated:
          return this.handleSubscriptionUpdated(webhookEvent.data);
        // Refund clawback is deferred to a follow-up PR (same as Stripe/Dodo):
        // ack only, do not mark the order refunded or reverse entitlements.
        case WebhookEventType.RefundSucceeded:
        case WebhookEventType.RefundFailed:
          console.log(`Unhandled Waffo webhook event: ${webhookEvent.eventType}`);
          return { success: true };
        default:
          console.log(`Unhandled Waffo webhook event: ${webhookEvent.eventType}`);
          return { success: true };
      }
    } catch (error) {
      console.error('Error handling Waffo webhook:', error);
      return { success: false };
    }
  }

  private resolveIds(data: WebhookEventData): { orderId?: string; userId?: string; planId?: string } {
    return {
      orderId: data.orderMerchantExternalId || data.orderMetadata?.orderId,
      userId: data.orderMetadata?.userId || data.merchantProvidedBuyerIdentity,
      planId: data.orderMetadata?.planId,
    };
  }

  private parsePeriodDate(value?: string): Date | null {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private async handleOrderCompleted(data: WebhookEventData): Promise<WebhookVerification> {
    const { orderId, userId, planId } = this.resolveIds(data);
    if (!orderId || !userId || !planId) {
      console.error('Missing required metadata in Waffo order.completed webhook:', data.orderMetadata);
      return { success: true };
    }

    const claim = await claimOrderPaid({
      orderId,
      metadata: {
        waffoOrderId: data.orderId,
        paymentId: data.paymentId,
      },
    });
    if (claim.status === 'not_found') {
      console.error(`Waffo webhook: local order not found: ${orderId}`);
      return { success: false };
    }
    if (claim.status === 'ignored') {
      return { success: true, orderId };
    }

    const plan = (await getPlanById(planId) || config.payment.plans[planId as keyof typeof config.payment.plans]) as PaymentPlan;

    if (plan?.duration.type === 'credits' && (plan as CreditPlan).credits) {
      const credits = (plan as CreditPlan).credits;
      console.log(`Waffo credit pack purchase - Adding ${credits} credits to user ${userId}`);

      await ensureCreditsForOrder({
        orderId,
        userId,
        credits,
        provider: 'waffo',
        planId,
        metadata: {
          paymentId: data.paymentId,
          waffoOrderId: data.orderId,
        },
      });

      return { success: true, orderId };
    }

    if (shouldFulfillNewEntitlements(claim) && plan?.duration.type === 'one_time') {
      const now = utcNow();
      const months = plan.duration.months ?? 1;
      const periodEnd = new Date(now);
      if (months >= 9999) {
        periodEnd.setFullYear(periodEnd.getFullYear() + 100);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + months);
      }

      await db.insert(userSubscription).values({
        id: randomUUID(),
        userId,
        planId,
        status: subscriptionStatus.ACTIVE,
        paymentType: paymentTypes.ONE_TIME,
        waffoOrderId: data.orderId,
        periodStart: now,
        periodEnd,
        cancelAtPeriodEnd: true,
        metadata: JSON.stringify({
          paymentId: data.paymentId,
          isLifetime: months >= 9999
        })
      });
    }

    return { success: true, orderId };
  }

  private async upsertRecurringSubscription(data: WebhookEventData, userId: string, planId: string): Promise<void> {
    const existingUser = await db.query.user.findFirst({
      where: eq(user.id, userId)
    });
    if (!existingUser) {
      console.warn(`Waffo webhook: user ${userId} not found, skip subscription upsert`);
      return;
    }

    const existing = await db.query.subscription.findFirst({
      where: eq(userSubscription.waffoOrderId, data.orderId)
    });

    const periodStart = this.parsePeriodDate(data.currentPeriodStart) || utcNow();
    let periodEnd = this.parsePeriodDate(data.currentPeriodEnd);
    if (!periodEnd) {
      const plan = (await getPlanById(planId) || config.payment.plans[planId as keyof typeof config.payment.plans]) as PaymentPlan | undefined;
      const months = plan?.duration.months ?? 1;
      periodEnd = new Date(periodStart);
      if (months >= 9999) {
        periodEnd.setFullYear(periodEnd.getFullYear() + 100);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + months);
      }
    }

    if (existing) {
      await db.update(userSubscription)
        .set({
          status: subscriptionStatus.ACTIVE,
          periodStart,
          periodEnd,
          cancelAtPeriodEnd: false,
          updatedAt: new Date()
        })
        .where(eq(userSubscription.id, existing.id));
      return;
    }

    await db.insert(userSubscription).values({
      id: randomUUID(),
      userId,
      planId,
      status: subscriptionStatus.ACTIVE,
      paymentType: paymentTypes.RECURRING,
      waffoOrderId: data.orderId,
      periodStart,
      periodEnd,
      cancelAtPeriodEnd: false,
      metadata: JSON.stringify({
        paymentId: data.paymentId,
        productName: data.productName,
        billingPeriod: data.billingPeriod
      })
    });
  }

  private async handleSubscriptionActivated(data: WebhookEventData): Promise<WebhookVerification> {
    const { orderId, userId, planId } = this.resolveIds(data);
    if (!orderId || !userId || !planId) {
      console.warn('Missing metadata in Waffo subscription.activated webhook');
      return { success: true };
    }

    const claim = await claimOrderPaid({
      orderId,
      metadata: {
        waffoOrderId: data.orderId,
        paymentId: data.paymentId,
      },
    });
    const decision = decideWaffoRecurringFulfillment(claim, { userId, planId });
    if (decision.action === 'nack') {
      console.error(`Waffo webhook: local order not found: ${orderId}`);
      return { success: false };
    }
    if (decision.action === 'upsert') {
      await this.upsertRecurringSubscription(data, decision.userId, decision.planId);
    }

    return { success: true, orderId };
  }

  private async handleSubscriptionPaymentSucceeded(data: WebhookEventData): Promise<WebhookVerification> {
    const { orderId, userId, planId } = this.resolveIds(data);

    if (!orderId) {
      const updated = await this.updateExistingRecurringPeriod(data);
      if (!updated) {
        console.warn(`No local subscription found for Waffo order ${data.orderId}`);
      }
      return { success: true };
    }

    const claim = await claimOrderPaid({
      orderId,
      metadata: {
        waffoOrderId: data.orderId,
        paymentId: data.paymentId,
      },
    });
    const decision = decideWaffoRecurringFulfillment(claim, { userId, planId });
    if (decision.action === 'nack') {
      const updated = await this.updateExistingRecurringPeriod(data);
      if (updated) {
        return { success: true, orderId };
      }
      console.error(`Waffo webhook: local order not found: ${orderId}`);
      return { success: false };
    }
    if (decision.action === 'upsert') {
      await this.upsertRecurringSubscription(data, decision.userId, decision.planId);
    }

    return { success: true, orderId };
  }

  private async updateExistingRecurringPeriod(data: WebhookEventData): Promise<boolean> {
    const periodStart = this.parsePeriodDate(data.currentPeriodStart);
    const periodEnd = this.parsePeriodDate(data.currentPeriodEnd);
    return this.updateSubscriptionByWaffoOrder(data.orderId, {
      status: subscriptionStatus.ACTIVE,
      ...(periodStart ? { periodStart } : {}),
      ...(periodEnd ? { periodEnd } : {}),
    });
  }

  private async updateSubscriptionByWaffoOrder(
    waffoOrderId: string,
    values: Record<string, unknown>
  ): Promise<boolean> {
    const subscription = await db.query.subscription.findFirst({
      where: eq(userSubscription.waffoOrderId, waffoOrderId)
    });

    if (!subscription) {
      console.warn(`No local subscription found for Waffo order ${waffoOrderId}`);
      return false;
    }

    await db.update(userSubscription)
      .set({
        ...values,
        updatedAt: new Date()
      })
      .where(eq(userSubscription.id, subscription.id));

    return true;
  }

  private async handleSubscriptionCanceling(data: WebhookEventData): Promise<WebhookVerification> {
    await this.updateSubscriptionByWaffoOrder(data.orderId, {
      cancelAtPeriodEnd: true,
    });
    return { success: true };
  }

  private async handleSubscriptionUncanceled(data: WebhookEventData): Promise<WebhookVerification> {
    await this.updateSubscriptionByWaffoOrder(data.orderId, {
      status: subscriptionStatus.ACTIVE,
      cancelAtPeriodEnd: false,
    });
    return { success: true };
  }

  private async handleSubscriptionCanceled(data: WebhookEventData): Promise<WebhookVerification> {
    await this.updateSubscriptionByWaffoOrder(data.orderId, {
      status: subscriptionStatus.CANCELED,
      cancelAtPeriodEnd: true,
    });
    return { success: true };
  }

  private async handleSubscriptionPastDue(data: WebhookEventData): Promise<WebhookVerification> {
    await this.updateSubscriptionByWaffoOrder(data.orderId, {
      status: subscriptionStatus.INACTIVE,
    });
    return { success: true };
  }

  private async handleSubscriptionUpdated(data: WebhookEventData): Promise<WebhookVerification> {
    const periodStart = this.parsePeriodDate(data.currentPeriodStart);
    const periodEnd = this.parsePeriodDate(data.currentPeriodEnd);
    await this.updateSubscriptionByWaffoOrder(data.orderId, {
      status: subscriptionStatus.ACTIVE,
      ...(periodStart ? { periodStart } : {}),
      ...(periodEnd ? { periodEnd } : {}),
    });
    return { success: true };
  }

  // private async handleRefundSucceeded(data: WebhookEventData): Promise<WebhookVerification> {
  //   const { orderId } = this.resolveIds(data);
  //   if (!orderId) {
  //     console.warn('Waffo refund.succeeded missing local order id');
  //     return { success: true };
  //   }
  //
  //   const existingOrder = await db.query.order.findFirst({
  //     where: eq(order.id, orderId)
  //   });
  //   const existingMetadata = (typeof existingOrder?.metadata === 'object' && existingOrder.metadata)
  //     ? existingOrder.metadata as Record<string, unknown>
  //     : {};
  //
  //   await db.update(order)
  //     .set({
  //       status: orderStatus.REFUNDED,
  //       metadata: {
  //         ...existingMetadata,
  //         waffoOrderId: data.orderId,
  //         paymentId: data.paymentId,
  //         refundReason: data.refundReason,
  //       }
  //     })
  //     .where(eq(order.id, orderId));
  //
  //   return { success: true, orderId };
  // }

  async queryOrder(orderId: string): Promise<OrderQueryResult> {
    try {
      const orders = await db.select()
        .from(order)
        .where(eq(order.id, orderId));

      if (orders.length === 0) {
        return { status: 'failed' };
      }

      const orderData = orders[0];
      if (orderData.status === orderStatus.PAID) {
        return { status: 'paid' };
      }
      if (orderData.status === orderStatus.FAILED) {
        return { status: 'failed' };
      }
      return { status: 'pending' };
    } catch (error) {
      console.error('Error querying Waffo order:', error);
      return { status: 'failed' };
    }
  }

  async closeOrder(orderId: string): Promise<boolean> {
    try {
      await db.update(order)
        .set({ status: orderStatus.FAILED })
        .where(eq(order.id, orderId));
      return true;
    } catch (error) {
      console.error('Error closing Waffo order:', error);
      return false;
    }
  }

  /**
   * Waffo hosts a magic-link consumer portal. There is no Stripe-style portal session.
   */
  async createWaffoCustomerPortal(_waffoOrderId: string, _returnUrl: string): Promise<{ url: string }> {
    return { url: WAFFO_CONSUMER_PORTAL_URL };
  }
}
