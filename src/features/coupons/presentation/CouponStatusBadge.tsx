import type { CouponStatus } from "@/features/coupons/domain/types";
import type { AppStrings } from "@/shared/i18n/types";

import styles from "./coupons.module.css";

const TONE: Record<CouponStatus, string> = {
  active: styles.badgeActive,
  paused: styles.badgePaused,
  expired: styles.badgeEnded,
  exhausted: styles.badgeEnded,
};

export function CouponStatusBadge({ status, strings }: { status: CouponStatus; strings: AppStrings }) {
  return (
    <span className={`${styles.badge} ${TONE[status]}`} data-status={status}>
      {strings.coupons.status[status]}
    </span>
  );
}
