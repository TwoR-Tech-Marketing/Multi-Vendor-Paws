"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

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
import { useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./orders.module.css";

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
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<OrderListFilters>(EMPTY_ORDER_LIST_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    } catch {
      setError(strings.orders.loadError);
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
    strings.orders.loadError,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    void loadOrders();
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

      {error ? <div className={`${styles.alert} ${styles.alertError}`}>{error}</div> : null}

      <article className={styles.panel}>
        {orders.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>
              {isFiltered ? strings.orders.emptyFilteredTitle : strings.orders.emptyTitle}
            </h3>
            <p>
              {isFiltered
                ? strings.orders.emptyFilteredDescription
                : strings.orders.emptyDescription}
            </p>
            {isFiltered ? (
              <button type="button" className={styles.btnSecondary} onClick={clearFilters}>
                {strings.orders.clearFilters}
              </button>
            ) : null}
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
