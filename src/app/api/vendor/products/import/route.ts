import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { importProductsSchema } from "@/features/products/domain/schemas";
import type { Product } from "@/features/products/domain/types";
import { resolveCategoryNamesByIds } from "@/features/products/infrastructure/categories.admin.repository";
import { createVendorProduct } from "@/features/products/infrastructure/products.admin.repository";
import {
  apiError,
  apiForbidden,
  apiGenericError,
  apiUnauthorized,
} from "@/lib/api/response";
import { getActiveVendorApiContext } from "@/lib/auth/require-vendor-api";
import { Strings } from "@/constants/strings";

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

type ImportFailure = {
  index: number;
  error: string;
};

export async function POST(request: Request) {
  const context = await getActiveVendorApiContext();
  if (!context) return apiUnauthorized();

  if (context.session.sessionKind !== "active") {
    return apiForbidden();
  }

  try {
    const body = await request.json();
    const { products } = importProductsSchema.parse(body);

    const created: ReturnType<typeof serializeProduct>[] = [];
    const failed: ImportFailure[] = [];

    for (let index = 0; index < products.length; index += 1) {
      const payload = products[index];

      try {
        const categoryNames = await resolveCategoryNamesByIds(payload.categoryIds);
        const product = await createVendorProduct(
          {
            vendorId: context.vendorId,
            vendorStoreName: context.session.storeBranding.storeName,
            actorUid: context.uid,
          },
          payload,
          categoryNames,
        );
        created.push(serializeProduct(product));
      } catch (error) {
        failed.push({
          index,
          error:
            error instanceof ZodError
              ? Strings.errors.validationRequired
              : Strings.errors.generic,
        });
      }
    }

    return NextResponse.json(
      {
        createdCount: created.length,
        failedCount: failed.length,
        created,
        failed,
      },
      { status: created.length > 0 ? 201 : 400 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(Strings.errors.validationRequired, 400);
    }
    return apiGenericError();
  }
}
