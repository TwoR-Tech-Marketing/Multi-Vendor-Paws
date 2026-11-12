import type { AppLocale } from "@/shared/preferences/domain/types";

/** Cairo calendar date with Western digits in both languages. */
export function formatCairoDate(ms: number, locale: AppLocale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB", {
    timeZone: "Africa/Cairo",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(ms));
}

/** Fills a "{start} ... {end}" template with the Cairo dates of a period. */
export function formatPeriodRange(
  template: string,
  startMs: number,
  endMs: number,
  locale: AppLocale,
): string {
  return template
    .replace("{start}", formatCairoDate(startMs, locale))
    .replace("{end}", formatCairoDate(endMs, locale));
}
