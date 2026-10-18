/**
 * Thrown when a second purchase ledger insert hits the
 * credit_transaction purchase-order unique index.
 */
export class DuplicatePurchaseOrderError extends Error {
  readonly orderId: string;

  constructor(orderId: string) {
    super(`Purchase credits already granted for order ${orderId}`);
    this.name = 'DuplicatePurchaseOrderError';
    this.orderId = orderId;
  }
}

function collectErrorText(error: unknown): { code: string; constraint: string; message: string } {
  if (!error || typeof error !== 'object') {
    return { code: '', constraint: '', message: '' };
  }

  const err = error as {
    name?: string;
    code?: string | number;
    constraint?: string;
    message?: string;
    cause?: unknown;
  };

  const nested = err.cause ? collectErrorText(err.cause) : { code: '', constraint: '', message: '' };
  return {
    code: String(err.code ?? nested.code ?? ''),
    constraint: `${err.constraint ?? ''} ${nested.constraint}`.trim(),
    message: `${err.message ?? ''} ${nested.message}`.trim(),
  };
}

/**
 * True when the DB rejected a second purchase row for the same order_id.
 * PK collisions on credit_transaction.id must not match.
 */
export function isPurchaseOrderUniqueViolation(error: unknown): boolean {
  if (error instanceof DuplicatePurchaseOrderError) {
    return true;
  }
  if (typeof error === 'object' && error !== null && (error as { name?: string }).name === 'DuplicatePurchaseOrderError') {
    return true;
  }

  const { code, constraint, message } = collectErrorText(error);
  const haystack = `${constraint} ${message}`;

  if (haystack.includes('credit_transaction_purchase_order_id')) {
    return true;
  }

  if (code === '23505' && /order_id/i.test(haystack)) {
    return true;
  }

  if (/UNIQUE constraint failed:\s*credit_transaction\.order_id/i.test(haystack)) {
    return true;
  }

  if ((code === 'SQLITE_CONSTRAINT_UNIQUE' || code === 'SQLITE_CONSTRAINT') && /credit_transaction\.order_id/i.test(haystack)) {
    return true;
  }

  return false;
}
