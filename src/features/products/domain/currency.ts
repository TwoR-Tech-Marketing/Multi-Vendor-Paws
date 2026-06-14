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

export function formatEgp(piastres: number): string {
  return piastresToEgp(piastres).toLocaleString("en-EG", {
    style: "currency",
    currency: APP_CURRENCY,
    maximumFractionDigits: 2,
  });
}
