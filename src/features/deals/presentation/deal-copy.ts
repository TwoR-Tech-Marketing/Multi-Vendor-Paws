import { formatDealPercent } from "@/features/deals/domain/percent";
import type { BranchDealSource, DealTerms } from "@/features/deals/domain/types";
import { formatEgp } from "@/features/products/domain/currency";
import type { AppStrings } from "@/shared/i18n/types";

type SourceKey = keyof AppStrings["deals"]["source"];

const SOURCE_KEYS: Record<BranchDealSource, SourceKey> = {
  branch: "branch",
  apply_all: "applyAll",
  vendor: "vendor",
  default: "default",
  legacy: "legacy",
};

/** Localized label of where a fee comes from. */
export function dealSourceLabel(source: BranchDealSource, strings: AppStrings): string {
  return strings.deals.source[SOURCE_KEYS[source]];
}

/** Localized one line summary of deal terms, for example "EGP 10.00 plus 8% per order". */
export function formatDealTermsLine(terms: DealTerms, strings: AppStrings): string {
  const copy = strings.deals.branch;
  const amount = formatEgp(terms.fixedFeePerOrderPiastres);
  const percent = formatDealPercent(terms.percentage);
  if (terms.type === "fixed") return copy.fixed.replace("{amount}", amount);
  if (terms.type === "both") return copy.both.replace("{amount}", amount).replace("{percent}", percent);
  return copy.percentage.replace("{percent}", percent);
}

/** Percentage with its sign, Western digits in both languages. */
export function formatPercentValue(percentage: number): string {
  return `${formatDealPercent(percentage)}%`;
}
