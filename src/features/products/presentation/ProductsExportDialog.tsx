"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { Product } from "@/features/products/domain/types";
import {
  buildProductsCsv,
  defaultProductExportSelection,
  downloadProductsCsv,
  getProductExportColumns,
  productsExportFilename,
  type ProductExportColumnId,
} from "@/features/products/lib/productsExport";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./ProductsExportDialog.module.css";

type ProductsExportDialogProps = {
  open: boolean;
  onClose: () => void;
  products: Product[];
};

export function ProductsExportDialog({
  open,
  onClose,
  products,
}: ProductsExportDialogProps) {
  const strings = useStrings();
  const columns = useMemo(() => getProductExportColumns(strings), [strings]);
  const [selected, setSelected] = useState<Record<ProductExportColumnId, boolean>>(() =>
    defaultProductExportSelection(strings),
  );

  useEffect(() => {
    if (open) setSelected(defaultProductExportSelection(strings));
  }, [open, strings]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const activeCount = useMemo(
    () => columns.filter((column) => selected[column.id]).length,
    [columns, selected],
  );

  const toggleColumn = useCallback((id: ProductExportColumnId) => {
    setSelected((current) => ({ ...current, [id]: !current[id] }));
  }, []);

  const handleExport = useCallback(() => {
    if (activeCount === 0 || products.length === 0) return;
    const csv = buildProductsCsv(products, selected, strings);
    if (!csv) return;
    downloadProductsCsv(csv, productsExportFilename());
    onClose();
  }, [activeCount, onClose, products, selected, strings]);

  if (!open) return null;

  const noData = products.length === 0;

  return (
    <div className={styles.overlay} role="presentation" onMouseDown={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={strings.products.export.title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 className={styles.title}>{strings.products.export.title}</h2>
        <p className={styles.subtitle}>{strings.products.export.subtitle}</p>

        {noData ? (
          <p className={styles.hint}>{strings.products.export.noData}</p>
        ) : (
          <div className={styles.columnList}>
            {columns.map((column) => (
              <label key={column.id} className={styles.columnOption}>
                <input
                  type="checkbox"
                  checked={selected[column.id]}
                  onChange={() => toggleColumn(column.id)}
                />
                <span>{column.label}</span>
              </label>
            ))}
          </div>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.btnCancel} onClick={onClose}>
            {strings.common.cancel}
          </button>
          <button
            type="button"
            className={styles.btnExport}
            disabled={noData || activeCount === 0}
            onClick={handleExport}
          >
            {strings.products.export.action}
          </button>
        </div>
      </div>
    </div>
  );
}
