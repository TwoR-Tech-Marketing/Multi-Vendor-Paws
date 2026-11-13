import Link from "next/link";

import { StatusBadge } from "@/components/ui/badge/StatusBadge";
import { EmptyState } from "@/components/ui/empty-state/EmptyState";
import { LoadErrorState } from "@/components/ui/error-state/LoadErrorState";
import type { LoadErrorView } from "@/components/ui/error-state/load-error";
import { Routes } from "@/constants/routes";
import type { VendorOrder } from "@/features/orders/domain/types";
import { OrderStatusBadge } from "@/features/orders/presentation/OrderStatusBadge";
import { formatEgp } from "@/features/products/domain/currency";
import type { AppStrings } from "@/shared/i18n/types";
import { formatDateTime } from "@/shared/lib/format-date";
import type { AppLocale } from "@/shared/preferences/domain/types";

import styles from "./orders.module.css";

export function formatOrderRef(orderId: string): string {
  return `#${orderId.slice(0, 8).toUpperCase()}`;
}

type OrdersListPanelProps = {
  orders: VendorOrder[];
  error: LoadErrorView | null;
  isFiltered: boolean;
  strings: AppStrings;
  locale: AppLocale;
  onRetry: () => void;
  onClearFilters: () => void;
};

/**
 * Orders list body: error (full, or compact above kept rows), empty, filtered
 * empty or the table. Money and counts are end aligned with tabular figures.
 */
export function OrdersListPanel({
  orders,
  error,
  isFiltered,
  strings,
  locale,
  onRetry,
  onClearFilters,
}: OrdersListPanelProps) {
  return (
    <>
        {error && orders.length > 0 ? (
          <LoadErrorState
            view={error}
            strings={strings}
            onRetry={onRetry}
            compact
          />
        ) : null}

        <article className={styles.panel}>
          {error && orders.length === 0 ? (
            <LoadErrorState
              view={error}
              strings={strings}
              onRetry={onRetry}
            />
          ) : orders.length === 0 ? (
            <EmptyState
              headingLevel={2}
              title={isFiltered ? strings.orders.emptyFilteredTitle : strings.orders.emptyTitle}
              description={
                isFiltered
                  ? strings.orders.emptyFilteredDescription
                  : strings.orders.emptyDescription
              }
              action={
                isFiltered ? (
                  <button type="button" className={styles.btnSecondary} onClick={onClearFilters}>
                    {strings.orders.clearFilters}
                  </button>
                ) : null
              }
            />
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>{strings.orders.tableOrder}</th>
                    <th>{strings.orders.tableCustomer}</th>
                    <th className={styles.money}>{strings.orders.tableItems}</th>
                    <th className={styles.money}>{strings.orders.tableTotal}</th>
                    <th>{strings.orders.tableStatus}</th>
                    <th>{strings.orders.tableDate}</th>
                    <th className={styles.actionsHead}>{strings.orders.tableActions}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.vendorOrderId}>
                      <td className={styles.refCell}>
                        <bdi>{formatOrderRef(order.orderId)}</bdi>
                      </td>
                      <td className={styles.nameCell}>
                        <span title={order.buyerDisplayName ?? undefined}>
                          {order.buyerDisplayName ?? strings.orders.guestCustomer}
                        </span>
                      </td>
                      <td className={styles.money}>{order.itemCount.toLocaleString("en-US")}</td>
                      <td className={styles.money}>{formatEgp(order.totalPiastres, locale)}</td>
                      <td>
                        <span className={styles.badgeRow}>
                          <OrderStatusBadge status={order.status} strings={strings} />
                          {order.holdState === "held" ? (
                            <StatusBadge tone="hold" label={strings.orders.heldLabel} status="held" />
                          ) : null}
                        </span>
                      </td>
                      <td className={styles.dateCell}>{formatDateTime(order.placedAt, locale)}</td>
                      <td>
                        <div className={styles.actions}>
                          <Link
                            href={Routes.vendor.orderDetail(order.vendorOrderId)}
                            className={styles.linkBtn}
                            aria-label={`${strings.orders.viewOrder} ${formatOrderRef(order.orderId)}`}
                          >
                            {strings.orders.viewOrder}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
    </>
  );
}
