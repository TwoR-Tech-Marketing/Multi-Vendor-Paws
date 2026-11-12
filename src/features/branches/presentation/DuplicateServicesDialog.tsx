"use client";

import { useEffect, useState } from "react";

import { PortalSelect } from "@/components/ui/select/PortalSelect";
import { SkeletonText } from "@/components/ui/skeleton";
import type { Branch, BranchService } from "@/features/branches/domain/types";
import { serviceDisplayName } from "@/features/branches/presentation/branch-copy";
import type { AppStrings } from "@/shared/i18n/types";

import styles from "./branches.module.css";

type DuplicateServicesDialogProps = {
  open: boolean;
  strings: AppStrings;
  locale: string;
  /** Other active branches that have services. */
  sources: Branch[];
  fromBranchId: string;
  onFromChange: (branchId: string) => void;
  /** Active services of the source branch; null while loading. */
  services: BranchService[] | null;
  isSubmitting: boolean;
  error: string | null;
  resultMessage: string | null;
  onSubmit: (input: { serviceIds?: string[]; skipExisting: boolean }) => void;
  onClose: () => void;
};

export function DuplicateServicesDialog({
  open,
  strings,
  locale,
  sources,
  fromBranchId,
  onFromChange,
  services,
  isSubmitting,
  error,
  resultMessage,
  onSubmit,
  onClose,
}: DuplicateServicesDialogProps) {
  const t = strings.services.duplicate;
  const [selected, setSelected] = useState<string[] | "all">("all");
  const [skipExisting, setSkipExisting] = useState(true);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, isSubmitting, onClose]);

  if (!open) return null;

  const active = (services ?? []).filter((s) => s.status === "active");
  const isAll = selected === "all";
  const chosen = isAll ? active.map((s) => s.serviceId) : selected;
  const canSubmit =
    !isSubmitting && services !== null && active.length > 0 && chosen.length > 0;

  function toggle(serviceId: string) {
    const current = isAll ? active.map((s) => s.serviceId) : (selected as string[]);
    setSelected(
      current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId],
    );
  }

  return (
    <div className={styles.overlay} role="presentation" onMouseDown={isSubmitting ? undefined : onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={t.title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 className={styles.panelTitle}>{t.title}</h2>
        {error ? (
          <div className={styles.alertError} role="alert">
            {error}
          </div>
        ) : null}
        {resultMessage ? (
          <div className={styles.alertSuccess} role="status">
            {resultMessage}
          </div>
        ) : null}

        {sources.length === 0 ? (
          <p className={styles.muted}>{t.noSources}</p>
        ) : (
          <>
            <div className={styles.field}>
              <span className={styles.label}>{t.from}</span>
              <PortalSelect
                value={fromBranchId}
                ariaLabel={t.from}
                options={sources.map((b) => ({ value: b.branchId, label: b.name }))}
                onChange={(value) => {
                  setSelected("all");
                  onFromChange(value);
                }}
              />
            </div>

            <div className={styles.field}>
              <span className={styles.label}>{t.select}</span>
              {services === null ? (
                <div className={styles.checkList} role="status" aria-busy="true" aria-label={strings.common.loading}>
                  <SkeletonText size="sm" width="70%" />
                  <SkeletonText size="sm" width="60%" />
                  <SkeletonText size="sm" width="65%" />
                </div>
              ) : active.length === 0 ? (
                <p className={styles.muted}>{t.noServices}</p>
              ) : (
                <div className={styles.checkList}>
                  <label className={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={isAll}
                      onChange={(e) => setSelected(e.target.checked ? "all" : [])}
                    />
                    <span>{t.selectAll}</span>
                  </label>
                  {active.map((service) => (
                    <label key={service.serviceId} className={styles.checkboxRow}>
                      <input
                        type="checkbox"
                        value={service.serviceId}
                        checked={chosen.includes(service.serviceId)}
                        onChange={() => toggle(service.serviceId)}
                      />
                      <span>{serviceDisplayName(service, locale)}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={skipExisting}
                onChange={(e) => setSkipExisting(e.target.checked)}
              />
              <span>{t.skipExisting}</span>
            </label>
          </>
        )}

        <div className={styles.actions}>
          {sources.length > 0 ? (
            <button
              type="button"
              className={styles.primaryButton}
              disabled={!canSubmit}
              onClick={() =>
                onSubmit({ serviceIds: isAll ? undefined : chosen, skipExisting })
              }
            >
              {isSubmitting ? t.submitting : t.submit}
            </button>
          ) : null}
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onClose}
            disabled={isSubmitting}
          >
            {strings.common.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
