import { EmptyState } from "@/components/ui/empty-state/EmptyState";
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
  if (items.length === 0) {
    return (
      <EmptyState headingLevel={3} live title={t.queueEmptyTitle} description={t.queueEmpty} />
    );
  }
  return (
    <ul className={styles.list}>
      {items.map((item) => {
        const pet = formatPet(item.buyer);
        const who = pet ? `${item.buyer.displayName} · ${pet}` : item.buyer.displayName;
        const isAccepting = acceptingId === item.sessionId;
        return (
          <li key={item.sessionId} className={styles.row}>
            <div className={styles.rowMain}>
              <p className={styles.rowTitle} title={who}>
                {who}
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
              aria-label={`${isAccepting ? t.accepting : t.accept} ${item.buyer.displayName}`}
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
