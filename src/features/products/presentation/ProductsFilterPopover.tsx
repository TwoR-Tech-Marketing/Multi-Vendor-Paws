"use client";

import { useEffect, useMemo, useState, type RefObject } from "react";
import { createPortal } from "react-dom";

import { PortalSelect } from "@/components/ui/select/PortalSelect";
import type { ProductStatus } from "@/features/products/domain/types";
import {
  countActiveProductFilters,
  EMPTY_PRODUCT_LIST_FILTERS,
  getProductFilterChipLabels,
  type ProductListFilters,
} from "@/features/products/lib/productListFilters";
import { useAnchoredPopoverLayout } from "@/shared/hooks/useAnchoredPopoverLayout";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./ProductsFilterPopover.module.css";

type ProductsFilterPopoverProps = {
  open: boolean;
  onClose: () => void;
  appliedFilters: ProductListFilters;
  onApply: (filters: ProductListFilters) => void;
  anchorRef: RefObject<HTMLButtonElement | null>;
  categoryOptions: { value: string; label: string }[];
};

export function ProductsFilterPopover({
  open,
  onClose,
  appliedFilters,
  onApply,
  anchorRef,
  categoryOptions,
}: ProductsFilterPopoverProps) {
  const strings = useStrings();
  const [draft, setDraft] = useState<ProductListFilters>(appliedFilters);
  const popoverLayout = useAnchoredPopoverLayout(open, anchorRef, { maxWidthPx: 360 });

  useEffect(() => {
    if (open) setDraft(appliedFilters);
  }, [open, appliedFilters]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const statusOptions = useMemo(
    () => [
      { value: "any", label: strings.products.filterAllStatuses },
      { value: "active", label: strings.products.statusLabels.active },
      { value: "inactive", label: strings.products.statusLabels.inactive },
      { value: "out_of_stock", label: strings.products.statusLabels.out_of_stock },
    ],
    [strings.products],
  );

  const allCategoryOptions = useMemo(
    () => [
      { value: "any", label: strings.products.filterAllCategories },
      ...categoryOptions,
    ],
    [categoryOptions, strings.products.filterAllCategories],
  );

  const draftCount = countActiveProductFilters(draft);
  const draftChips = getProductFilterChipLabels(draft, strings, categoryOptions);

  const applyLabel =
    draftCount > 0
      ? strings.products.applyFiltersWithCount.replace("{count}", String(draftCount))
      : strings.products.applyFilters;

  if (!open || typeof document === "undefined") return null;

  function handleApply() {
    onApply(draft);
    onClose();
  }

  function handleReset() {
    setDraft(EMPTY_PRODUCT_LIST_FILTERS);
  }

  return createPortal(
    <>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      <div
        className={styles.popover}
        style={{
          ...popoverLayout,
          overflow: "visible",
          overflowY: "visible",
        }}
        role="dialog"
        aria-modal="true"
        aria-label={strings.products.filterTitle}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{strings.products.filterTitle}</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label={strings.common.cancel}
          >
            ×
          </button>
        </div>

        <div className={styles.summary}>
          <span className={styles.summaryLabel}>{strings.products.filteringBy}</span>
          {draftChips.length > 0 ? (
            <div className={styles.chipRow}>
              {draftChips.map((chip) => (
                <span key={chip} className={styles.chip}>
                  {chip}
                </span>
              ))}
            </div>
          ) : (
            <p className={styles.summaryEmpty}>{strings.products.filterNoSelection}</p>
          )}
        </div>

        <div className={styles.body}>
          <div className={styles.formGroup}>
            <span className={styles.sectionTitle}>{strings.products.filterStatus}</span>
            <PortalSelect
              className={styles.filterSelect}
              value={draft.status}
              options={statusOptions}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  status: value as ProductStatus | "any",
                }))
              }
              ariaLabel={strings.products.filterStatus}
            />
          </div>

          <div className={styles.formGroup}>
            <span className={styles.sectionTitle}>{strings.products.filterCategory}</span>
            <PortalSelect
              className={styles.filterSelect}
              value={draft.categoryId}
              options={allCategoryOptions}
              onChange={(value) =>
                setDraft((current) => ({ ...current, categoryId: value }))
              }
              ariaLabel={strings.products.filterCategory}
            />
          </div>
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.resetBtn} onClick={handleReset}>
            {strings.products.resetFilters}
          </button>
          <button type="button" className={styles.applyBtn} onClick={handleApply}>
            {applyLabel}
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}
