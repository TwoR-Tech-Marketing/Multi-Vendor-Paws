import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state/EmptyState";
import { Routes } from "@/constants/routes";
import { isScreenVisible } from "@/features/vendor/domain/vendor-type-config";
import type { AppStrings } from "@/shared/i18n/types";

import styles from "./earnings.module.css";

type EarningsEmptyStateProps = {
  strings: AppStrings;
  vendorType?: string;
};

/** Empty ledger. The orders wording and link exist only for types with orders. */
export function EarningsEmptyState({ strings, vendorType }: EarningsEmptyStateProps) {
  const hasOrders = isScreenVisible(vendorType, "orders");
  return (
    <EmptyState
      title={strings.earnings.emptyTitle}
      description={
        hasOrders ? strings.earnings.emptyDescription : strings.earnings.emptyDescriptionProvider
      }
      action={
        hasOrders ? (
          <Link href={Routes.vendor.orders} className={styles.emptyCta}>
            {strings.earnings.goToOrders}
          </Link>
        ) : null
      }
    />
  );
}
