import { NextResponse } from "next/server";

import { listProductCategoriesAdmin } from "@/features/products/infrastructure/categories.admin.repository";
import { apiGenericError, apiUnauthorized } from "@/lib/api/response";
import { getActiveVendorApiContext } from "@/lib/auth/require-vendor-api";

export async function GET(request: Request) {
  const context = await getActiveVendorApiContext();
  if (!context) return apiUnauthorized();

  try {
    const includeInactive =
      new URL(request.url).searchParams.get("includeInactive") === "true";

    const items = await listProductCategoriesAdmin({ includeInactive });
    return NextResponse.json({
      items: items.map((category) => ({
        categoryId: category.categoryId,
        name: category.name,
        nameAr: category.nameAr ?? null,
        order: category.order,
        isActive: category.isActive,
      })),
    });
  } catch {
    return apiGenericError();
  }
}
