"use client";

import type { VendorOrderStatus } from "@/features/orders/domain/types";
import type { AppStrings } from "@/shared/i18n/types";

import styles from "./orders.module.css";

type OrderStatusBadgeProps = {
  status: VendorOrderStatus;
  strings: AppStrings;
};

export function OrderStatusBadge({ status, strings }: OrderStatusBadgeProps) {
  const label = strings.orders.statusLabels[status];

  const className = [
    styles.pill,
    status === "delivered"
      ? styles.pillSuccess
      : status === "cancelled"
        ? styles.pillDanger
        : status === "pending"
          ? styles.pillWarning
          : status === "shipped" || status === "confirmed"
            ? styles.pillInfo
            : styles.pillMuted,
  ].join(" ");

  return <span className={className}>{label}</span>;
}
