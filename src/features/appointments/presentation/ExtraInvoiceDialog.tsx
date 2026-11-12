"use client";

import { useEffect, useId, useMemo, useState } from "react";

import { SkeletonButton, SkeletonFormField } from "@/components/ui/skeleton";
import { listInvoiceServices } from "@/features/appointments/application/invoice-services";
import {
  checkInvoiceDraft,
  emptyInvoiceLine,
  type CreateExtraInvoicePayload,
  type InvoiceDraft,
  type InvoiceDraftCheck,
  type InvoiceServiceOption,
} from "@/features/appointments/domain/extra-invoices";
import { EXTRA_INVOICE_LIMITS } from "@/features/appointments/domain/types";
import { InvoiceLineFields } from "@/features/appointments/presentation/InvoiceLineFields";
import { formatEgp } from "@/features/products/domain/currency";
import type { AppStrings } from "@/shared/i18n/types";

import branchStyles from "@/features/branches/presentation/branches.module.css";
import styles from "./appointments.module.css";

type ServicesState =
  | { kind: "loading" }
  | { kind: "ready"; services: InvoiceServiceOption[] }
  | { kind: "error" };

type ExtraInvoiceDialogProps = {
  branchId: string;
  strings: AppStrings;
  locale: string;
  isSubmitting: boolean;
  error: string | null;
  onConfirm: (payload: CreateExtraInvoicePayload) => void;
  onClose: () => void;
};

function LinesSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className={styles.invoiceLine}>
      <SkeletonFormField labelWidth={64} />
      <SkeletonFormField labelWidth={56} />
      <SkeletonFormField labelWidth={48} />
      <SkeletonButton width={96} />
    </div>
  );
}

/** Draft-level messages: line count, total range and note length. */
function draftMessages(check: InvoiceDraftCheck, strings: AppStrings): string[] {
  const v = strings.extraInvoices.validation;
  const out: string[] = [];
  if (check.linesIssue === "empty") out.push(v.empty);
  if (check.linesIssue === "tooMany") out.push(v.tooMany);
  if (check.totalIssue === "min") out.push(v.totalMin);
  if (check.totalIssue === "max") out.push(v.totalMax);
  if (check.noteInvalid) out.push(v.note);
  return out;
}

/**
 * New extra invoice with branch service lines and custom lines. Validation
 * mirrors the server limits for feedback only; the server prices service
 * lines and has the final say.
 */
export function ExtraInvoiceDialog({
  branchId,
  strings,
  locale,
  isSubmitting,
  error,
  onConfirm,
  onClose,
}: ExtraInvoiceDialogProps) {
  const t = strings.extraInvoices;
  const noteId = useId();
  const [services, setServices] = useState<ServicesState>({ kind: "loading" });
  const [nextKey, setNextKey] = useState(1);
  const [draft, setDraft] = useState<InvoiceDraft>({ lines: [emptyInvoiceLine("0")], note: "" });
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    let active = true;
    /** Without branch services every line starts as a custom item. */
    const switchToCustomLines = () =>
      setDraft((d) => ({ ...d, lines: d.lines.map((l) => ({ ...l, kind: "custom" as const })) }));
    listInvoiceServices(branchId)
      .then((list) => {
        if (!active) return;
        setServices({ kind: "ready", services: list });
        if (list.length === 0) switchToCustomLines();
      })
      .catch(() => {
        if (!active) return;
        setServices({ kind: "error" });
        switchToCustomLines();
      });
    return () => {
      active = false;
    };
  }, [branchId]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, isSubmitting]);

  const serviceList = useMemo(
    () => (services.kind === "ready" ? services.services : []),
    [services],
  );
  const check = useMemo(() => checkInvoiceDraft(draft, serviceList), [draft, serviceList]);
  const messages = showErrors ? draftMessages(check, strings) : [];

  function addLine() {
    const kind = serviceList.length > 0 ? "service" : "custom";
    setDraft((d) => ({ ...d, lines: [...d.lines, emptyInvoiceLine(String(nextKey), kind)] }));
    setNextKey((k) => k + 1);
  }

  function submit() {
    setShowErrors(true);
    if (check.payload) onConfirm(check.payload);
  }

  return (
    <div className={branchStyles.overlay} role="presentation">
      <div className={branchStyles.modal} role="dialog" aria-modal="true" aria-label={t.dialogTitle}>
        <h2 className={branchStyles.panelTitle}>{t.dialogTitle}</h2>
        <p className={branchStyles.muted}>{t.hint}</p>
        {services.kind === "error" ? <p className={branchStyles.muted}>{t.servicesError}</p> : null}
        {services.kind === "ready" && services.services.length === 0 ? (
          <p className={branchStyles.muted}>{t.noServices}</p>
        ) : null}
        {services.kind === "loading" ? (
          <LinesSkeleton label={strings.common.loading} />
        ) : (
          draft.lines.map((line, index) => (
            <InvoiceLineFields
              key={line.key}
              line={line}
              index={index}
              check={check.lines[index]}
              services={serviceList}
              showErrors={showErrors}
              canRemove={draft.lines.length > 1}
              strings={strings}
              locale={locale}
              onChange={(next) =>
                setDraft((d) => ({ ...d, lines: d.lines.map((l) => (l.key === next.key ? next : l)) }))
              }
              onRemove={() =>
                setDraft((d) => ({ ...d, lines: d.lines.filter((l) => l.key !== line.key) }))
              }
            />
          ))
        )}
        {services.kind !== "loading" && draft.lines.length < EXTRA_INVOICE_LIMITS.maxLines ? (
          <div className={branchStyles.actions}>
            <button type="button" className={branchStyles.secondaryButton} onClick={addLine}>
              {t.addLine}
            </button>
          </div>
        ) : null}
        <div className={branchStyles.field}>
          <label className={branchStyles.label} htmlFor={noteId}>
            {t.note}
          </label>
          <textarea
            id={noteId}
            className={styles.textarea}
            value={draft.note}
            maxLength={EXTRA_INVOICE_LIMITS.noteMax}
            onChange={(event) => setDraft((d) => ({ ...d, note: event.target.value }))}
          />
          <p className={branchStyles.muted}>{t.noteHint}</p>
        </div>
        <ul className={styles.lines}>
          <li className={styles.lineTotal}>
            <span>{t.total}</span>
            <span>{formatEgp(check.totalPiastres)}</span>
          </li>
        </ul>
        {messages.map((message) => (
          <p key={message} className={branchStyles.fieldError}>
            {message}
          </p>
        ))}
        {error ? (
          <div className={branchStyles.alertError} role="alert">
            {error}
          </div>
        ) : null}
        <div className={branchStyles.actions}>
          <button
            type="button"
            className={branchStyles.primaryButton}
            disabled={isSubmitting || services.kind === "loading"}
            onClick={submit}
          >
            {isSubmitting ? strings.appointments.actions.working : t.create}
          </button>
          <button
            type="button"
            className={branchStyles.secondaryButton}
            disabled={isSubmitting}
            onClick={onClose}
          >
            {strings.common.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
