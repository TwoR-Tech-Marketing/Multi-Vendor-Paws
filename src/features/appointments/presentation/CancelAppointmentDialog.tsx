"use client";

import { useEffect, useState } from "react";

import { isValidReason } from "@/features/appointments/domain/actions";
import { ReasonField } from "@/features/appointments/presentation/ReasonField";
import type { AppStrings } from "@/shared/i18n/types";

import branchStyles from "@/features/branches/presentation/branches.module.css";

type CancelAppointmentDialogProps = {
  strings: AppStrings;
  isSubmitting: boolean;
  error: string | null;
  onConfirm: (reason: string) => void;
  onClose: () => void;
};

/** Cancel with a required reason the customer will see. */
export function CancelAppointmentDialog({
  strings,
  isSubmitting,
  error,
  onConfirm,
  onClose,
}: CancelAppointmentDialogProps) {
  const t = strings.appointments;
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const valid = isValidReason(reason);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, isSubmitting]);

  return (
    <div className={branchStyles.overlay} role="presentation">
      <div
        className={branchStyles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={t.dialogs.cancelTitle}
      >
        <h2 className={branchStyles.panelTitle}>{t.dialogs.cancelTitle}</h2>
        <p className={branchStyles.muted}>{t.dialogs.cancelBody}</p>
        <ReasonField
          label={t.cancelReason}
          value={reason}
          showError={touched && !valid}
          strings={strings}
          onChange={(value) => {
            setTouched(true);
            setReason(value);
          }}
        />
        {error ? (
          <div className={branchStyles.alertError} role="alert">
            {error}
          </div>
        ) : null}
        <div className={branchStyles.actions}>
          <button
            type="button"
            className={branchStyles.dangerButton}
            disabled={!valid || isSubmitting}
            onClick={() => onConfirm(reason)}
          >
            {isSubmitting ? t.actions.working : t.actions.cancel}
          </button>
          <button
            type="button"
            className={branchStyles.secondaryButton}
            disabled={isSubmitting}
            onClick={onClose}
          >
            {t.dialogs.keep}
          </button>
        </div>
      </div>
    </div>
  );
}
