import { orderStatus } from '@libs/database/constants';
import type {
  ClaimOrderPaidInput,
  ClaimOrderPaidResult,
  ClaimOrderPaidStatus,
  EnsureCreditsInput,
  OrderFulfillmentDeps,
} from './fulfillment-types';

export type {
  ClaimOrderPaidInput,
  ClaimOrderPaidResult,
  ClaimOrderPaidStatus,
  EnsureCreditsInput,
  OrderFulfillmentDeps,
  PayableOrder,
} from './fulfillment-types';

const CLAIMABLE_ORDER_STATUSES = [
  orderStatus.PENDING,
  orderStatus.FAILED,
  orderStatus.CANCELED,
] as const;

export { CLAIMABLE_ORDER_STATUSES };

let cachedDefaultDeps: OrderFulfillmentDeps | undefined;

/**
 * Load DB-backed deps lazily so unit tests can inject in-memory deps
 * without initializing Postgres / affiliate / credits at import time.
 */
async function getDefaultDeps(): Promise<OrderFulfillmentDeps> {
  if (cachedDefaultDeps) {
    return cachedDefaultDeps;
  }

  const [
    { db },
    { order },
    { and, eq, inArray },
    { processReferralCommission: processAffiliateCommission },
    { creditService, TransactionTypeCode },
  ] = await Promise.all([
    import('@libs/database'),
    import('@libs/database/schema/order'),
    import('drizzle-orm'),
    import('@libs/affiliate'),
    import('@libs/credits'),
  ]);

  cachedDefaultDeps = {
    async findOrder(orderId) {
      const rows = await db.select().from(order).where(eq(order.id, orderId)).limit(1);
      return rows[0] ?? null;
    },
    async tryMarkPaid(orderId, patch, claimableStatuses) {
      const updated = await db
        .update(order)
        .set({
          status: orderStatus.PAID,
          metadata: patch.metadata,
          ...(patch.providerOrderId ? { providerOrderId: patch.providerOrderId } : {}),
          updatedAt: new Date(),
        })
        .where(and(eq(order.id, orderId), inArray(order.status, [...claimableStatuses])))
        .returning();
      return updated[0] ?? null;
    },
    async processReferralCommission(orderId) {
      await processAffiliateCommission(orderId);
    },
    async hasPurchaseForOrder(orderId) {
      return creditService.hasPurchaseForOrder(orderId);
    },
    async addCredits(input) {
      await creditService.addCredits({
        userId: input.userId,
        amount: input.credits,
        type: 'purchase',
        orderId: input.orderId,
        description: TransactionTypeCode.PURCHASE,
        metadata: {
          ...input.metadata,
          planId: input.planId,
          provider: input.provider,
        },
      });
    },
  };

  return cachedDefaultDeps;
}

/**
 * Parse order.metadata whether it is a JSON object or a serialized string.
 */
export function parseOrderMetadata(raw: unknown): Record<string, unknown> {
  if (!raw) {
    return {};
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
  }
  return {};
}

/**
 * Recurring/one-time inserts should run only on the delivery that won the paid claim.
 * Credit packs always go through ensureCreditsForOrder instead.
 */
export function shouldFulfillNewEntitlements(
  claim: { status: ClaimOrderPaidStatus }
): boolean {
  return claim.status === 'claimed';
}

/**
 * Atomically mark a payable order as paid.
 *
 * - pending / failed / canceled → paid (`claimed`)
 * - already paid → `already_paid` (caller must still ensure credits)
 * - refunded → `ignored`
 */
export async function claimOrderPaid(
  input: ClaimOrderPaidInput,
  deps?: OrderFulfillmentDeps
): Promise<ClaimOrderPaidResult> {
  const resolved = deps ?? await getDefaultDeps();
  const existing = await resolved.findOrder(input.orderId);
  if (!existing) {
    return { status: 'not_found' };
  }

  if (existing.status === orderStatus.PAID) {
    return { status: 'already_paid', order: existing };
  }

  if (existing.status === orderStatus.REFUNDED) {
    return { status: 'ignored', order: existing };
  }

  const mergedMetadata = {
    ...parseOrderMetadata(existing.metadata),
    ...input.metadata,
  };

  const claimed = await resolved.tryMarkPaid(
    input.orderId,
    {
      metadata: mergedMetadata,
      providerOrderId: input.providerOrderId,
    },
    CLAIMABLE_ORDER_STATUSES
  );

  if (!claimed) {
    const latest = await resolved.findOrder(input.orderId);
    if (latest?.status === orderStatus.PAID) {
      return { status: 'already_paid', order: latest };
    }
    return { status: 'ignored', order: latest ?? existing };
  }

  await resolved.processReferralCommission(input.orderId);
  return { status: 'claimed', order: claimed };
}

function isDuplicatePurchaseError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name: string }).name === 'DuplicatePurchaseOrderError'
  );
}

/**
 * Grant purchase credits for an order at most once.
 * Sequential retries skip via the purchase ledger read.
 * Concurrent grants are serialized by the purchase-order unique index;
 * a unique-violation is treated as already granted (the extra balance
 * increment is rolled back with the failed insert).
 */
export async function ensureCreditsForOrder(
  input: EnsureCreditsInput,
  deps?: OrderFulfillmentDeps
): Promise<'granted' | 'already_granted'> {
  const resolved = deps ?? await getDefaultDeps();
  if (await resolved.hasPurchaseForOrder(input.orderId)) {
    return 'already_granted';
  }

  try {
    await resolved.addCredits(input);
    return 'granted';
  } catch (error) {
    if (isDuplicatePurchaseError(error)) {
      return 'already_granted';
    }
    throw error;
  }
}
