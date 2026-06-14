import { NextResponse } from "next/server";
import { z } from "zod";

import { createProductSchema } from "@/features/products/domain/schemas";
import type { Product, ProductListFilter, ProductStatus } from "@/features/products/domain/types";
import { resolveCategoryNamesByIds } from "@/features/products/infrastructure/categories.admin.repository";
import {
  createVendorProduct,
  listVendorProducts,
} from "@/features/products/infrastructure/products.admin.repository";
import {
  apiForbidden,
  apiGenericError,
  apiUnauthorized,
} from "@/lib/api/response";
import { getActiveVendorApiContext } from "@/lib/auth/require-vendor-api";

const productStatusSchema = z.enum([
  "active",
  "inactive",
  "out_of_stock",
  "archived",
  "any",
]);

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

function parseListFilter(searchParams: URLSearchParams): ProductListFilter {
  const statusParam = searchParams.get("status");
  const parsedStatus = statusParam
    ? productStatusSchema.safeParse(statusParam)
    : null;

  const pageSizeParam = searchParams.get("pageSize");
  const pageSize = pageSizeParam ? Number(pageSizeParam) : undefined;

  return {
    status: parsedStatus?.success ? (parsedStatus.data as ProductStatus | "any") : undefined,
    categoryId: searchParams.get("categoryId") ?? undefined,
    query: searchParams.get("q") ?? undefined,
    cursor: searchParams.get("cursor") ?? undefined,
    pageSize: Number.isFinite(pageSize) ? pageSize : undefined,
  };
}

export async function GET(request: Request) {
  const context = await getActiveVendorApiContext();
  if (!context) return apiUnauthorized();

  try {
    const filter = parseListFilter(new URL(request.url).searchParams);
    const page = await listVendorProducts(context.vendorId, filter);

    let items = page.items;
    if (!filter.status) {
      items = items.filter((product) => product.status !== "archived");
    }

    if (filter.query?.trim()) {
      const query = filter.query.trim().toLowerCase();
      items = items.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          (product.description?.toLowerCase().includes(query) ?? false) ||
          (product.sku?.toLowerCase().includes(query) ?? false),
      );
    }

    return NextResponse.json({
      items: items.map(serializeProduct),
      nextCursor: page.nextCursor,
      total: items.length,
    });
  } catch {
    return apiGenericError();
  }
}

export async function POST(request: Request) {
  const context = await getActiveVendorApiContext();
  if (!context) return apiUnauthorized();

  if (context.session.sessionKind !== "active") {
    return apiForbidden();
  }

  try {
    const payload = createProductSchema.parse(await request.json());
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

    return NextResponse.json({ product: serializeProduct(product) }, { status: 201 });
  } catch {
    return apiGenericError();
  }
}
