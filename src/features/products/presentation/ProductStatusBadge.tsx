"use client";

import type { ProductStatus } from "@/features/products/domain/types";
import type { AppStrings } from "@/shared/i18n/types";

import styles from "./products.module.css";

type ProductStatusBadgeProps = {
  status: ProductStatus;
  strings: AppStrings;
};

export function ProductStatusBadge({ status, strings }: ProductStatusBadgeProps) {
  const label = strings.products.statusLabels[status];

  const className = [
    styles.pill,
    status === "active"
      ? styles.pillSuccess
      : status === "out_of_stock"
        ? styles.pillWarning
        : status === "inactive" || status === "archived"
          ? styles.pillMuted
          : styles.pillMuted,
  ].join(" ");

  return <span className={className}>{label}</span>;
}
