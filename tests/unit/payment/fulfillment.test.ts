import { describe, expect, test } from 'vitest';
import { orderStatus } from '@libs/database/constants';
import {
  claimOrderPaid,
  ensureCreditsForOrder,
  parseOrderMetadata,
  shouldFulfillNewEntitlements,
} from '@libs/payment/fulfillment';
import type {
  EnsureCreditsInput,
  OrderFulfillmentDeps,
  PayableOrder,
} from '@libs/payment/fulfillment';

function createOrder(overrides: Partial<PayableOrder> = {}): PayableOrder {
  return {
    id: 'order_1',
    userId: 'user_1',
    planId: 'credits100',
    status: orderStatus.PENDING,
    metadata: { referralCode: 'abc' },
    providerOrderId: null,
    ...overrides,
  };
}

function createMemoryDeps(initial?: PayableOrder) {
  const orders = new Map<string, PayableOrder>();
  if (initial) {
    orders.set(initial.id, { ...initial });
  }

  const purchaseOrders = new Set<string>();
  const addCreditPayloads: EnsureCreditsInput[] = [];
  let commissionCalls = 0;
  let addCreditsShouldFail = false;

  const deps: OrderFulfillmentDeps = {
    async findOrder(orderId) {
      return orders.get(orderId) ?? null;
    },
    async tryMarkPaid(orderId, patch, claimableStatuses) {
      const current = orders.get(orderId);
      if (!current || !claimableStatuses.includes(current.status)) {
        return null;
      }

      const next: PayableOrder = {
        ...current,
        status: orderStatus.PAID,
        metadata: patch.metadata,
        providerOrderId: patch.providerOrderId ?? current.providerOrderId,
      };
      orders.set(orderId, next);
      return next;
    },
    async processReferralCommission() {
      commissionCalls += 1;
    },
    async hasPurchaseForOrder(orderId) {
      return purchaseOrders.has(orderId);
    },
    async addCredits(input) {
      if (addCreditsShouldFail) {
        throw new Error('grant failed');
      }
      if (purchaseOrders.has(input.orderId)) {
        const error = new Error(`Purchase credits already granted for order ${input.orderId}`);
        error.name = 'DuplicatePurchaseOrderError';
        throw error;
      }
      purchaseOrders.add(input.orderId);
      addCreditPayloads.push(input);
    },
  };

  return {
    deps,
    orders,
    get commissionCalls() {
      return commissionCalls;
    },
    get addCreditPayloads() {
      return addCreditPayloads;
    },
    failNextGrant() {
      addCreditsShouldFail = true;
    },
    allowGrant() {
      addCreditsShouldFail = false;
    },
  };
}

const creditInput = {
  orderId: 'order_1',
  userId: 'user_1',
  credits: 100,
  provider: 'waffo',
  planId: 'credits100',
  metadata: { paymentId: 'pay_1' },
};

describe('parseOrderMetadata', () => {
  test('parses objects and JSON strings', () => {
    expect(parseOrderMetadata({ checkoutId: 'c1' })).toEqual({ checkoutId: 'c1' });
    expect(parseOrderMetadata('{"checkoutId":"c1"}')).toEqual({ checkoutId: 'c1' });
    expect(parseOrderMetadata('not-json')).toEqual({});
    expect(parseOrderMetadata(null)).toEqual({});
  });
});

describe('shouldFulfillNewEntitlements', () => {
  test('is true only for a won paid claim', () => {
    expect(shouldFulfillNewEntitlements({ status: 'claimed' })).toBe(true);
    expect(shouldFulfillNewEntitlements({ status: 'already_paid' })).toBe(false);
    expect(shouldFulfillNewEntitlements({ status: 'ignored' })).toBe(false);
    expect(shouldFulfillNewEntitlements({ status: 'not_found' })).toBe(false);
  });
});

describe('claimOrderPaid', () => {
  test('marks pending orders paid and records commission once', async () => {
    const memory = createMemoryDeps(createOrder());

    const first = await claimOrderPaid(
      { orderId: 'order_1', metadata: { paymentId: 'pay_1' }, providerOrderId: 'prov_1' },
      memory.deps
    );
    const replay = await claimOrderPaid(
      { orderId: 'order_1', metadata: { paymentId: 'pay_1' } },
      memory.deps
    );

    expect(first.status).toBe('claimed');
    expect(first.order?.status).toBe(orderStatus.PAID);
    expect(first.order?.providerOrderId).toBe('prov_1');
    expect(first.order?.metadata).toEqual({ referralCode: 'abc', paymentId: 'pay_1' });
    expect(replay.status).toBe('already_paid');
    expect(memory.commissionCalls).toBe(1);
  });

  test('allows failed and canceled orders to become paid', async () => {
    const failed = createMemoryDeps(createOrder({ status: orderStatus.FAILED }));
    const canceled = createMemoryDeps(createOrder({ id: 'order_2', status: orderStatus.CANCELED }));

    await expect(claimOrderPaid({ orderId: 'order_1' }, failed.deps)).resolves.toMatchObject({
      status: 'claimed',
    });
    await expect(claimOrderPaid({ orderId: 'order_2' }, canceled.deps)).resolves.toMatchObject({
      status: 'claimed',
    });
  });

  test('ignores refunded orders and missing orders', async () => {
    const refunded = createMemoryDeps(createOrder({ status: orderStatus.REFUNDED }));
    const missing = createMemoryDeps();

    await expect(claimOrderPaid({ orderId: 'order_1' }, refunded.deps)).resolves.toMatchObject({
      status: 'ignored',
    });
    await expect(claimOrderPaid({ orderId: 'order_1' }, missing.deps)).resolves.toEqual({
      status: 'not_found',
    });
    expect(refunded.commissionCalls).toBe(0);
    expect(missing.commissionCalls).toBe(0);
  });

  test('treats a lost race as already_paid when the row is paid', async () => {
    const order = createOrder();
    const memory = createMemoryDeps(order);
    const originalTryMarkPaid = memory.deps.tryMarkPaid;

    memory.deps.tryMarkPaid = async (orderId, patch, claimableStatuses) => {
      order.status = orderStatus.PAID;
      memory.orders.set(orderId, { ...order });
      return originalTryMarkPaid(orderId, patch, claimableStatuses);
    };

    const result = await claimOrderPaid({ orderId: 'order_1' }, memory.deps);
    expect(result.status).toBe('already_paid');
    expect(memory.commissionCalls).toBe(0);
  });
});

describe('ensureCreditsForOrder', () => {
  test('grants purchase credits once across webhook retries', async () => {
    const memory = createMemoryDeps(createOrder());

    await expect(ensureCreditsForOrder(creditInput, memory.deps)).resolves.toBe('granted');
    await expect(ensureCreditsForOrder(creditInput, memory.deps)).resolves.toBe('already_granted');
    expect(memory.addCreditPayloads).toHaveLength(1);
    expect(memory.addCreditPayloads[0]).toMatchObject({
      orderId: 'order_1',
      credits: 100,
      provider: 'waffo',
    });
  });

  test('retries a grant after the order is already paid and the first grant failed', async () => {
    const memory = createMemoryDeps(createOrder());

    const claim = await claimOrderPaid({ orderId: 'order_1' }, memory.deps);
    expect(claim.status).toBe('claimed');

    memory.failNextGrant();
    await expect(ensureCreditsForOrder(creditInput, memory.deps)).rejects.toThrow('grant failed');

    memory.allowGrant();
    const replayClaim = await claimOrderPaid({ orderId: 'order_1' }, memory.deps);
    expect(replayClaim.status).toBe('already_paid');
    expect(shouldFulfillNewEntitlements(replayClaim)).toBe(false);

    await expect(ensureCreditsForOrder(creditInput, memory.deps)).resolves.toBe('granted');
    await expect(ensureCreditsForOrder(creditInput, memory.deps)).resolves.toBe('already_granted');
    expect(memory.addCreditPayloads).toHaveLength(1);
    expect(memory.commissionCalls).toBe(1);
  });

  test('treats a concurrent unique-violation as already granted', async () => {
    const memory = createMemoryDeps(createOrder());
    memory.deps.hasPurchaseForOrder = async () => false;

    const [first, second] = await Promise.all([
      ensureCreditsForOrder(creditInput, memory.deps),
      ensureCreditsForOrder(creditInput, memory.deps),
    ]);

    expect(new Set([first, second])).toEqual(new Set(['granted', 'already_granted']));
    expect(memory.addCreditPayloads).toHaveLength(1);
  });
});
