import { egpToPiastres } from "@/features/products/domain/currency";

function readNumber(record: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }
  return null;
}

/**
 * Reads a money field that may be stored as piastres (int) or EGP (float).
 * Piastres keys are checked first; EGP keys are multiplied by 100.
 */
export function readPiastresAmount(
  record: Record<string, unknown>,
  piastresKeys: string[],
  egpKeys: string[],
): number {
  const fromPiastres = readNumber(record, piastresKeys);
  if (fromPiastres !== null) {
    return Math.max(0, Math.round(fromPiastres));
  }

  const fromEgp = readNumber(record, egpKeys);
  if (fromEgp !== null) {
    return egpToPiastres(fromEgp);
  }

  return 0;
}

/** Mobile / legacy line items store `price` in EGP; portal-native items use `*Piastres`. */
export function readLineItemUnitPricePiastres(row: Record<string, unknown>): number {
  return readPiastresAmount(row, ["unitPricePiastres", "pricePiastres"], ["price", "unitPrice"]);
}

export function readOrderDeliveryFeePiastres(orderData: Record<string, unknown>): number {
  return readPiastresAmount(orderData, ["deliveryFeePiastres"], ["deliveryFee", "shippingFee"]);
}

export function readOrderDiscountPiastres(orderData: Record<string, unknown>): number {
  return readPiastresAmount(orderData, ["discountPiastres"], ["discount"]);
}
