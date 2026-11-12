/**
 * Rating display helpers. The server sends averages as integer tenths
 * (half up already applied); clients only format them. Western digits in
 * both languages.
 */

/** 43 -> "4.3", 50 -> "5.0", null -> "". */
export function formatTenths(tenths: number | null): string {
  if (tenths === null || !Number.isFinite(tenths)) return "";
  const value = Math.max(0, Math.trunc(tenths));
  return `${Math.floor(value / 10)}.${value % 10}`;
}

/** Whole stars to fill for tenths, half up (4.5 fills 5). */
export function filledStars(tenths: number | null): number {
  if (tenths === null || !Number.isFinite(tenths)) return 0;
  return Math.min(5, Math.max(0, Math.floor((Math.trunc(tenths) + 5) / 10)));
}

/** Bar fill for an average in tenths on the 1 to 5 scale, as 0 to 100. */
export function ratingBarPercent(tenths: number | null): number {
  if (tenths === null || !Number.isFinite(tenths)) return 0;
  return Math.min(100, Math.max(0, 2 * Math.trunc(tenths)));
}
