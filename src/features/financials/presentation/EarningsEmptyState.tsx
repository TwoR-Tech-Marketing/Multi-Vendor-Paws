import Link from "next/link";

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
    <div className={styles.emptyState}>
      <h3>{strings.earnings.emptyTitle}</h3>
      <p>
        {hasOrders
          ? strings.earnings.emptyDescription
          : strings.earnings.emptyDescriptionProvider}
      </p>
      {hasOrders ? (
        <Link href={Routes.vendor.orders} className={styles.emptyCta}>
          {strings.earnings.goToOrders}
        </Link>
      ) : null}
    </div>
  );
}
