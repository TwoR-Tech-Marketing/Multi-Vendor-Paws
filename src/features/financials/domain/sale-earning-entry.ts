import type { VendorOrder } from "@/features/orders/domain/types";

/**
 * Sale ledger row built for a delivered vendor order. Mirrors the shared
 * functions writer (`functions/lib/vendor_ledger.js`): same amounts, same
 * entry id, and the fee fields for `items_only` orders. Money is integer
 * piastres. `createdAt` is added by the writer.
 */
export type SaleEarningEntryDoc = {
  vendorId: string;
  type: "sale";
  amountPiastres: number;
  commissionPiastres: number;
  netPiastres: number;
  vendorOrderId: string;
  orderId: string | null;
  description: string;
  currency: "EGP";
  createdBy: string;
  feeModel?: "items_only";
  platformFeePiastres?: number | null;
  vendorNetPiastres?: number | null;
  itemsPiastres?: number | null;
  deliveryFeePiastres?: number | null;
  discountPiastres?: number | null;
  couponFunding?: string | null;
  dealType?: string | null;
};

function optionalPiastres(value: number | null | undefined): number | null {
  if (value === undefined || value === null) return null;
  const n = Math.trunc(Number(value));
  return Number.isFinite(n) ? n : null;
}

/** Deterministic sale entry id, shared with the functions writer. */
export function saleEarningEntryId(vendorOrderId: string): string {
  return `sale_${vendorOrderId}`;
}

export function resolveSaleEarningAmounts(vendorOrder: VendorOrder): {
  amountPiastres: number;
  commissionPiastres: number;
  netPiastres: number;
} {
  const amountPiastres = vendorOrder.totalPiastres;
  const storedCommission = vendorOrder.commissionPiastres ?? 0;
  const commissionPiastres =
    storedCommission > 0
      ? storedCommission
      : vendorOrder.commissionRatePercent > 0
        ? Math.round((amountPiastres * vendorOrder.commissionRatePercent) / 100)
        : 0;

  const storedNet = vendorOrder.netPiastres ?? 0;
  const netPiastres =
    storedNet > 0 && storedNet <= amountPiastres && storedCommission > 0
      ? storedNet
      : amountPiastres - commissionPiastres;

  return { amountPiastres, commissionPiastres, netPiastres };
}

/** Fee fields stored on `items_only` sale rows; empty for legacy orders. */
export function saleEarningDl1Fields(
  vendorOrder: VendorOrder,
): Partial<SaleEarningEntryDoc> {
  if (vendorOrder.feeModel !== "items_only") return {};
  return {
    feeModel: "items_only",
    platformFeePiastres: optionalPiastres(vendorOrder.platformFeePiastres),
    vendorNetPiastres: optionalPiastres(vendorOrder.vendorNetPiastres),
    itemsPiastres: optionalPiastres(vendorOrder.subtotalPiastres),
    deliveryFeePiastres: optionalPiastres(vendorOrder.deliveryFeePiastres),
    discountPiastres: optionalPiastres(vendorOrder.discountPiastres),
    couponFunding:
      typeof vendorOrder.couponFunding === "string" ? vendorOrder.couponFunding : null,
    dealType: typeof vendorOrder.dealType === "string" ? vendorOrder.dealType : null,
  };
}

export function buildSaleEarningEntry(
  vendorOrder: VendorOrder,
  actorUid: string,
): SaleEarningEntryDoc {
  const orderId = vendorOrder.orderId ? vendorOrder.orderId : null;
  const label = (orderId ?? vendorOrder.vendorOrderId).slice(0, 8).toUpperCase();
  return {
    vendorId: vendorOrder.vendorId,
    type: "sale",
    ...resolveSaleEarningAmounts(vendorOrder),
    vendorOrderId: vendorOrder.vendorOrderId,
    orderId,
    description: `Order ${label}`,
    currency: "EGP",
    createdBy: actorUid || "system",
    ...saleEarningDl1Fields(vendorOrder),
  };
}
