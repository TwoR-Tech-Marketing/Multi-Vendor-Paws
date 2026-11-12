"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { ConfirmDialog } from "@/components/ui/LogoutConfirmDialog";
import { Routes } from "@/constants/routes";
import {
  cancelVendorAppointment,
  completeVendorAppointment,
  getVendorAppointment,
  rescheduleVendorAppointment,
} from "@/features/appointments/application/appointments.api";
import type { AppointmentAction, AppointmentDetail } from "@/features/appointments/domain/types";
import { AppointmentActionBar } from "@/features/appointments/presentation/AppointmentActionBar";
import { AppointmentDetailView } from "@/features/appointments/presentation/AppointmentDetailView";
import { AppointmentDetailSkeleton } from "@/features/appointments/presentation/AppointmentsSkeletons";
import { CancelAppointmentDialog } from "@/features/appointments/presentation/CancelAppointmentDialog";
import { RescheduleDialog } from "@/features/appointments/presentation/RescheduleDialog";
import { appointmentErrorMessage } from "@/features/appointments/presentation/appointments-copy";
import { usePreferences, useStrings } from "@/shared/preferences/PreferencesContext";

import branchStyles from "@/features/branches/presentation/branches.module.css";

type SuccessKey = "completed" | "cancelled" | "rescheduled";

export function AppointmentDetailSection({ appointmentId }: { appointmentId: string }) {
  const strings = useStrings();
  const { locale } = usePreferences();
  const t = strings.appointments;

  const [detail, setDetail] = useState<AppointmentDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<AppointmentAction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessKey | null>(null);

  const load = useCallback(async () => {
    try {
      setDetail(await getVendorAppointment(appointmentId));
      setLoadError(null);
    } catch (error) {
      setLoadError(appointmentErrorMessage(error, strings));
    }
  }, [appointmentId, strings]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function open(action: AppointmentAction) {
    setActionError(null);
    setSuccess(null);
    setDialog(action);
  }

  /** Runs one action, then reloads so the buttons follow the new allowed actions. */
  async function run(action: () => Promise<unknown>, done: SuccessKey) {
    setIsSubmitting(true);
    setActionError(null);
    try {
      await action();
      setDialog(null);
      setSuccess(done);
      await load();
    } catch (error) {
      if (dialog === "complete") setDialog(null);
      setActionError(appointmentErrorMessage(error, strings));
      await load();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!detail) {
    if (!loadError) return <AppointmentDetailSkeleton />;
    return (
      <div className={branchStyles.stack}>
        <div className={branchStyles.alertError} role="alert">
          {loadError}
        </div>
        <div className={branchStyles.actions}>
          <button type="button" className={branchStyles.secondaryButton} onClick={() => void load()}>
            {strings.common.retry}
          </button>
          <Link href={Routes.vendor.appointments} className={branchStyles.linkButton}>
            {t.detail.back}
          </Link>
        </div>
      </div>
    );
  }

  const { appointment, allowedActions } = detail;

  return (
    <div className={branchStyles.stack}>
      <div className={branchStyles.actions}>
        <Link href={Routes.vendor.appointments} className={branchStyles.linkButton}>
          {t.detail.back}
        </Link>
      </div>
      {success ? (
        <div className={branchStyles.alertSuccess} role="status">
          {t.success[success]}
        </div>
      ) : null}
      {actionError && dialog === null ? (
        <div className={branchStyles.alertError} role="alert">
          {actionError}
        </div>
      ) : null}
      <AppointmentDetailView appointment={appointment} strings={strings} locale={locale} />
      <AppointmentActionBar
        actions={allowedActions}
        strings={strings}
        disabled={isSubmitting}
        onAction={open}
      />
      <ConfirmDialog
        open={dialog === "complete"}
        title={t.dialogs.completeTitle}
        message={t.dialogs.completeBody}
        confirmLabel={isSubmitting ? t.actions.working : t.actions.complete}
        cancelLabel={strings.common.cancel}
        isConfirming={isSubmitting}
        onCancel={() => setDialog(null)}
        onConfirm={() => run(() => completeVendorAppointment(appointmentId), "completed")}
      />
      {dialog === "cancel" ? (
        <CancelAppointmentDialog
          strings={strings}
          isSubmitting={isSubmitting}
          error={actionError}
          onConfirm={(reason) =>
            void run(() => cancelVendorAppointment(appointmentId, reason), "cancelled")
          }
          onClose={() => setDialog(null)}
        />
      ) : null}
      {dialog === "reschedule" ? (
        <RescheduleDialog
          appointment={appointment}
          strings={strings}
          locale={locale}
          isSubmitting={isSubmitting}
          error={actionError}
          onConfirm={(startMs, reason) =>
            void run(
              () => rescheduleVendorAppointment({ appointmentId, startMs, reason }),
              "rescheduled",
            )
          }
          onClose={() => setDialog(null)}
        />
      ) : null}
    </div>
  );
}
