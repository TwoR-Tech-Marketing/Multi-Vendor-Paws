export type EarningsEntryType = "sale" | "refund" | "adjustment" | "payout";

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
