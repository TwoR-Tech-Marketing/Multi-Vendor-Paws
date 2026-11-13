/** App-wide currency. Phase 3 launches EGP-only. */
export const APP_CURRENCY = "EGP" as const;

export type AppCurrency = typeof APP_CURRENCY;

/**
 * All product, order, commission, and earnings amounts are stored as
 * integer **piastres** (1 EGP = 100 piastres). Display and inputs use major
 * units; storage uses minor units. Never store EGP as a float.
 */
export function egpToPiastres(egp: number): number {
  if (!Number.isFinite(egp) || egp < 0) {
    throw new RangeError("Amount must be a non-negative finite number.");
  }
  return Math.round(egp * 100);
}

export function piastresToEgp(piastres: number): number {
  if (!Number.isInteger(piastres) || piastres < 0) {
    throw new RangeError("Piastres must be a non-negative integer.");
  }
  return piastres / 100;
}

/** Currency unit shown after the amount, per portal language. */
export const CURRENCY_UNIT = { en: "EGP", ar: "ج.م" } as const;

/** Left-to-right isolate around the figures so RTL text keeps them together. */
const LRI = "\u2066";
const PDI = "\u2069";

/**
 * Formats integer piastres for display as amount then unit, the same form as
 * the vendor app: "1,500.00 EGP" in English, "1,500.00 ج.م" in Arabic with
 * the figures in a left-to-right isolate. Western digits, two decimals. Never
 * throws: negative amounts get a leading minus sign before the absolute
 * amount, and a non-finite value shows as zero. Fractions of a piastre are
 * truncated.
 */
export function formatEgp(piastres: number, locale: "en" | "ar" | string = "en"): string {
  const value = Number.isFinite(piastres) ? Math.trunc(piastres) : 0;
  const digits = (Math.abs(value) / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const figures = value < 0 ? `-${digits}` : digits;
  if (locale === "ar") return `${LRI}${figures}${PDI} ${CURRENCY_UNIT.ar}`;
  return `${figures} ${CURRENCY_UNIT.en}`;
}
