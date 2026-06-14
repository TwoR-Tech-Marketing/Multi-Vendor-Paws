import { NextResponse } from "next/server";

import type { VendorOrder, VendorOrderListFilter, VendorOrderStatus } from "@/features/orders/domain/types";
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

function parseListFilter(searchParams: URLSearchParams): VendorOrderListFilter {
  const status = searchParams.get("status");
  const validStatuses: Array<VendorOrderStatus | "any"> = [
    "any",
    "pending",
    "confirmed",
    "shipped",
    "delivered",
    "cancelled",
  ];

  return {
    status:
      status && validStatuses.includes(status as VendorOrderStatus)
        ? (status as VendorOrderStatus)
        : undefined,
    cursor: searchParams.get("cursor") ?? undefined,
    pageSize: searchParams.get("pageSize")
      ? Number(searchParams.get("pageSize"))
      : undefined,
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
      total: page.items.length,
    });
  } catch {
    return apiGenericError();
  }
}
