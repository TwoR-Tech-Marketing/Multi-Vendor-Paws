import type { AppStrings } from "@/shared/i18n/types";

import styles from "./telehealth.module.css";

type TelehealthAvailabilityToggleProps = {
  online: boolean;
  canGoOnline: boolean;
  isBusy: boolean;
  strings: AppStrings;
  onToggle: () => void;
};

/** Online status badge plus the go online / go offline switch. Pure. */
export function TelehealthAvailabilityToggle({
  online,
  canGoOnline,
  isBusy,
  strings,
  onToggle,
}: TelehealthAvailabilityToggleProps) {
  const t = strings.telehealth;
  // Going offline is always allowed; going online needs an active account.
  const disabled = isBusy || (!online && !canGoOnline);
  return (
    <div className={styles.availability} role="group" aria-label={t.availabilityLabel}>
      <span
        className={`${styles.badge} ${online ? styles.badgeOnline : styles.badgeOffline}`}
        role="status"
      >
        {online ? t.online : t.offline}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={online}
        className={online ? styles.secondaryButton : styles.primaryButton}
        disabled={disabled}
        onClick={onToggle}
      >
        {online ? t.goOffline : t.goOnline}
      </button>
    </div>
  );
}
