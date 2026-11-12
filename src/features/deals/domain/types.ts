/**
 * Read only deal view for the signed in vendor. Shapes match the
 * `vendor_deals-getMyVendorDeal` callable. Money is integer piastres,
 * times are epoch milliseconds.
 */

export const DEAL_TYPES = ["fixed", "percentage", "both"] as const;
export type DealType = (typeof DEAL_TYPES)[number];

export const FEE_MODELS = ["items_only", "legacy"] as const;
export type FeeModel = (typeof FEE_MODELS)[number];

export const FEE_BASES = ["items", "order_total"] as const;
export type FeeBase = (typeof FEE_BASES)[number];

export const CURRENT_DEAL_SOURCES = ["vendor", "default", "legacy"] as const;
export type CurrentDealSource = (typeof CURRENT_DEAL_SOURCES)[number];

export const BRANCH_DEAL_SOURCES = ["branch", "apply_all", "vendor", "default", "legacy"] as const;
export type BranchDealSource = (typeof BRANCH_DEAL_SOURCES)[number];

export type DealBranchStatus = "active" | "archived";

export type DealTerms = {
  type: DealType;
  fixedFeePerOrderPiastres: number;
  percentage: number;
};

export type CurrentDeal = DealTerms & {
  source: CurrentDealSource;
  feeBase: FeeBase;
};

export type BranchDealRow = {
  branchId: string;
  name: string;
  status: DealBranchStatus;
  deal: DealTerms & { source: BranchDealSource };
};

export type VendorDealView = {
  vendorType: string;
  defaultPercent: number;
  feeModel: FeeModel;
  itemsOnlyFromMs: number | null;
  vendorDeal: DealTerms | null;
  effectiveFromMs: number | null;
  dealActive: boolean;
  applyToAllBranches: boolean | null;
  current: CurrentDeal;
  branches: BranchDealRow[];
};

/** Vendor types whose deal can differ per branch. */
const BRANCH_VENDOR_TYPES = new Set(["clinic", "groomer"]);

export function hasBranchDeals(vendorType: string): boolean {
  return BRANCH_VENDOR_TYPES.has(vendorType);
}

/** The upcoming card shows only for a deal that is not in force yet. */
export function hasUpcomingDeal(view: VendorDealView): boolean {
  return view.vendorDeal !== null && !view.dealActive;
}
