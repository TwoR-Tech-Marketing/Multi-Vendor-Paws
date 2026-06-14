"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PortalSelect } from "@/components/ui/select/PortalSelect";
import { Routes } from "@/constants/routes";
import { fetchVendorOrdersFromApi } from "@/features/orders/application/orders.api";
import type { VendorOrder, VendorOrderStatus } from "@/features/orders/domain/types";
import { OrderStatusBadge } from "@/features/orders/presentation/OrderStatusBadge";
import { OrdersSkeleton } from "@/features/orders/presentation/OrdersSkeleton";
import { formatEgp } from "@/features/products/domain/currency";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./orders.module.css";

type StatusFilter = VendorOrderStatus | "any";

function formatOrderRef(orderId: string): string {
  return `#${orderId.slice(0, 8).toUpperCase()}`;
}

function formatDate(date: Date): string {
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function OrdersSection() {
  const strings = useStrings();
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("any");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const page = await fetchVendorOrdersFromApi({
        status: statusFilter === "any" ? undefined : statusFilter,
        pageSize: 50,
      });
      setOrders(page.items);
    } catch {
      setError(strings.orders.loadError);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, strings.orders.loadError]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const statusOptions = useMemo(
    () => [
      { value: "any", label: strings.orders.filterAllStatuses },
      { value: "pending", label: strings.orders.statusLabels.pending },
      { value: "confirmed", label: strings.orders.statusLabels.confirmed },
      { value: "shipped", label: strings.orders.statusLabels.shipped },
      { value: "delivered", label: strings.orders.statusLabels.delivered },
      { value: "cancelled", label: strings.orders.statusLabels.cancelled },
    ],
    [strings.orders],
  );

  if (isLoading) return <OrdersSkeleton />;

  return (
    <section className={styles.sectionStack}>
      <div className={styles.filtersRow}>
        <PortalSelect
          className={styles.filterSelect}
          value={statusFilter}
          options={statusOptions}
          onChange={(value) => setStatusFilter(value as StatusFilter)}
          ariaLabel={strings.orders.filterStatus}
        />
      </div>

      {error ? <div className={`${styles.alert} ${styles.alertError}`}>{error}</div> : null}

      <article className={styles.panel}>
        {orders.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>
              {statusFilter !== "any"
                ? strings.orders.emptyFilteredTitle
                : strings.orders.emptyTitle}
            </h3>
            <p>
              {statusFilter !== "any"
                ? strings.orders.emptyFilteredDescription
                : strings.orders.emptyDescription}
            </p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>{strings.orders.tableOrder}</th>
                  <th>{strings.orders.tableCustomer}</th>
                  <th>{strings.orders.tableItems}</th>
                  <th>{strings.orders.tableTotal}</th>
                  <th>{strings.orders.tableStatus}</th>
                  <th>{strings.orders.tableDate}</th>
                  <th>{strings.orders.tableActions}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.vendorOrderId}>
                    <td>{formatOrderRef(order.orderId)}</td>
                    <td>{order.buyerDisplayName ?? "—"}</td>
                    <td>{order.itemCount}</td>
                    <td>{formatEgp(order.totalPiastres)}</td>
                    <td>
                      <OrderStatusBadge status={order.status} strings={strings} />
                    </td>
                    <td>{formatDate(order.placedAt)}</td>
                    <td>
                      <div className={styles.actions}>
                        <Link
                          href={Routes.vendor.orderDetail(order.vendorOrderId)}
                          className={styles.linkBtn}
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
    </section>
  );
}
