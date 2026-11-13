"use client";

import { StatusBadge, type StatusTone } from "@/components/ui/badge/StatusBadge";
import type { ProductStatus } from "@/features/products/domain/types";
import type { AppStrings } from "@/shared/i18n/types";

type ProductStatusBadgeProps = {
  status: ProductStatus;
  strings: AppStrings;
};

/** Badge tone for a product status. */
export function productStatusTone(status: ProductStatus): StatusTone {
  if (status === "active") return "success";
  if (status === "out_of_stock") return "warning";
  if (status === "archived") return "cancelled";
  return "neutral";
}

export function ProductStatusBadge({ status, strings }: ProductStatusBadgeProps) {
  return (
    <StatusBadge
      tone={productStatusTone(status)}
      label={strings.products.statusLabels[status]}
      status={status}
    />
  );
}
