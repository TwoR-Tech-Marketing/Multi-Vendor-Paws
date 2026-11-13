"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { ConfirmDialog } from "@/components/ui/LogoutConfirmDialog";
import { LoadErrorState } from "@/components/ui/error-state/LoadErrorState";
import { toLoadErrorView, type LoadErrorView } from "@/components/ui/error-state/load-error";
import { Routes } from "@/constants/routes";
import {
  cancelVendorAppointment,
  completeVendorAppointment,
  createExtraInvoice,
  flagNoShow,
  getVendorAppointment,
  rescheduleVendorAppointment,
  resolveLateArrival,
  voidExtraInvoice,
} from "@/features/appointments/application/appointments.api";
import type { CreateExtraInvoicePayload } from "@/features/appointments/domain/extra-invoices";
import type { AppointmentDetail } from "@/features/appointments/domain/types";
import { AppointmentActionBar } from "@/features/appointments/presentation/AppointmentActionBar";
import { AppointmentDetailView } from "@/features/appointments/presentation/AppointmentDetailView";
import { AppointmentDetailSkeleton } from "@/features/appointments/presentation/AppointmentsSkeletons";
import { CancelAppointmentDialog } from "@/features/appointments/presentation/CancelAppointmentDialog";
import { ExtraInvoiceDialog } from "@/features/appointments/presentation/ExtraInvoiceDialog";
import { ExtraInvoicesCard } from "@/features/appointments/presentation/ExtraInvoicesCard";
import { RescheduleDialog } from "@/features/appointments/presentation/RescheduleDialog";
import {
  appointmentErrorMessage,
  type AppointmentErrorContext,
} from "@/features/appointments/presentation/appointments-copy";
import {
  confirmCopy,
  isConfirmKind,
  type ConfirmKind,
  type DetailDialog,
  type SuccessKey,
} from "@/features/appointments/presentation/detail-dialogs";
import { usePreferences, useStrings } from "@/shared/preferences/PreferencesContext";

import branchStyles from "@/features/branches/presentation/branches.module.css";

export function AppointmentDetailSection({ appointmentId }: { appointmentId: string }) {
  const strings = useStrings();
  const { locale } = usePreferences();
  const t = strings.appointments;

  const [detail, setDetail] = useState<AppointmentDetail | null>(null);
  const [loadError, setLoadError] = useState<LoadErrorView | null>(null);
  const [dialog, setDialog] = useState<DetailDialog | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessKey | null>(null);

  const load = useCallback(async () => {
    try {
      setDetail(await getVendorAppointment(appointmentId));
      setLoadError(null);
    } catch (error) {
      setLoadError(toLoadErrorView(error, strings, appointmentErrorMessage(error, strings)));
    }
  }, [appointmentId, strings]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function open(next: DetailDialog) {
    setActionError(null);
    setSuccess(null);
    setDialog(next);
  }

  /** Runs one action, then reloads so the buttons follow the new allowed actions. */
  async function run(
    action: () => Promise<unknown>,
    done: SuccessKey,
    errorContext?: AppointmentErrorContext,
  ) {
    setIsSubmitting(true);
    setActionError(null);
    try {
      await action();
      setDialog(null);
      setSuccess(done);
      await load();
    } catch (error) {
      if (dialog && isConfirmKind(dialog.kind)) setDialog(null);
      setActionError(appointmentErrorMessage(error, strings, errorContext));
      await load();
    } finally {
      setIsSubmitting(false);
    }
  }

  function confirm(kind: ConfirmKind, invoiceId?: string) {
    switch (kind) {
      case "complete":
        return run(() => completeVendorAppointment(appointmentId), "completed");
      case "flagNoShow":
        return run(() => flagNoShow(appointmentId), "flagNoShow", {
          action: "flagNoShow",
          startMs: detail?.appointment.startMs ?? 0,
          locale,
        });
      case "markCompleted":
        return run(() => resolveLateArrival(appointmentId, "completed"), "markCompleted");
      case "confirmNoShow":
        return run(() => resolveLateArrival(appointmentId, "no_show"), "confirmNoShow");
      case "voidInvoice":
        return run(() => voidExtraInvoice(appointmentId, invoiceId ?? ""), "invoiceVoided");
    }
  }

  function createInvoice(payload: CreateExtraInvoicePayload, requestId: string) {
    void run(
      () => createExtraInvoice({ appointmentId, requestId, payload }),
      "invoiceCreated",
    );
  }

  if (!detail) {
    if (!loadError) return <AppointmentDetailSkeleton />;
    return (
      <div className={branchStyles.stack}>
        <div className={branchStyles.actions}>
          <Link href={Routes.vendor.appointments} className={branchStyles.linkButton}>
            {t.detail.back}
          </Link>
        </div>
        <section className={branchStyles.panel}>
          <LoadErrorState view={loadError} strings={strings} onRetry={() => void load()} />
        </section>
      </div>
    );
  }

  const { appointment, allowedActions, extraInvoices } = detail;
  const confirmKind = dialog && isConfirmKind(dialog.kind) ? dialog.kind : null;
  const copy = confirmCopy(confirmKind ?? "complete", strings);
  const voidInvoiceId = dialog && "invoiceId" in dialog ? dialog.invoiceId : undefined;

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
      <AppointmentDetailView
        appointment={appointment}
        allowedActions={allowedActions}
        strings={strings}
        locale={locale}
      />
      <ExtraInvoicesCard
        invoices={extraInvoices}
        allowedActions={allowedActions}
        strings={strings}
        locale={locale}
        disabled={isSubmitting}
        onAdd={() => open({ kind: "createInvoice" })}
        onVoid={(invoiceId) => open({ kind: "voidInvoice", invoiceId })}
      />
      <AppointmentActionBar
        actions={allowedActions}
        strings={strings}
        disabled={isSubmitting}
        onAction={(kind) => open({ kind })}
      />
      <ConfirmDialog
        open={confirmKind !== null}
        title={copy.title}
        message={copy.message}
        confirmLabel={isSubmitting ? t.actions.working : copy.confirmLabel}
        cancelLabel={copy.cancelLabel}
        isConfirming={isSubmitting}
        onCancel={() => setDialog(null)}
        onConfirm={() => (confirmKind ? confirm(confirmKind, voidInvoiceId) : undefined)}
      />
      {dialog?.kind === "cancel" ? (
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
      {dialog?.kind === "reschedule" ? (
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
      {dialog?.kind === "createInvoice" ? (
        <ExtraInvoiceDialog
          branchId={appointment.branchId}
          strings={strings}
          locale={locale}
          isSubmitting={isSubmitting}
          error={actionError}
          onConfirm={createInvoice}
          onClose={() => setDialog(null)}
        />
      ) : null}
    </div>
  );
}
