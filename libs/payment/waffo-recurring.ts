import type { ClaimOrderPaidResult } from './fulfillment-types';

export type WaffoRecurringFulfillmentDecision =
  | { action: 'nack' }
  | { action: 'ack' }
  | { action: 'upsert'; userId: string; planId: string };

/**
 * Recurring insert is allowed only when a local payable order exists.
 * Unknown merchant external ids must not create an ACTIVE subscription.
 */
export function decideWaffoRecurringFulfillment(
  claim: Pick<ClaimOrderPaidResult, 'status' | 'order'>,
  fallback?: { userId?: string; planId?: string }
): WaffoRecurringFulfillmentDecision {
  if (claim.status === 'not_found') {
    return { action: 'nack' };
  }
  if (claim.status === 'ignored') {
    return { action: 'ack' };
  }

  const userId = claim.order?.userId || fallback?.userId;
  const planId = claim.order?.planId || fallback?.planId;
  if (!userId || !planId) {
    return { action: 'ack' };
  }

  return { action: 'upsert', userId, planId };
}
