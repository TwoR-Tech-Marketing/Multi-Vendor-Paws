import { mapCouponsError } from "@/features/coupons/domain/errors";
import type { Coupon } from "@/features/coupons/domain/types";
import { formatEgp } from "@/features/products/domain/currency";
import type { AppStrings } from "@/shared/i18n/types";
import { formatDate } from "@/shared/lib/format-date";
import type { AppLocale } from "@/shared/preferences/domain/types";

/** "15% off" or "50.00 EGP off". */
export function formatCouponValue(
  coupon: Pick<Coupon, "type" | "value">,
  strings: AppStrings,
  locale: AppLocale,
) {
  const copy = strings.coupons.value;
  return coupon.type === "percentage"
    ? copy.percentage.replace("{value}", String(coupon.value))
    : copy.fixed.replace("{amount}", formatEgp(coupon.value, locale));
}

/** Cap and minimum order line, empty when neither applies. */
export function formatCouponConditions(
  coupon: Pick<Coupon, "type" | "maxDiscountPiastres" | "minOrderPiastres">,
  strings: AppStrings,
  locale: AppLocale,
): string {
  const copy = strings.coupons.value;
  const parts: string[] = [];
  if (coupon.type === "percentage" && coupon.maxDiscountPiastres !== null) {
    parts.push(copy.cap.replace("{amount}", formatEgp(coupon.maxDiscountPiastres, locale)));
  }
  if (coupon.minOrderPiastres > 0) {
    parts.push(copy.minOrder.replace("{amount}", formatEgp(coupon.minOrderPiastres, locale)));
  }
  return parts.join(" · ");
}

/** "3 of 100" or "3 used" when there is no total limit. */
export function formatCouponUsage(
  coupon: Pick<Coupon, "usedCount" | "totalLimit">,
  strings: AppStrings,
): string {
  const copy = strings.coupons.usage;
  const used = String(coupon.usedCount);
  return coupon.totalLimit === null
    ? copy.summaryUnlimited.replace("{used}", used)
    : copy.summary.replace("{used}", used).replace("{total}", String(coupon.totalLimit));
}

/** Cairo calendar date with Western digits in both locales. */
export function formatCouponDate(ms: number | null, locale: string): string {
  if (ms === null) return "";
  return formatDate(new Date(ms), locale === "ar" ? "ar" : "en");
}

/** Localized copy for any coupons callable error. Never the raw message. */
export function couponsErrorMessage(error: unknown, strings: AppStrings): string {
  const key = mapCouponsError(error);
  if (key === "generic") return strings.errors.generic;
  if (key === "limit") return strings.coupons.limitReached;
  return strings.errors.coupons[key];
}
