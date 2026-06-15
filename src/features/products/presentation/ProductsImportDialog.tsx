"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import {
  importVendorProductsFromApi,
  type ProductCategoryOption,
} from "@/features/products/application/products.api";
import { PRODUCT_IMPORT_MAX_ROWS } from "@/features/products/domain/import.constants";
import {
  downloadProductsImportTemplate,
  getImportPlaceholderUrl,
  getValidImportPayloads,
  parseProductsExcel,
  type ParsedImportRow,
} from "@/features/products/lib/productsImport";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./ProductsImportDialog.module.css";

type ImportStep = "upload" | "preview" | "done";

type ProductsImportDialogProps = {
  open: boolean;
  onClose: () => void;
  categories: ProductCategoryOption[];
  onImported: (createdCount: number) => void;
};

export function ProductsImportDialog({
  open,
  onClose,
  categories,
  onImported,
}: ProductsImportDialogProps) {
  const strings = useStrings();
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<ImportStep>("upload");
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedImportRow[]>([]);
  const [result, setResult] = useState<{ created: number; failed: number } | null>(null);

  const resetState = useCallback(() => {
    setStep("upload");
    setIsParsing(false);
    setIsImporting(false);
    setFileError(null);
    setImportError(null);
    setRows([]);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open, resetState]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isImporting) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, isImporting]);

  const validRows = useMemo(() => rows.filter((row) => row.payload !== null), [rows]);
  const invalidRows = useMemo(() => rows.filter((row) => row.payload === null), [rows]);

  const handleDownloadTemplate = useCallback(() => {
    downloadProductsImportTemplate(categories, strings);
  }, [categories, strings]);

  const handleFileSelected = useCallback(
    async (file: File | null) => {
      if (!file) return;

      setFileError(null);
      setImportError(null);
      setIsParsing(true);

      try {
        const buffer = await file.arrayBuffer();
        const parsed = parseProductsExcel(
          buffer,
          categories,
          getImportPlaceholderUrl(),
          strings,
        );

        if (parsed.fileError) {
          setFileError(parsed.fileError);
          setRows([]);
          setStep("upload");
          return;
        }

        setRows(parsed.rows);
        setStep("preview");
      } catch {
        setFileError(strings.products.import.errors.fileUnreadable);
        setRows([]);
        setStep("upload");
      } finally {
        setIsParsing(false);
      }
    },
    [categories, strings],
  );

  const handleImport = useCallback(async () => {
    const payloads = getValidImportPayloads(rows);
    if (payloads.length === 0) return;

    setIsImporting(true);
    setImportError(null);

    try {
      const response = await importVendorProductsFromApi(payloads);
      setResult({ created: response.createdCount, failed: response.failedCount });
      setStep("done");

      if (response.createdCount > 0) {
        onImported(response.createdCount);
      }
    } catch {
      setImportError(strings.products.import.importError);
    } finally {
      setIsImporting(false);
    }
  }, [onImported, rows, strings.products.import.importError]);

  if (!open) return null;

  const previewSubtitle = strings.products.import.previewSubtitle
    .replace("{valid}", String(validRows.length))
    .replace("{invalid}", String(invalidRows.length));

  const importActionLabel = strings.products.import.importAction.replace(
    "{count}",
    String(validRows.length),
  );

  return (
    <div className={styles.overlay} role="presentation" onMouseDown={isImporting ? undefined : onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={strings.products.import.title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 className={styles.title}>
          {step === "done" ? strings.products.import.successTitle : strings.products.import.title}
        </h2>

        {step === "upload" ? (
          <p className={styles.subtitle}>{strings.products.import.subtitle}</p>
        ) : null}

        {step === "preview" ? (
          <p className={styles.subtitle}>{previewSubtitle}</p>
        ) : null}

        <div className={styles.body}>
          {step === "upload" ? (
            <>
              {fileError ? <p className={styles.error}>{fileError}</p> : null}
              <div className={styles.uploadZone}>
                {isParsing ? (
                  <p className={styles.parsing}>{strings.products.import.parsing}</p>
                ) : (
                  <>
                    <label htmlFor={fileInputId} className={styles.chooseFileButton}>
                      {strings.products.import.chooseFile}
                    </label>
                    <input
                      ref={fileInputRef}
                      id={fileInputId}
                      className={styles.fileInput}
                      type="file"
                      accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        void handleFileSelected(file);
                      }}
                    />
                    <button
                      type="button"
                      className={styles.templateButton}
                      onClick={handleDownloadTemplate}
                    >
                      {strings.products.import.downloadTemplate}
                    </button>
                    <p className={styles.hint}>
                      {strings.products.import.fileHint.replace(
                        "{max}",
                        String(PRODUCT_IMPORT_MAX_ROWS),
                      )}
                    </p>
                  </>
                )}
              </div>
            </>
          ) : null}

          {step === "preview" ? (
            <>
              <p className={styles.hint}>{strings.products.import.previewValidOnly}</p>
              {importError ? <p className={styles.error}>{importError}</p> : null}
              <div className={styles.previewList}>
                {rows.map((row) => {
                  const isValid = row.payload !== null;
                  return (
                    <div
                      key={row.rowNumber}
                      className={`${styles.previewRow} ${isValid ? "" : styles.previewRowInvalid}`}
                    >
                      <div className={styles.previewHeader}>
                        <span className={styles.previewName}>{row.name}</span>
                        <span
                          className={`${styles.badge} ${
                            isValid ? styles.badgeValid : styles.badgeInvalid
                          }`}
                        >
                          {isValid
                            ? strings.products.import.validBadge
                            : strings.products.import.invalidBadge}
                        </span>
                      </div>
                      <span className={styles.previewMeta}>
                        {strings.products.import.rowLabel.replace(
                          "{row}",
                          String(row.rowNumber),
                        )}
                      </span>
                      {row.errors.length > 0 ? (
                        <ul className={styles.issueList}>
                          {row.errors.map((issue) => (
                            <li key={issue}>{issue}</li>
                          ))}
                        </ul>
                      ) : null}
                      {row.warnings.length > 0 ? (
                        <ul className={`${styles.issueList} ${styles.issueWarning}`}>
                          {row.warnings.map((warning) => (
                            <li key={warning}>{warning}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}

          {step === "done" && result ? (
            <p
              className={
                result.created > 0 ? styles.success : styles.error
              }
            >
              {result.created === 0
                ? strings.products.import.failedSummary
                : result.failed > 0
                  ? strings.products.import.partialSummary
                      .replace("{created}", String(result.created))
                      .replace("{failed}", String(result.failed))
                  : strings.products.import.successSummary.replace(
                      "{created}",
                      String(result.created),
                    )}
            </p>
          ) : null}
        </div>

        <div className={styles.actions}>
          {step === "upload" ? (
            <button type="button" className={styles.btnCancel} onClick={onClose} disabled={isParsing}>
              {strings.products.import.cancel}
            </button>
          ) : null}

          {step === "preview" ? (
            <>
              <button
                type="button"
                className={styles.btnCancel}
                onClick={() => {
                  resetState();
                }}
                disabled={isImporting}
              >
                {strings.products.import.back}
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                disabled={validRows.length === 0 || isImporting}
                onClick={() => void handleImport()}
              >
                {isImporting ? strings.products.import.importing : importActionLabel}
              </button>
            </>
          ) : null}

          {step === "done" ? (
            <button type="button" className={styles.btnPrimary} onClick={onClose}>
              {strings.common.confirm}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
