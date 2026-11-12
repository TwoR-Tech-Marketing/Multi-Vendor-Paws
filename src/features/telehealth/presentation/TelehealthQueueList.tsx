import type { TelehealthQueueItem } from "@/features/telehealth/domain/types";
import {
  formatPet,
  formatTelehealthClock,
} from "@/features/telehealth/presentation/telehealth-copy";
import type { AppStrings } from "@/shared/i18n/types";

import styles from "./telehealth.module.css";

type TelehealthQueueListProps = {
  items: TelehealthQueueItem[];
  strings: AppStrings;
  locale: string;
  acceptingId: string | null;
  onAccept: (sessionId: string) => void;
};

/** Waiting consultations, oldest first, each with an accept button. Pure. */
export function TelehealthQueueList({
  items,
  strings,
  locale,
  acceptingId,
  onAccept,
}: TelehealthQueueListProps) {
  const t = strings.telehealth;
  if (items.length === 0) return <p className={styles.muted}>{t.queueEmpty}</p>;
  return (
    <ul className={styles.list}>
      {items.map((item) => {
        const pet = formatPet(item.buyer);
        const isAccepting = acceptingId === item.sessionId;
        return (
          <li key={item.sessionId} className={styles.row}>
            <div className={styles.rowMain}>
              <p className={styles.rowTitle}>
                {item.buyer.displayName}
                {pet ? ` · ${pet}` : ""}
              </p>
              <p className={styles.rowText}>{item.intakeNote}</p>
              <div className={styles.rowMeta}>
                <span>
                  {t.waitingSince.replace("{time}", formatTelehealthClock(item.queuedAtMs, locale))}
                </span>
                <span>
                  {t.expiresAt.replace("{time}", formatTelehealthClock(item.expiresAtMs, locale))}
                </span>
              </div>
            </div>
            <button
              type="button"
              className={styles.primaryButton}
              disabled={acceptingId !== null}
              onClick={() => onAccept(item.sessionId)}
            >
              {isAccepting ? t.accepting : t.accept}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
