import { describe, expect, test } from 'vitest';
import { DuplicatePurchaseOrderError, isPurchaseOrderUniqueViolation } from '@libs/credits/errors';

describe('isPurchaseOrderUniqueViolation', () => {
  test('matches DuplicatePurchaseOrderError', () => {
    expect(isPurchaseOrderUniqueViolation(new DuplicatePurchaseOrderError('order_1'))).toBe(true);
  });

  test('matches postgres unique violations on the purchase-order index', () => {
    expect(isPurchaseOrderUniqueViolation({
      code: '23505',
      constraint: 'credit_transaction_purchase_order_id_idx',
      message: 'duplicate key value violates unique constraint "credit_transaction_purchase_order_id_idx"',
    })).toBe(true);
  });

  test('matches sqlite unique violations on credit_transaction.order_id', () => {
    expect(isPurchaseOrderUniqueViolation({
      code: 'SQLITE_CONSTRAINT_UNIQUE',
      message: 'UNIQUE constraint failed: credit_transaction.order_id',
    })).toBe(true);
  });

  test('does not match primary-key collisions', () => {
    expect(isPurchaseOrderUniqueViolation({
      code: '23505',
      constraint: 'credit_transaction_pkey',
      message: 'duplicate key value violates unique constraint "credit_transaction_pkey"',
    })).toBe(false);
    expect(isPurchaseOrderUniqueViolation({
      message: 'UNIQUE constraint failed: credit_transaction.id',
    })).toBe(false);
  });
});
