import { mapBranchesError } from "@/features/branches/domain/errors";
import type { Branch, BranchService, DealTerms } from "@/features/branches/domain/types";
import { isScreenVisible } from "@/features/vendor/domain/vendor-type-config";
import { formatEgp } from "@/features/products/domain/currency";
import type { AppStrings } from "@/shared/i18n/types";

/** Localized summary of a deal, for example "EGP 10.00 plus 8% per order". */
export function formatDealTerms(deal: DealTerms, strings: AppStrings): string {
  const copy = strings.deals.branch;
  const amount = formatEgp(deal.fixedFeePerOrderPiastres);
  const percent = String(deal.percentage);
  if (deal.type === "fixed") return copy.fixed.replace("{amount}", amount);
  if (deal.type === "both") {
    return copy.both.replace("{amount}", amount).replace("{percent}", percent);
  }
  return copy.percentage.replace("{percent}", percent);
}

/** Localized copy for any branches callable error. Never the raw message. */
export function branchesErrorMessage(error: unknown, strings: AppStrings): string {
  const key = mapBranchesError(error);
  return key === "generic" ? strings.errors.generic : strings.errors.branches[key];
}

/** Availability is linked from active branches of types that have it. */
export function canOpenAvailability(branch: Branch, vendorType: string | null | undefined): boolean {
  return branch.status === "active" && isScreenVisible(vendorType, "availability");
}

export function serviceDisplayName(service: BranchService, locale: string): string {
  const preferred = locale === "ar" ? service.nameAr : service.nameEn;
  return preferred || service.nameEn || service.nameAr;
}

export function formatServicePrice(pricePiastres: number, strings: AppStrings): string {
  return pricePiastres === 0 ? strings.services.free : formatEgp(pricePiastres);
}
