import { CAIRO_TIME_ZONE } from "@/features/orders/lib/cairoDates";
import { mapReviewError } from "@/features/reviews/domain/errors";
import type { LocalizedServiceName, VendorReview } from "@/features/reviews/domain/types";
import type { AppStrings } from "@/shared/i18n/types";

/** Localized copy for any review callable error. Never the raw message. */
export function reviewErrorMessage(error: unknown, strings: AppStrings): string {
  const key = mapReviewError(error);
  return key === "generic" ? strings.errors.generic : strings.errors.reviews[key];
}

/** First name, or the anonymous label. Never anything else about the buyer. */
export function buyerLabel(review: Pick<VendorReview, "firstName">, strings: AppStrings): string {
  return review.firstName ?? strings.reviews.anonymous;
}

export function serviceName(name: LocalizedServiceName, locale: string): string {
  return locale === "ar" ? name.nameAr || name.nameEn : name.nameEn || name.nameAr;
}

/** Cairo calendar date, Western digits in both languages. */
export function formatReviewDate(ms: number | null, locale: string): string {
  if (ms === null) return "";
  return new Date(ms).toLocaleDateString(locale === "ar" ? "ar-EG-u-nu-latn" : "en", {
    dateStyle: "medium",
    timeZone: CAIRO_TIME_ZONE,
  });
}
