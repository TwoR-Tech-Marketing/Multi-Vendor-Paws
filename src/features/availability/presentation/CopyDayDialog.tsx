"use client";

import { useEffect, useState } from "react";

import { WEEKDAYS, type Weekday } from "@/features/availability/domain/types";
import type { AppStrings } from "@/shared/i18n/types";

import branchStyles from "@/features/branches/presentation/branches.module.css";
import styles from "./availability.module.css";

type CopyDayDialogProps = {
  from: Weekday;
  strings: AppStrings;
  onApply: (targets: Weekday[]) => void;
  onClose: () => void;
};

/** Pick the days (Saturday first) that receive the source day's hours. */
export function CopyDayDialog({ from, strings, onApply, onClose }: CopyDayDialogProps) {
  const t = strings.availability;
  const title = t.copyDayTitle.replace("{day}", t.days[from]);
  const [targets, setTargets] = useState<Weekday[]>([]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className={branchStyles.overlay} role="presentation" onMouseDown={onClose}>
      <div
        className={branchStyles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 className={branchStyles.panelTitle}>{title}</h2>
        <div className={styles.intervals}>
          {WEEKDAYS.filter((day) => day !== from).map((day) => (
            <label key={day} className={branchStyles.checkboxRow}>
              <input
                type="checkbox"
                value={day}
                checked={targets.includes(day)}
                onChange={(event) =>
                  setTargets((current) =>
                    event.target.checked ? [...current, day] : current.filter((d) => d !== day),
                  )
                }
              />
              <span>{t.days[day]}</span>
            </label>
          ))}
        </div>
        <div className={branchStyles.actions}>
          <button
            type="button"
            className={branchStyles.primaryButton}
            disabled={targets.length === 0}
            onClick={() => onApply(targets)}
          >
            {t.copyDayApply}
          </button>
          <button type="button" className={branchStyles.secondaryButton} onClick={onClose}>
            {strings.common.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
