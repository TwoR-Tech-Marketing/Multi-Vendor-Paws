export const PAYOUT_CYCLES = ["weekly", "monthly"] as const;

export type PayoutCycle = (typeof PAYOUT_CYCLES)[number];

/** A recorded payout as the vendor sees it. Amount is positive piastres. */
export type StatementPayout = {
  entryId: string;
  periodKey: string | null;
  amountPiastres: number;
  transferReference: string | null;
  paidAtMs: number | null;
  createdAtMs: number;
};

/**
 * One statement period in Africa/Cairo bounds. Sales and fees are positive;
 * refunds, adjustments and payouts are signed sums (payouts are negative).
 * closing = opening + sales - fees + refunds + adjustments + payouts.
 */
export type StatementPeriod = {
  periodKey: string;
  startMs: number;
  endMs: number;
  closed: boolean;
  openingPiastres: number;
  salesPiastres: number;
  feesPiastres: number;
  refundsPiastres: number;
  adjustmentsPiastres: number;
  payoutsPiastres: number;
  closingPiastres: number;
  payouts: StatementPayout[];
};

export type VendorStatement = {
  cycle: PayoutCycle;
  currentBalancePiastres: number;
  /** Newest first. */
  periods: StatementPeriod[];
};
