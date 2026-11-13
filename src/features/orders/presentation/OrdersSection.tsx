"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { EmptyState } from "@/components/ui/empty-state/EmptyState";
import { ErrorState } from "@/components/ui/error-state/ErrorState";
import { toLoadErrorView, type LoadErrorView } from "@/components/ui/error-state/load-error";
import { Routes } from "@/constants/routes";
import { fetchVendorOrdersFromApi } from "@/features/orders/application/orders.api";
import type { VendorOrder } from "@/features/orders/domain/types";
import {
  countActiveOrderFilters,
  EMPTY_ORDER_LIST_FILTERS,
  type OrderListFilters,
} from "@/features/orders/lib/orderListFilters";
import { OrderStatusBadge } from "@/features/orders/presentation/OrderStatusBadge";
import { OrdersListActions } from "@/features/orders/presentation/OrdersListActions";
import { OrdersSkeleton } from "@/features/orders/presentation/OrdersSkeleton";
import { formatEgp } from "@/features/products/domain/currency";
import { formatDateTime } from "@/shared/lib/format-date";
import { usePreferences, useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./orders.module.css";

function formatOrderRef(orderId: string): string {
  return `#${orderId.slice(0, 8).toUpperCase()}`;
}

export function OrdersSection() {
  const strings = useStrings();
  const { locale } = usePreferences();
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<OrderListFilters>(EMPTY_ORDER_LIST_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<LoadErrorView | null>(null);

  const loadOrders = useCallback(async () => {
    setError(null);
    if (orders.length === 0) {
      setIsLoading(true);
    }

    try {
      const page = await fetchVendorOrdersFromApi({
        status: filters.status === "any" ? undefined : filters.status,
        query: search.trim() || undefined,
        datePreset: filters.datePreset === "any" ? undefined : filters.datePreset,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        pageSize: 50,
      });
      setOrders(page.items);
    } catch (loadError) {
      setError(toLoadErrorView(loadError, strings, strings.orders.loadError));
    } finally {
      setIsLoading(false);
    }
  }, [
    filters.dateFrom,
    filters.datePreset,
    filters.dateTo,
    filters.status,
    orders.length,
    search,
    strings,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadOrders();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadOrders]);

  const isFiltered =
    search.trim().length > 0 || countActiveOrderFilters(filters) > 0;

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setFilters(EMPTY_ORDER_LIST_FILTERS);
  }

  if (isLoading && orders.length === 0) return <OrdersSkeleton />;

  return (
    <section className={styles.sectionStack}>
      <OrdersListActions
        searchQuery={searchInput}
        onSearchChange={setSearchInput}
        filters={filters}
        onFilterChange={setFilters}
      />

      {error && orders.length > 0 ? (
        <ErrorState
          compact
          kind={error.kind}
          title={error.title}
          description={error.description}
          retryLabel={strings.states.retry}
          onRetry={() => void loadOrders()}
          headingLevel={2}
        />
      ) : null}

      <article className={styles.panel}>
        {error && orders.length === 0 ? (
          <ErrorState
            kind={error.kind}
            title={error.title}
            description={error.description}
            retryLabel={strings.states.retry}
            onRetry={() => void loadOrders()}
            headingLevel={2}
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
                <button type="button" className={styles.btnSecondary} onClick={clearFilters}>
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
                    <td className={styles.money}>{order.itemCount}</td>
                    <td className={styles.money}>{formatEgp(order.totalPiastres)}</td>
                    <td>
                      <OrderStatusBadge status={order.status} strings={strings} />
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
    </section>
  );
}
