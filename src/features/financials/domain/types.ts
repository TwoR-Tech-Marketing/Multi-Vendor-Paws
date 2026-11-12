export const EARNINGS_ENTRY_TYPES = ["sale", "refund", "adjustment", "payout"] as const;

export type EarningsEntryType = (typeof EARNINGS_ENTRY_TYPES)[number];

export type EarningsEntryFilter = "all" | EarningsEntryType;

export type VendorEarningsEntry = {
  entryId: string;
  vendorId: string;
  type: EarningsEntryType;
  amountPiastres: number;
  commissionPiastres: number;
  netPiastres: number;
  vendorOrderId: string | null;
  orderId: string | null;
  description: string | null;
  currency: "EGP";
  createdAt: Date;
};

export type VendorEarningsSummary = {
  vendorId: string;
  totalSalesPiastres: number;
  totalCommissionPiastres: number;
  netEarningsPiastres: number;
  pendingPayoutPiastres: number;
  currency: "EGP";
  updatedAt: Date;
};

export type VendorEarningsPage = {
  summary: VendorEarningsSummary;
  entries: VendorEarningsEntry[];
};

export type VendorEarningsEntriesPage = {
  entries: VendorEarningsEntry[];
  nextCursor: string | null;
};

export type VendorEarningsOverview = VendorEarningsPage & {
  nextCursor: string | null;
};
