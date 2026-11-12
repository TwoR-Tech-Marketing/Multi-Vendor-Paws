import { useId } from "react";

import { APPOINTMENT_LIMITS } from "@/features/appointments/domain/types";
import type { AppStrings } from "@/shared/i18n/types";

import branchStyles from "@/features/branches/presentation/branches.module.css";
import styles from "./appointments.module.css";

/** Required reason textarea (3 to 300 characters) shared by cancel and reschedule. */
export function ReasonField({
  label,
  value,
  showError,
  strings,
  onChange,
}: {
  label: string;
  value: string;
  showError: boolean;
  strings: AppStrings;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div className={branchStyles.field}>
      <label className={branchStyles.label} htmlFor={id}>
        {label}
      </label>
      <textarea
        id={id}
        className={styles.textarea}
        value={value}
        maxLength={APPOINTMENT_LIMITS.reasonMax}
        aria-describedby={hintId}
        aria-invalid={showError}
        onChange={(event) => onChange(event.target.value)}
      />
      <p id={hintId} className={showError ? branchStyles.fieldError : branchStyles.muted}>
        {showError ? strings.appointments.reasonInvalid : strings.appointments.reasonHint}
      </p>
    </div>
  );
}
