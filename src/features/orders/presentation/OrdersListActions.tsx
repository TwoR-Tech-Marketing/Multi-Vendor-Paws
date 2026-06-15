"use client";

import { useMemo, useRef, useState } from "react";

import {
  countActiveOrderFilters,
  getOrderFilterChipLabels,
  type OrderListFilters,
} from "@/features/orders/lib/orderListFilters";
import { OrdersFilterPopover } from "@/features/orders/presentation/OrdersFilterPopover";
import { IconFilter, IconSearch } from "@/features/products/presentation/ProductIcons";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "@/features/products/presentation/productsListActions.module.css";

type OrdersListActionsProps = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: OrderListFilters;
  onFilterChange: (filters: OrderListFilters) => void;
};

export function OrdersListActions({
  searchQuery,
  onSearchChange,
  filters,
  onFilterChange,
}: OrdersListActionsProps) {
  const strings = useStrings();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterAnchorRef = useRef<HTMLButtonElement>(null);

  const activeFilterCount = countActiveOrderFilters(filters);
  const appliedChips = getOrderFilterChipLabels(filters, strings);

  const filterButtonLabel = useMemo(() => {
    if (activeFilterCount === 0) return strings.orders.filterLabel;
    if (appliedChips.length === 1) return appliedChips[0];
    return strings.orders.applyFiltersWithCount.replace(
      "{count}",
      String(activeFilterCount),
    );
  }, [activeFilterCount, appliedChips, strings]);

  return (
    <div className={styles.actionsContainer}>
      <div className={styles.searchContainer}>
        <div className={styles.searchInner}>
          <input
            type="search"
            className={styles.searchInput}
            placeholder={strings.orders.searchPlaceholder}
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            aria-label={strings.orders.searchPlaceholder}
          />
          <IconSearch className={styles.searchIcon} />
        </div>
      </div>

      <div className={styles.buttonsContainer}>
        <div className={styles.filterWrap}>
          <button
            ref={filterAnchorRef}
            type="button"
            className={styles.filterButton}
            onClick={() => setIsFilterOpen((open) => !open)}
            aria-expanded={isFilterOpen}
            aria-haspopup="dialog"
          >
            <IconFilter className={styles.filterIcon} />
            <span className={styles.filterText}>{filterButtonLabel}</span>
            {activeFilterCount > 0 ? (
              <span className={styles.filterBadge} aria-hidden>
                {activeFilterCount}
              </span>
            ) : null}
          </button>

          <OrdersFilterPopover
            open={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            appliedFilters={filters}
            onApply={onFilterChange}
            anchorRef={filterAnchorRef}
          />
        </div>
      </div>

      {activeFilterCount > 0 ? (
        <div className={styles.appliedFilters}>
          <span className={styles.appliedFiltersLabel}>{strings.orders.filteringBy}</span>
          <div className={styles.appliedChipRow}>
            {appliedChips.map((chip) => (
              <span key={chip} className={styles.appliedChip}>
                {chip}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
