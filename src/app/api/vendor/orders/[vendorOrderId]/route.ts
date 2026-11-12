import { NextResponse } from "next/server";

import { serializeVendorOrder } from "@/features/orders/application/vendor-order.serializer";
import { updateVendorOrderStatusSchema } from "@/features/orders/domain/schemas";
import {
  getVendorOrder,
  isValidStatusTransition,
  updateVendorOrderStatus,
} from "@/features/orders/infrastructure/vendor-orders.admin.repository";
import {
  apiError,
  apiForbidden,
  apiGenericError,
  apiUnauthorized,
} from "@/lib/api/response";
import { getActiveVendorApiContext } from "@/lib/auth/require-vendor-api";
import { Strings } from "@/constants/strings";

type RouteContext = {
  params: Promise<{ vendorOrderId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const apiContext = await getActiveVendorApiContext();
  if (!apiContext) return apiUnauthorized();

  try {
    const { vendorOrderId } = await context.params;
    const order = await getVendorOrder(apiContext.vendorId, vendorOrderId);
    if (!order) return apiError(Strings.errors.notFound, 404);

    return NextResponse.json({ order: serializeVendorOrder(order) });
  } catch {
    return apiGenericError();
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const apiContext = await getActiveVendorApiContext();
  if (!apiContext) return apiUnauthorized();

  if (apiContext.session.sessionKind !== "active") {
    return apiForbidden();
  }

  try {
    const { vendorOrderId } = await context.params;
    const payload = updateVendorOrderStatusSchema.parse(await request.json());

    const existing = await getVendorOrder(apiContext.vendorId, vendorOrderId);
    if (!existing) return apiError(Strings.errors.notFound, 404);

    if (existing.holdState === "held") {
      return apiError(Strings.orders.holdBannerMessage, 409);
    }

    if (!isValidStatusTransition(existing.status, payload.status)) {
      return apiError(Strings.orders.invalidStatusTransition, 400);
    }

    const order = await updateVendorOrderStatus(
      apiContext.vendorId,
      vendorOrderId,
      apiContext.uid,
      payload,
    );

    if (!order) return apiError(Strings.errors.generic, 400);

    return NextResponse.json({ order: serializeVendorOrder(order) });
  } catch {
    return apiGenericError();
  }
}
