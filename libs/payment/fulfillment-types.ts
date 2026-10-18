export type ClaimOrderPaidStatus = 'not_found' | 'claimed' | 'already_paid' | 'ignored';

export interface PayableOrder {
  id: string;
  userId: string;
  planId: string;
  status: string;
  metadata: unknown;
  providerOrderId?: string | null;
}

export interface ClaimOrderPaidResult {
  status: ClaimOrderPaidStatus;
  order?: PayableOrder;
}

export interface ClaimOrderPaidInput {
  orderId: string;
  metadata?: Record<string, unknown>;
  providerOrderId?: string;
}

export interface EnsureCreditsInput {
  orderId: string;
  userId: string;
  credits: number;
  provider: string;
  planId: string;
  metadata?: Record<string, unknown>;
}

export interface OrderFulfillmentDeps {
  findOrder: (orderId: string) => Promise<PayableOrder | null>;
  tryMarkPaid: (
    orderId: string,
    patch: { metadata: Record<string, unknown>; providerOrderId?: string },
    claimableStatuses: readonly string[]
  ) => Promise<PayableOrder | null>;
  processReferralCommission: (orderId: string) => Promise<void>;
  hasPurchaseForOrder: (orderId: string) => Promise<boolean>;
  addCredits: (input: EnsureCreditsInput) => Promise<void>;
}
