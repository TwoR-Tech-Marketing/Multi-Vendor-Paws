import type {
  VendorOrder,
  VendorOrderListFilter,
  VendorOrderStatus,
} from "@/features/orders/domain/types";
import { vendorApiGet, vendorApiPatch } from "@/lib/auth-client";

type VendorOrderResponse = Omit<VendorOrder, "placedAt" | "updatedAt" | "statusHistory"> & {
  placedAt: string;
  updatedAt: string;
  statusHistory: Array<{
    status: VendorOrderStatus;
    at: string;
    by: string;
    note: string | null;
  }>;
};

type VendorOrderListResponse = {
  items: VendorOrderResponse[];
  nextCursor: string | null;
  total: number;
};

function deserializeVendorOrder(order: VendorOrderResponse): VendorOrder {
  return {
    ...order,
    placedAt: new Date(order.placedAt),
    updatedAt: new Date(order.updatedAt),
    statusHistory: order.statusHistory.map((event) => ({
      ...event,
      at: new Date(event.at),
    })),
  };
}

function buildListQuery(filter: VendorOrderListFilter): string {
  const params = new URLSearchParams();
  if (filter.status && filter.status !== "any") params.set("status", filter.status);
  if (filter.query?.trim()) params.set("q", filter.query.trim());
  if (filter.datePreset && filter.datePreset !== "any") {
    params.set("datePreset", filter.datePreset);
  }
  if (filter.dateFrom) params.set("dateFrom", filter.dateFrom);
  if (filter.dateTo) params.set("dateTo", filter.dateTo);
  if (filter.cursor) params.set("cursor", filter.cursor);
  if (filter.pageSize) params.set("pageSize", String(filter.pageSize));
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function fetchVendorOrdersFromApi(
  filter: VendorOrderListFilter = {},
): Promise<{ items: VendorOrder[]; nextCursor: string | null; total: number }> {
  const data = await vendorApiGet<VendorOrderListResponse>(
    `/api/vendor/orders${buildListQuery(filter)}`,
  );

  return {
    items: data.items.map(deserializeVendorOrder),
    nextCursor: data.nextCursor,
    total: data.total,
  };
}

export async function fetchVendorOrderFromApi(vendorOrderId: string): Promise<VendorOrder> {
  const data = await vendorApiGet<{ order: VendorOrderResponse }>(
    `/api/vendor/orders/${vendorOrderId}`,
  );
  return deserializeVendorOrder(data.order);
}

export async function updateVendorOrderStatusFromApi(
  vendorOrderId: string,
  status: VendorOrderStatus,
  note?: string,
): Promise<VendorOrder> {
  const data = await vendorApiPatch<{ order: VendorOrderResponse }>(
    `/api/vendor/orders/${vendorOrderId}`,
    { status, note },
  );
  return deserializeVendorOrder(data.order);
}
