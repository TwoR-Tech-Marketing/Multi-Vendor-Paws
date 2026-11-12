"use client";

import { StatusBadge, type StatusTone } from "@/components/ui/badge/StatusBadge";
import type { VendorOrderStatus } from "@/features/orders/domain/types";
import type { AppStrings } from "@/shared/i18n/types";

type OrderStatusBadgeProps = {
  status: VendorOrderStatus;
  strings: AppStrings;
};

/** Badge tone for an order status. Unknown statuses read as neutral. */
export function orderStatusTone(status: VendorOrderStatus): StatusTone {
  switch (status) {
    case "delivered":
      return "success";
    case "cancelled":
      return "cancelled";
    case "pending":
      return "warning";
    case "confirmed":
      return "confirmed";
    case "shipped":
      return "info";
    default:
      return "neutral";
  }
}

export function OrderStatusBadge({ status, strings }: OrderStatusBadgeProps) {
  return (
    <StatusBadge
      tone={orderStatusTone(status)}
      label={strings.orders.statusLabels[status]}
      status={status}
    />
  );
}
