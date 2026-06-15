import { NextResponse } from "next/server";

import type {
  OrderDatePreset,
  VendorOrder,
  VendorOrderListFilter,
  VendorOrderStatus,
} from "@/features/orders/domain/types";
import { listVendorOrders } from "@/features/orders/infrastructure/vendor-orders.admin.repository";
import { apiGenericError, apiUnauthorized } from "@/lib/api/response";
import { getActiveVendorApiContext } from "@/lib/auth/require-vendor-api";

function serializeVendorOrder(order: VendorOrder) {
  return {
    ...order,
    placedAt: order.placedAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    statusHistory: order.statusHistory.map((event) => ({
      ...event,
      at: event.at.toISOString(),
    })),
  };
}

const VALID_STATUSES: Array<VendorOrderStatus | "any"> = [
  "any",
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

const VALID_DATE_PRESETS: OrderDatePreset[] = [
  "any",
  "today",
  "yesterday",
  "last7",
  "last30",
  "custom",
];

function parseListFilter(searchParams: URLSearchParams): VendorOrderListFilter {
  const status = searchParams.get("status");
  const datePreset = searchParams.get("datePreset");
  const pageSizeParam = searchParams.get("pageSize");
  const pageSize = pageSizeParam ? Number(pageSizeParam) : undefined;

  return {
    status:
      status && VALID_STATUSES.includes(status as VendorOrderStatus)
        ? (status as VendorOrderStatus)
        : undefined,
    query: searchParams.get("q") ?? undefined,
    datePreset:
      datePreset && VALID_DATE_PRESETS.includes(datePreset as OrderDatePreset)
        ? (datePreset as OrderDatePreset)
        : undefined,
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
    cursor: searchParams.get("cursor") ?? undefined,
    pageSize: Number.isFinite(pageSize) ? pageSize : undefined,
  };
}

export async function GET(request: Request) {
  const context = await getActiveVendorApiContext();
  if (!context) return apiUnauthorized();

  try {
    const filter = parseListFilter(new URL(request.url).searchParams);
    const page = await listVendorOrders(context.vendorId, filter);

    return NextResponse.json({
      items: page.items.map(serializeVendorOrder),
      nextCursor: page.nextCursor,
      total: page.total,
    });
  } catch {
    return apiGenericError();
  }
}
