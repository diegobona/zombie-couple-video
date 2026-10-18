import { describe, expect, test } from 'vitest';
import { orderStatus } from '@libs/database/constants';
import { decideWaffoRecurringFulfillment } from '@libs/payment/waffo-recurring';

const localOrder = {
  id: 'order_1',
  userId: 'user_from_order',
  planId: 'plan_from_order',
  status: orderStatus.PAID,
  metadata: {},
};

describe('decideWaffoRecurringFulfillment', () => {
  test('nacks unknown local orders so Waffo retries instead of inserting', () => {
    expect(decideWaffoRecurringFulfillment(
      { status: 'not_found' },
      { userId: 'webhook_user', planId: 'webhook_plan' }
    )).toEqual({ action: 'nack' });
  });

  test('does not upsert refunded or otherwise ignored claims', () => {
    expect(decideWaffoRecurringFulfillment({
      status: 'ignored',
      order: { ...localOrder, status: orderStatus.REFUNDED },
    })).toEqual({ action: 'ack' });
  });

  test('upserts claimed and already-paid orders using local order ids', () => {
    expect(decideWaffoRecurringFulfillment(
      { status: 'claimed', order: localOrder },
      { userId: 'webhook_user', planId: 'webhook_plan' }
    )).toEqual({
      action: 'upsert',
      userId: 'user_from_order',
      planId: 'plan_from_order',
    });

    expect(decideWaffoRecurringFulfillment({
      status: 'already_paid',
      order: localOrder,
    })).toEqual({
      action: 'upsert',
      userId: 'user_from_order',
      planId: 'plan_from_order',
    });
  });
});
