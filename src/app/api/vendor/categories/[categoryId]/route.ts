import { NextResponse } from "next/server";
import { z } from "zod";

import { updateProductCategoryStatusAdmin } from "@/features/products/infrastructure/categories.admin.repository";
import {
  apiError,
  apiForbidden,
  apiGenericError,
  apiUnauthorized,
} from "@/lib/api/response";
import { getActiveVendorApiContext } from "@/lib/auth/require-vendor-api";
import { Strings } from "@/constants/strings";

type RouteContext = {
  params: Promise<{ categoryId: string }>;
};

const patchSchema = z.object({
  isActive: z.boolean(),
});

export async function PATCH(request: Request, context: RouteContext) {
  const apiContext = await getActiveVendorApiContext();
  if (!apiContext) return apiUnauthorized();

  if (apiContext.session.sessionKind !== "active") {
    return apiForbidden();
  }

  try {
    const { categoryId } = await context.params;
    const { isActive } = patchSchema.parse(await request.json());

    const category = await updateProductCategoryStatusAdmin(categoryId, isActive);
    if (!category) {
      return apiError(Strings.errors.notFound, 404);
    }

    return NextResponse.json({
      category: {
        categoryId: category.categoryId,
        name: category.name,
        nameAr: category.nameAr ?? null,
        order: category.order,
        isActive: category.isActive,
      },
    });
  } catch {
    return apiGenericError();
  }
}
