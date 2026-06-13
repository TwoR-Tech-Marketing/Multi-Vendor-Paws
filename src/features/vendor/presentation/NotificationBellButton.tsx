"use client";

import { IconBell } from "@/features/vendor/presentation/PortalNavIcons";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./portal.module.css";

export function NotificationBellButton() {
  const strings = useStrings();

  return (
    <div className={styles.bellWrap}>
      <button
        type="button"
        className={styles.bellBtn}
        aria-label={strings.notifications.open}
        disabled
        title={strings.notifications.comingSoon}
      >
        <span className={styles.bellIcon} aria-hidden>
          <IconBell width={22} height={22} />
        </span>
      </button>
    </div>
  );
}
