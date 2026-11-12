"use client";

import { useEffect, useState } from "react";

import type { AvailabilityConflict } from "@/features/availability/domain/types";
import { conflictWhen } from "@/features/availability/presentation/availability-copy";
import type { BranchService } from "@/features/branches/domain/types";
import { serviceDisplayName } from "@/features/branches/presentation/branch-copy";
import type { AppStrings } from "@/shared/i18n/types";

import branchStyles from "@/features/branches/presentation/branches.module.css";
import styles from "./availability.module.css";

type ConflictsDialogProps = {
  conflicts: AvailabilityConflict[];
  /** Ids the provider already chose to keep in an earlier attempt. */
  initialKept?: string[];
  services: BranchService[];
  strings: AppStrings;
  locale: string;
  isSubmitting: boolean;
  onSubmit: (keepAppointmentIds: string[]) => void;
  onClose: () => void;
};

/**
 * Lists booked appointments that no longer fit. Nothing is cancelled: the
 * save goes through only when every conflict is kept explicitly. Remount with
 * a new `key` for a new conflict list.
 */
export function ConflictsDialog({
  conflicts,
  initialKept = [],
  services,
  strings,
  locale,
  isSubmitting,
  onSubmit,
  onClose,
}: ConflictsDialogProps) {
  const t = strings.availability.conflicts;
  const [kept, setKept] = useState<string[]>(
    initialKept.filter((id) => conflicts.some((c) => c.appointmentId === id)),
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSubmitting, onClose]);

  const allKept = conflicts.every((c) => kept.includes(c.appointmentId));
  const serviceName = (id: string) => {
    const service = services.find((s) => s.serviceId === id);
    return service ? serviceDisplayName(service, locale) : "";
  };

  return (
    <div className={branchStyles.overlay} role="presentation" onMouseDown={isSubmitting ? undefined : onClose}>
      <div
        className={branchStyles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={t.title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 className={branchStyles.panelTitle}>{t.title}</h2>
        <p className={branchStyles.muted}>{t.body}</p>
        <ul className={styles.conflictList}>
          {conflicts.map((conflict) => {
            const names = conflict.serviceIds.map(serviceName).filter(Boolean).join(", ");
            return (
              <li key={conflict.appointmentId} className={styles.conflictItem} data-id={conflict.appointmentId}>
                <p className={styles.conflictTitle}>{conflictWhen(conflict, strings, locale)}</p>
                {names ? <p className={branchStyles.muted}>{names}</p> : null}
                <p className={branchStyles.muted}>
                  {conflict.mode === "home" ? strings.availability.tabs.homeVisit : strings.availability.tabs.weekly}
                  {" · "}
                  {t.reason[conflict.reason]}
                </p>
                <label className={branchStyles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={kept.includes(conflict.appointmentId)}
                    onChange={(event) =>
                      setKept((current) =>
                        event.target.checked
                          ? [...current, conflict.appointmentId]
                          : current.filter((id) => id !== conflict.appointmentId),
                      )
                    }
                  />
                  <span>{t.keep}</span>
                </label>
              </li>
            );
          })}
        </ul>
        <div className={branchStyles.actions}>
          <button
            type="button"
            className={branchStyles.primaryButton}
            disabled={!allKept || isSubmitting}
            onClick={() => onSubmit(kept)}
          >
            {isSubmitting ? strings.availability.saving : t.submit}
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
