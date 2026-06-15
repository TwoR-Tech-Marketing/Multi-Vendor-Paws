"use client";

import { useEffect, useMemo, useState, type RefObject } from "react";
import { createPortal } from "react-dom";

import { PortalSelect } from "@/components/ui/select/PortalSelect";
import type { OrderDatePreset, VendorOrderStatus } from "@/features/orders/domain/types";
import {
  countActiveOrderFilters,
  EMPTY_ORDER_LIST_FILTERS,
  getOrderFilterChipLabels,
  type OrderListFilters,
} from "@/features/orders/lib/orderListFilters";
import { useAnchoredPopoverLayout } from "@/shared/hooks/useAnchoredPopoverLayout";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import popoverStyles from "@/features/products/presentation/ProductsFilterPopover.module.css";
import styles from "./OrdersFilterPopover.module.css";

type OrdersFilterPopoverProps = {
  open: boolean;
  onClose: () => void;
  appliedFilters: OrderListFilters;
  onApply: (filters: OrderListFilters) => void;
  anchorRef: RefObject<HTMLButtonElement | null>;
};

const QUICK_DATE_PRESETS: OrderDatePreset[] = ["today", "last7", "last30"];

export function OrdersFilterPopover({
  open,
  onClose,
  appliedFilters,
  onApply,
  anchorRef,
}: OrdersFilterPopoverProps) {
  const strings = useStrings();
  const [draft, setDraft] = useState<OrderListFilters>(appliedFilters);
  const popoverLayout = useAnchoredPopoverLayout(open, anchorRef, { maxWidthPx: 380 });

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
      { value: "any", label: strings.orders.filterAllStatuses },
      { value: "pending", label: strings.orders.statusLabels.pending },
      { value: "confirmed", label: strings.orders.statusLabels.confirmed },
      { value: "shipped", label: strings.orders.statusLabels.shipped },
      { value: "delivered", label: strings.orders.statusLabels.delivered },
      { value: "cancelled", label: strings.orders.statusLabels.cancelled },
    ],
    [strings.orders],
  );

  const datePresetOptions = useMemo(
    () => [
      { value: "any", label: strings.orders.filterAllDates },
      { value: "today", label: strings.orders.datePresetToday },
      { value: "yesterday", label: strings.orders.datePresetYesterday },
      { value: "last7", label: strings.orders.datePresetLast7 },
      { value: "last30", label: strings.orders.datePresetLast30 },
      { value: "custom", label: strings.orders.datePresetCustom },
    ],
    [strings.orders],
  );

  const draftCount = countActiveOrderFilters(draft);
  const draftChips = getOrderFilterChipLabels(draft, strings);

  const applyLabel =
    draftCount > 0
      ? strings.orders.applyFiltersWithCount.replace("{count}", String(draftCount))
      : strings.orders.applyFilters;

  function handleQuickDateToggle(preset: OrderDatePreset) {
    setDraft((current) => ({
      ...current,
      datePreset: current.datePreset === preset ? "any" : preset,
      dateFrom: "",
      dateTo: "",
    }));
  }

  function handleDatePresetChange(value: string) {
    const preset = value as OrderDatePreset;
    setDraft((current) => ({
      ...current,
      datePreset: preset,
      dateFrom: preset === "custom" ? current.dateFrom : "",
      dateTo: preset === "custom" ? current.dateTo : "",
    }));
  }

  function handleApply() {
    onApply(draft);
    onClose();
  }

  function handleReset() {
    setDraft(EMPTY_ORDER_LIST_FILTERS);
  }

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <>
      <div className={popoverStyles.backdrop} onClick={onClose} aria-hidden="true" />
      <div
        className={popoverStyles.popover}
        style={{
          ...popoverLayout,
          overflow: "visible",
          overflowY: "visible",
        }}
        role="dialog"
        aria-modal="true"
        aria-label={strings.orders.filterTitle}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={popoverStyles.header}>
          <h2 className={popoverStyles.title}>{strings.orders.filterTitle}</h2>
          <button
            type="button"
            className={popoverStyles.closeBtn}
            onClick={onClose}
            aria-label={strings.common.cancel}
          >
            ×
          </button>
        </div>

        <div className={popoverStyles.summary}>
          <span className={popoverStyles.summaryLabel}>{strings.orders.filteringBy}</span>
          {draftChips.length > 0 ? (
            <div className={popoverStyles.chipRow}>
              {draftChips.map((chip) => (
                <span key={chip} className={popoverStyles.chip}>
                  {chip}
                </span>
              ))}
            </div>
          ) : (
            <p className={popoverStyles.summaryEmpty}>{strings.orders.filterNoSelection}</p>
          )}
        </div>

        <div className={popoverStyles.body}>
          <div className={popoverStyles.formGroup}>
            <span className={popoverStyles.sectionTitle}>{strings.orders.filterStatus}</span>
            <PortalSelect
              className={popoverStyles.filterSelect}
              value={draft.status}
              options={statusOptions}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  status: value as VendorOrderStatus | "any",
                }))
              }
              ariaLabel={strings.orders.filterStatus}
            />
          </div>

          <div className={popoverStyles.formGroup}>
            <span className={popoverStyles.sectionTitle}>{strings.orders.filterDate}</span>
            <div className={styles.dateToggleRow}>
              {QUICK_DATE_PRESETS.map((preset) => {
                const label =
                  preset === "today"
                    ? strings.orders.quickDateToday
                    : preset === "last7"
                      ? strings.orders.quickDateLast7
                      : strings.orders.quickDateLast30;

                return (
                  <button
                    key={preset}
                    type="button"
                    className={
                      draft.datePreset === preset ? styles.dateToggleActive : styles.dateToggle
                    }
                    onClick={() => handleQuickDateToggle(preset)}
                    aria-pressed={draft.datePreset === preset}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <PortalSelect
              className={popoverStyles.filterSelect}
              value={draft.datePreset}
              options={datePresetOptions}
              onChange={handleDatePresetChange}
              ariaLabel={strings.orders.filterDate}
            />
            {draft.datePreset === "custom" ? (
              <div className={styles.dateRangeRow}>
                <label className={styles.dateField}>
                  <span className={styles.dateLabel}>{strings.orders.filterDateFrom}</span>
                  <input
                    type="date"
                    className={styles.dateInput}
                    value={draft.dateFrom}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, dateFrom: event.target.value }))
                    }
                    aria-label={strings.orders.filterDateFrom}
                  />
                </label>
                <label className={styles.dateField}>
                  <span className={styles.dateLabel}>{strings.orders.filterDateTo}</span>
                  <input
                    type="date"
                    className={styles.dateInput}
                    value={draft.dateTo}
                    min={draft.dateFrom || undefined}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, dateTo: event.target.value }))
                    }
                    aria-label={strings.orders.filterDateTo}
                  />
                </label>
              </div>
            ) : null}
          </div>
        </div>

        <div className={popoverStyles.footer}>
          <button type="button" className={popoverStyles.resetBtn} onClick={handleReset}>
            {strings.orders.resetFilters}
          </button>
          <button type="button" className={popoverStyles.applyBtn} onClick={handleApply}>
            {applyLabel}
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}
