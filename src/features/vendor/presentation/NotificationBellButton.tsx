"use client";

import { Strings } from "@/constants/strings";
import { IconBell } from "@/features/vendor/presentation/PortalNavIcons";

import styles from "./portal.module.css";

export function NotificationBellButton() {
  return (
    <div className={styles.bellWrap}>
      <button
        type="button"
        className={styles.bellBtn}
        aria-label={Strings.notifications.open}
        disabled
        title={Strings.notifications.comingSoon}
      >
        <span className={styles.bellIcon} aria-hidden>
          <IconBell width={22} height={22} />
        </span>
      </button>
    </div>
  );
}
