import { formatEgp } from "@/features/products/domain/currency";

/** Formats integer piastres with a leading minus for refunds, payouts and negative adjustments. */
export function formatSignedEgp(piastres: number): string {
  return piastres < 0 ? `-${formatEgp(-piastres)}` : formatEgp(piastres);
}
