"use client";

import { useCallback, useEffect, useState } from "react";

import { toLoadErrorView, type LoadErrorView } from "@/components/ui/error-state/load-error";
import { fetchVendorOrdersFromApi } from "@/features/orders/application/orders.api";
import type { VendorOrder } from "@/features/orders/domain/types";
import {
  countActiveOrderFilters,
  EMPTY_ORDER_LIST_FILTERS,
  type OrderListFilters,
} from "@/features/orders/lib/orderListFilters";
import { OrdersListPanel } from "@/features/orders/presentation/OrdersListPanel";
import { OrdersListActions } from "@/features/orders/presentation/OrdersListActions";
import { OrdersSkeleton } from "@/features/orders/presentation/OrdersSkeleton";
import { usePreferences, useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./orders.module.css";


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

      <OrdersListPanel
        orders={orders}
        error={error}
        isFiltered={isFiltered}
        strings={strings}
        locale={locale}
        onRetry={() => void loadOrders()}
        onClearFilters={clearFilters}
      />
    </section>
  );
}
