"use client";

import { useEffect, useState } from "react";

import { isValidReason } from "@/features/appointments/domain/actions";
import { cairoTodayIso } from "@/features/appointments/domain/filters";
import { APPOINTMENT_LIMITS, type Appointment } from "@/features/appointments/domain/types";
import { ReasonField } from "@/features/appointments/presentation/ReasonField";
import { listBranchSlots } from "@/features/availability/application/availability.api";
import { addDays, formatDayLabel, formatTime12 } from "@/features/availability/domain/time";
import type { SlotPreview } from "@/features/availability/domain/types";
import type { AppStrings } from "@/shared/i18n/types";

import branchStyles from "@/features/branches/presentation/branches.module.css";
import { SkeletonButton, SkeletonText } from "@/components/ui/skeleton";
import styles from "./appointments.module.css";

/** Weeks ahead the picker pages through (the booking window is 30 days). */
const MAX_WEEK = 4;

type RescheduleDialogProps = {
  appointment: Appointment;
  strings: AppStrings;
  locale: string;
  isSubmitting: boolean;
  error: string | null;
  onConfirm: (startMs: number, reason: string) => void;
  onClose: () => void;
};

function SlotsSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-busy="true" aria-label={label}>
      {[0, 1, 2].map((day) => (
        <div key={day} className={styles.slotDay}>
          <SkeletonText size="md" width={140} />
          <div className={styles.chips}>
            <SkeletonButton width={88} />
            <SkeletonButton width={88} />
            <SkeletonButton width={88} />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * New time from the server's open slots for the appointment's branch and mode,
 * plus the required reason. The server rechecks the slot when saving.
 */
export function RescheduleDialog({
  appointment,
  strings,
  locale,
  isSubmitting,
  error,
  onConfirm,
  onClose,
}: RescheduleDialogProps) {
  const t = strings.appointments;
  const [week, setWeek] = useState(0);
  const [preview, setPreview] = useState<SlotPreview | null>(null);
  const [slotsError, setSlotsError] = useState(false);
  const [startMs, setStartMs] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const serviceId = appointment.serviceIds[0] ?? appointment.services[0]?.serviceId ?? "";

  useEffect(() => {
    let cancelled = false;
    const fromDate = addDays(cairoTodayIso(Date.now()), week * APPOINTMENT_LIMITS.slotWindowDays);
    listBranchSlots({
      branchId: appointment.branchId,
      serviceId,
      mode: appointment.mode,
      fromDate,
      toDate: addDays(fromDate, APPOINTMENT_LIMITS.slotWindowDays - 1),
    })
      .then((next) => {
        if (!cancelled) setPreview(next);
      })
      .catch(() => {
        if (!cancelled) setSlotsError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [appointment.branchId, appointment.mode, serviceId, week]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, isSubmitting]);

  function goToWeek(next: number) {
    setPreview(null);
    setSlotsError(false);
    setWeek(next);
  }

  const reasonValid = isValidReason(reason);

  function slots() {
    if (slotsError) {
      return (
        <div className={branchStyles.alertError} role="alert">
          {t.dialogs.slotsError}
        </div>
      );
    }
    if (!preview) return <SlotsSkeleton label={strings.common.loading} />;
    return (
      <div role="group" aria-label={t.dialogs.slotsLabel}>
        {preview.days.map((day) => (
          <div key={day.date} className={styles.slotDay}>
            <span className={branchStyles.label}>{formatDayLabel(day.date, locale)}</span>
            {day.closed || day.slots.length === 0 ? (
              <span className={branchStyles.muted}>
                {day.closed ? t.dialogs.closed : t.dialogs.noSlots}
              </span>
            ) : (
              <div className={styles.chips}>
                {day.slots.map((slot) => (
                  <button
                    key={slot.startMs}
                    type="button"
                    aria-pressed={startMs === slot.startMs}
                    disabled={slot.remaining <= 0 || slot.startMs === appointment.startMs}
                    className={`${styles.slot} ${startMs === slot.startMs ? styles.chipActive : ""}`}
                    onClick={() => setStartMs(slot.startMs)}
                  >
                    {formatTime12(slot.startLocal, strings.availability)}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={branchStyles.overlay} role="presentation">
      <div
        className={branchStyles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={t.dialogs.rescheduleTitle}
      >
        <h2 className={branchStyles.panelTitle}>{t.dialogs.rescheduleTitle}</h2>
        <p className={branchStyles.muted}>{t.dialogs.rescheduleHint}</p>
        <div className={branchStyles.actions}>
          <button
            type="button"
            className={branchStyles.secondaryButton}
            disabled={week === 0}
            onClick={() => goToWeek(week - 1)}
          >
            {t.dialogs.previousWeek}
          </button>
          <button
            type="button"
            className={branchStyles.secondaryButton}
            disabled={week >= MAX_WEEK}
            onClick={() => goToWeek(week + 1)}
          >
            {t.dialogs.nextWeek}
          </button>
        </div>
        {slots()}
        <ReasonField
          label={t.rescheduleReason}
          value={reason}
          showError={touched && !reasonValid}
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
            className={branchStyles.primaryButton}
            disabled={startMs === null || !reasonValid || isSubmitting}
            onClick={() => startMs !== null && onConfirm(startMs, reason)}
          >
            {isSubmitting ? t.actions.working : t.dialogs.rescheduleConfirm}
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
