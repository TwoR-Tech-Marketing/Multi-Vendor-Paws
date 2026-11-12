import type { AppLocale } from "@/shared/preferences/domain/types";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function intlLocale(locale: AppLocale): string {
  return locale === "ar" ? "ar-EG-u-nu-latn" : "en";
}

/** Short relative time with Western digits; older than a week shows the Cairo date. */
export function formatRelativeTime(
  date: Date,
  now: Date,
  locale: AppLocale,
  justNow: string,
): string {
  const diff = now.getTime() - date.getTime();
  if (diff < MINUTE) return justNow;
  const rtf = new Intl.RelativeTimeFormat(intlLocale(locale), { numeric: "auto" });
  if (diff < HOUR) return rtf.format(-Math.floor(diff / MINUTE), "minute");
  if (diff < DAY) return rtf.format(-Math.floor(diff / HOUR), "hour");
  if (diff < 7 * DAY) return rtf.format(-Math.floor(diff / DAY), "day");
  return date.toLocaleDateString(intlLocale(locale), {
    dateStyle: "medium",
    timeZone: "Africa/Cairo",
  });
}
