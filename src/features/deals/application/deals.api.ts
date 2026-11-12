import {
  BRANCH_DEAL_SOURCES,
  CURRENT_DEAL_SOURCES,
  DEAL_TYPES,
  type BranchDealRow,
  type BranchDealSource,
  type CurrentDeal,
  type CurrentDealSource,
  type DealTerms,
  type DealType,
  type FeeBase,
  type FeeModel,
  type VendorDealView,
} from "@/features/deals/domain/types";
import { invokeGetMyVendorDeal } from "@/features/deals/infrastructure/deals.callables";

/** Standard rate when the response carries no usable default percent. */
export const FALLBACK_DEFAULT_PERCENT = 10;

type Raw = Record<string, unknown>;

function asRecord(value: unknown): Raw | null {
  return value && typeof value === "object" ? (value as Raw) : null;
}

function toPiastres(value: unknown): number {
  const n = Math.trunc(Number(value));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function toPercent(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 100) : 0;
}

function toOptionalMs(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Math.trunc(Number(value));
  return Number.isFinite(n) ? n : null;
}

function toText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function pick<T extends string>(options: readonly T[], value: unknown, fallback: T): T {
  return options.find((option) => option === value) ?? fallback;
}

function mapTerms(raw: Raw): DealTerms {
  return {
    type: pick<DealType>(DEAL_TYPES, raw.type, "percentage"),
    fixedFeePerOrderPiastres: toPiastres(raw.fixedFeePerOrderPiastres),
    percentage: toPercent(raw.percentage),
  };
}

function mapVendorDeal(raw: unknown): DealTerms | null {
  const item = asRecord(raw);
  return item ? mapTerms(item) : null;
}

function mapCurrent(raw: unknown, feeModel: FeeModel, defaultPercent: number): CurrentDeal {
  const item = asRecord(raw);
  const fallbackSource: CurrentDealSource = feeModel === "legacy" ? "legacy" : "default";
  if (!item) {
    return {
      source: fallbackSource,
      type: "percentage",
      fixedFeePerOrderPiastres: 0,
      percentage: defaultPercent,
      feeBase: feeModel === "legacy" ? "order_total" : "items",
    };
  }
  const feeBase: FeeBase = item.feeBase === "order_total" ? "order_total" : "items";
  return {
    source: pick<CurrentDealSource>(CURRENT_DEAL_SOURCES, item.source, fallbackSource),
    ...mapTerms(item),
    feeBase,
  };
}

function mapBranch(raw: unknown, current: CurrentDeal): BranchDealRow | null {
  const item = asRecord(raw);
  const branchId = item ? toText(item.branchId) : "";
  if (!item || !branchId) return null;
  const deal = asRecord(item.deal);
  return {
    branchId,
    name: toText(item.name),
    status: item.status === "archived" ? "archived" : "active",
    deal: deal
      ? {
          source: pick<BranchDealSource>(BRANCH_DEAL_SOURCES, deal.source, current.source),
          ...mapTerms(deal),
        }
      : {
          source: current.source,
          type: current.type,
          fixedFeePerOrderPiastres: current.fixedFeePerOrderPiastres,
          percentage: current.percentage,
        },
  };
}

/** Maps the deal callable response. Unusable branch rows are dropped. */
export function mapVendorDealView(raw: unknown): VendorDealView {
  const data = asRecord(raw) ?? {};
  const defaultPercent = toPercent(data.defaultPercent) || FALLBACK_DEFAULT_PERCENT;
  const feeModel: FeeModel = data.feeModel === "items_only" ? "items_only" : "legacy";
  const vendorDeal = mapVendorDeal(data.vendorDeal);
  const current = mapCurrent(data.current, feeModel, defaultPercent);
  const branches = Array.isArray(data.branches)
    ? data.branches
        .map((branch) => mapBranch(branch, current))
        .filter((branch): branch is BranchDealRow => branch !== null)
    : [];
  return {
    vendorType: toText(data.vendorType) || "store",
    defaultPercent,
    feeModel,
    itemsOnlyFromMs: toOptionalMs(data.itemsOnlyFromMs),
    vendorDeal,
    effectiveFromMs: vendorDeal ? toOptionalMs(data.effectiveFromMs) : null,
    // Without a deal there is nothing upcoming; an unreadable flag reads as in force.
    dealActive: vendorDeal ? data.dealActive !== false : false,
    applyToAllBranches:
      typeof data.applyToAllBranches === "boolean" ? data.applyToAllBranches : null,
    current,
    branches,
  };
}

export async function fetchVendorDeal(): Promise<VendorDealView> {
  return mapVendorDealView(await invokeGetMyVendorDeal());
}
