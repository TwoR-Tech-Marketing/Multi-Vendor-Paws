import type { AppLocale } from "@/shared/preferences/domain/types";

/** Marketplace time zone; every portal date shows Cairo time. */
const CAIRO_TIME_ZONE = "Africa/Cairo";

/** Intl locale for portal dates: Arabic keeps Western digits. */
function intlLocale(locale: AppLocale): string {
  return locale === "ar" ? "ar-EG-u-nu-latn" : "en-EG";
}

/** Date and time in Cairo, medium date and short time, in the portal language. */
export function formatDateTime(date: Date, locale: AppLocale): string {
  return date.toLocaleString(intlLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: CAIRO_TIME_ZONE,
  });
}
