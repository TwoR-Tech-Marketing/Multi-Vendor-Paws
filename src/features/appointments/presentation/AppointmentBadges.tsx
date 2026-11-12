import type { AppointmentStatus, NoShowState } from "@/features/appointments/domain/types";
import type { AppStrings } from "@/shared/i18n/types";

import styles from "./appointments.module.css";

const STATUS_TONE: Record<AppointmentStatus, string> = {
  paid: styles.toneBooked,
  rescheduled: styles.toneBooked,
  completed: styles.toneDone,
  cancelled_by_user: styles.toneMuted,
  cancelled_by_clinic: styles.toneMuted,
  no_show: styles.toneError,
  refund_pending: styles.toneWarning,
  refunded: styles.toneMuted,
};

/** Status, held and no-show state badges. Text always, color only adds. */
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
      <span className={`${styles.badge} ${STATUS_TONE[status]}`}>{t.status[status]}</span>
      {held ? <span className={`${styles.badge} ${styles.toneWarning}`}>{t.held}</span> : null}
      {noShowState ? (
        <span className={`${styles.badge} ${styles.toneMuted}`}>{t.noShow.state[noShowState]}</span>
      ) : null}
    </span>
  );
}
