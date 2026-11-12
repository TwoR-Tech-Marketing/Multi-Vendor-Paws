import type {
  OrderDatePreset,
  VendorOrder,
  VendorOrderStatus,
} from "@/features/orders/domain/types";
import { resolveCairoDateRange } from "@/features/orders/lib/cairoDates";
import type { AppStrings } from "@/shared/i18n/types";

export type OrderListFilters = {
  status: VendorOrderStatus | "any";
  datePreset: OrderDatePreset;
  dateFrom: string;
  dateTo: string;
};

export const EMPTY_ORDER_LIST_FILTERS: OrderListFilters = {
  status: "any",
  datePreset: "any",
  dateFrom: "",
  dateTo: "",
};

export function resolveOrderDateBounds(
  filters: Pick<OrderListFilters, "datePreset" | "dateFrom" | "dateTo">,
  now = new Date(),
): { from: Date | null; to: Date | null } {
  const range = resolveCairoDateRange(filters, now.getTime());
  return {
    from: range?.fromMs == null ? null : new Date(range.fromMs),
    to: range?.toMs == null ? null : new Date(range.toMs),
  };
}

export function orderMatchesDateFilter(
  placedAt: Date,
  filters: Pick<OrderListFilters, "datePreset" | "dateFrom" | "dateTo">,
  now = new Date(),
): boolean {
  if (filters.datePreset === "any") return true;

  const { from, to } = resolveOrderDateBounds(filters, now);
  const timestamp = placedAt.getTime();

  if (from && timestamp < from.getTime()) return false;
  if (to && timestamp > to.getTime()) return false;
  return true;
}

function formatPiastresForSearch(piastres: number): string {
  return (piastres / 100).toFixed(2);
}

function buildOrderSearchHaystack(order: VendorOrder): string[] {
  const shortRef = order.orderId.slice(0, 8).toUpperCase();

  return [
    order.orderId,
    order.vendorOrderId,
    shortRef,
    `#${shortRef}`,
    order.buyerUid,
    order.buyerDisplayName ?? "",
    order.buyerPhone ?? "",
    order.deliveryAddress ?? "",
    order.paymentMethod ?? "",
    order.vendorStoreName ?? "",
    order.status,
    String(order.itemCount),
    String(order.subtotalPiastres),
    String(order.deliveryFeePiastres),
    String(order.discountPiastres),
    String(order.totalPiastres),
    String(order.commissionPiastres),
    String(order.netPiastres),
    formatPiastresForSearch(order.subtotalPiastres),
    formatPiastresForSearch(order.totalPiastres),
    formatPiastresForSearch(order.netPiastres),
    ...order.lineItems.flatMap((item) => [
      item.name,
      item.productId,
      String(item.quantity),
      String(item.unitPricePiastres),
      String(item.lineTotalPiastres),
      formatPiastresForSearch(item.unitPricePiastres),
      formatPiastresForSearch(item.lineTotalPiastres),
    ]),
    ...order.statusHistory.flatMap((event) => [
      event.status,
      event.note ?? "",
    ]),
  ]
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
}

export function orderMatchesSearchQuery(order: VendorOrder, rawQuery: string): boolean {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return true;

  const haystack = buildOrderSearchHaystack(order);
  return haystack.some((part) => part.includes(query));
}

export function countActiveOrderFilters(filters: OrderListFilters): number {
  let count = 0;
  if (filters.status !== "any") count += 1;
  if (filters.datePreset !== "any") count += 1;
  return count;
}

export function getOrderDatePresetLabel(
  preset: OrderDatePreset,
  strings: AppStrings,
): string {
  switch (preset) {
    case "today":
      return strings.orders.datePresetToday;
    case "yesterday":
      return strings.orders.datePresetYesterday;
    case "last7":
      return strings.orders.datePresetLast7;
    case "last30":
      return strings.orders.datePresetLast30;
    case "custom":
      return strings.orders.datePresetCustom;
    default:
      return strings.orders.filterAllDates;
  }
}

export function getOrderFilterChipLabels(
  filters: OrderListFilters,
  strings: AppStrings,
): string[] {
  const chips: string[] = [];

  if (filters.status !== "any") {
    chips.push(strings.orders.statusLabels[filters.status]);
  }

  if (filters.datePreset !== "any") {
    if (filters.datePreset === "custom" && (filters.dateFrom || filters.dateTo)) {
      const from = filters.dateFrom || "…";
      const to = filters.dateTo || "…";
      chips.push(
        strings.orders.dateRangeChip
          .replace("{from}", from)
          .replace("{to}", to),
      );
    } else {
      chips.push(getOrderDatePresetLabel(filters.datePreset, strings));
    }
  }

  return chips;
}
