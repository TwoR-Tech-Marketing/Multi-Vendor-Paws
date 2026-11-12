"use client";

import { clampCapacity } from "@/features/availability/domain/schemas";
import { AVAILABILITY_LIMITS as L } from "@/features/availability/domain/types";
import type { AppStrings } from "@/shared/i18n/types";

import branchStyles from "@/features/branches/presentation/branches.module.css";
import styles from "./availability.module.css";

type CapacityStepperProps = {
  label: string;
  value: number;
  strings: AppStrings;
  readOnly: boolean;
  onChange: (value: number) => void;
};

export function CapacityStepper({ label, value, strings, readOnly, onChange }: CapacityStepperProps) {
  const t = strings.availability;
  return (
    <div className={styles.capacityRow}>
      <div className={branchStyles.field}>
        <span className={branchStyles.label}>{label}</span>
        <p className={branchStyles.muted}>{t.capacityHint}</p>
      </div>
      <div className={styles.stepper} role="group" aria-label={label}>
        {readOnly ? null : (
          <button
            type="button"
            className={styles.stepperButton}
            aria-label={t.decrease}
            disabled={value <= L.minCapacity}
            onClick={() => onChange(clampCapacity(value - 1))}
          >
            -
          </button>
        )}
        <output className={styles.stepperValue} aria-live="polite">
          {value}
        </output>
        {readOnly ? null : (
          <button
            type="button"
            className={styles.stepperButton}
            aria-label={t.increase}
            disabled={value >= L.maxCapacity}
            onClick={() => onChange(clampCapacity(value + 1))}
          >
            +
          </button>
        )}
      </div>
    </div>
  );
}
