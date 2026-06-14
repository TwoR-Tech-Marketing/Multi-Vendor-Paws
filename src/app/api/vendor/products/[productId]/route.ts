import { NextResponse } from "next/server";

import { updateProductSchema } from "@/features/products/domain/schemas";
import type { Product } from "@/features/products/domain/types";
import { resolveCategoryNamesByIds } from "@/features/products/infrastructure/categories.admin.repository";
import {
  archiveVendorProduct,
  getVendorProduct,
  updateVendorProduct,
} from "@/features/products/infrastructure/products.admin.repository";
import {
  apiError,
  apiForbidden,
  apiGenericError,
  apiUnauthorized,
} from "@/lib/api/response";
import { getActiveVendorApiContext } from "@/lib/auth/require-vendor-api";
import { Strings } from "@/constants/strings";

type RouteContext = {
  params: Promise<{ productId: string }>;
};

function serializeProduct(product: Product) {
  return {
    ...product,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    analytics: product.analytics
      ? {
          viewCount: product.analytics.viewCount,
          soldCount: product.analytics.soldCount,
          lastSoldAt: product.analytics.lastSoldAt?.toISOString() ?? null,
        }
      : undefined,
  };
}

export async function GET(_request: Request, context: RouteContext) {
  const apiContext = await getActiveVendorApiContext();
  if (!apiContext) return apiUnauthorized();

  try {
    const { productId } = await context.params;
    const product = await getVendorProduct(apiContext.vendorId, productId);

    if (!product || product.status === "archived") {
      return apiError(Strings.errors.notFound, 404);
    }

    return NextResponse.json({ product: serializeProduct(product) });
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
    const { productId } = await context.params;
    const payload = updateProductSchema.parse(await request.json());

    const categoryNames =
      payload.categoryIds !== undefined
        ? await resolveCategoryNamesByIds(payload.categoryIds)
        : undefined;

    const product = await updateVendorProduct(
      {
        vendorId: apiContext.vendorId,
        vendorStoreName: apiContext.session.storeBranding.storeName,
        actorUid: apiContext.uid,
      },
      productId,
      payload,
      categoryNames,
    );

    if (!product) {
      return apiError(Strings.errors.notFound, 404);
    }

    return NextResponse.json({ product: serializeProduct(product) });
  } catch {
    return apiGenericError();
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const apiContext = await getActiveVendorApiContext();
  if (!apiContext) return apiUnauthorized();

  if (apiContext.session.sessionKind !== "active") {
    return apiForbidden();
  }

  try {
    const { productId } = await context.params;
    const archived = await archiveVendorProduct(
      {
        vendorId: apiContext.vendorId,
        vendorStoreName: apiContext.session.storeBranding.storeName,
        actorUid: apiContext.uid,
      },
      productId,
    );

    if (!archived) {
      return apiError(Strings.errors.notFound, 404);
    }

    return NextResponse.json({ success: true as const });
  } catch {
    return apiGenericError();
  }
}
