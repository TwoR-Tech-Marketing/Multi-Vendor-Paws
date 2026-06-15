"use client";

import { useMemo, useRef, useState } from "react";

import type { Product } from "@/features/products/domain/types";
import type { ProductCategoryOption } from "@/features/products/application/products.api";
import {
  countActiveProductFilters,
  getProductFilterChipLabels,
} from "@/features/products/lib/productListFilters";
import { ProductsExportDialog } from "@/features/products/presentation/ProductsExportDialog";
import { ProductsImportDialog } from "@/features/products/presentation/ProductsImportDialog";
import { ProductsFilterPopover } from "@/features/products/presentation/ProductsFilterPopover";
import type { ProductListFilters } from "@/features/products/lib/productListFilters";
import {
  IconExport,
  IconFilter,
  IconImport,
  IconSearch,
} from "@/features/products/presentation/ProductIcons";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./productsListActions.module.css";

type ProductsListActionsProps = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: ProductListFilters;
  onFilterChange: (filters: ProductListFilters) => void;
  categoryOptions: { value: string; label: string }[];
  categoryItems: ProductCategoryOption[];
  productsToExport: Product[];
  onImportComplete: () => void;
};

export function ProductsListActions({
  searchQuery,
  onSearchChange,
  filters,
  onFilterChange,
  categoryOptions,
  categoryItems,
  productsToExport,
  onImportComplete,
}: ProductsListActionsProps) {
  const strings = useStrings();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const filterAnchorRef = useRef<HTMLButtonElement>(null);

  const activeFilterCount = countActiveProductFilters(filters);
  const appliedChips = getProductFilterChipLabels(filters, strings, categoryOptions);

  const filterButtonLabel = useMemo(() => {
    if (activeFilterCount === 0) return strings.products.filterLabel;
    if (appliedChips.length === 1) return appliedChips[0];
    return strings.products.applyFiltersWithCount.replace(
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
            placeholder={strings.products.searchPlaceholder}
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            aria-label={strings.products.searchPlaceholder}
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

          <ProductsFilterPopover
            open={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            appliedFilters={filters}
            onApply={onFilterChange}
            anchorRef={filterAnchorRef}
            categoryOptions={categoryOptions}
          />
        </div>

        <button
          type="button"
          className={styles.importButton}
          onClick={() => setImportOpen(true)}
          aria-haspopup="dialog"
        >
          <IconImport className={styles.importIcon} />
          <span className={styles.importText}>{strings.products.import.label}</span>
        </button>

        <button
          type="button"
          className={styles.exportButton}
          onClick={() => setExportOpen(true)}
          aria-haspopup="dialog"
        >
          <IconExport className={styles.exportIcon} />
          <span className={styles.exportText}>{strings.products.export.label}</span>
        </button>
      </div>

      {activeFilterCount > 0 ? (
        <div className={styles.appliedFilters}>
          <span className={styles.appliedFiltersLabel}>{strings.products.filteringBy}</span>
          <div className={styles.appliedChipRow}>
            {appliedChips.map((chip) => (
              <span key={chip} className={styles.appliedChip}>
                {chip}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <ProductsExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        products={productsToExport}
      />

      <ProductsImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        categories={categoryItems}
        onImported={() => {
          onImportComplete();
        }}
      />
    </div>
  );
}
