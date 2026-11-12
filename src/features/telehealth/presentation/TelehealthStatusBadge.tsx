import type { TelehealthSessionStatus } from "@/features/telehealth/domain/types";
import type { AppStrings } from "@/shared/i18n/types";

import styles from "./telehealth.module.css";

const TONE: Record<TelehealthSessionStatus, string> = {
  queued: styles.badgeWaiting,
  active: styles.badgeOnline,
  ended: styles.badgeClosed,
  refund_flagged: styles.badgeClosed,
  unknown: styles.badgeClosed,
};

export function TelehealthStatusBadge({
  status,
  strings,
}: {
  status: TelehealthSessionStatus;
  strings: AppStrings;
}) {
  return (
    <span className={`${styles.badge} ${TONE[status]}`}>
      {strings.telehealth.statusLabels[status]}
    </span>
  );
}
