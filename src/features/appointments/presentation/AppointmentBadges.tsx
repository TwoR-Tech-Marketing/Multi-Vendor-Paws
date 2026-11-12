import { StatusBadge, type StatusTone } from "@/components/ui/badge/StatusBadge";
import type { AppointmentStatus, NoShowState } from "@/features/appointments/domain/types";
import type { AppStrings } from "@/shared/i18n/types";

import styles from "./appointments.module.css";

export const APPOINTMENT_STATUS_TONE: Record<AppointmentStatus, StatusTone> = {
  paid: "confirmed",
  rescheduled: "confirmed",
  completed: "success",
  cancelled_by_user: "cancelled",
  cancelled_by_clinic: "cancelled",
  no_show: "danger",
  refund_pending: "warning",
  refunded: "neutral",
};

/** Status, held and no-show state badges. Text and shape always, color only adds. */
export function AppointmentBadges({
  status,
  held,
  noShowState,
  strings,
}: {
  status: AppointmentStatus;
  held: boolean;
  noShowState: NoShowState | null;
  strings: AppStrings;
}) {
  const t = strings.appointments;
  return (
    <span className={styles.badges}>
      <StatusBadge tone={APPOINTMENT_STATUS_TONE[status]} label={t.status[status]} status={status} />
      {held ? <StatusBadge tone="hold" label={t.held} status="held" /> : null}
      {noShowState ? (
        <StatusBadge tone="neutral" label={t.noShow.state[noShowState]} status={noShowState} />
      ) : null}
    </span>
  );
}
