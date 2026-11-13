import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state/EmptyState";
import { Routes } from "@/constants/routes";
import type { TelehealthSession } from "@/features/telehealth/domain/types";
import { TelehealthStatusBadge } from "@/features/telehealth/presentation/TelehealthStatusBadge";
import {
  formatPet,
  formatPreview,
  formatTelehealthTime,
} from "@/features/telehealth/presentation/telehealth-copy";
import type { AppStrings } from "@/shared/i18n/types";

import styles from "./telehealth.module.css";

type TelehealthSessionListProps = {
  sessions: TelehealthSession[];
  emptyText: string;
  strings: AppStrings;
  locale: string;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
};

/** My active or ended consultations, newest activity first. Pure. */
export function TelehealthSessionList({
  sessions,
  emptyText,
  strings,
  locale,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: TelehealthSessionListProps) {
  const t = strings.telehealth;
  if (sessions.length === 0) return <EmptyState headingLevel={3} live title={emptyText} />;
  return (
    <>
      <ul className={styles.list}>
        {sessions.map((session) => {
          const pet = formatPet(session.buyer);
          const who = pet ? `${session.buyer.displayName} · ${pet}` : session.buyer.displayName;
          const when = session.endedAtMs
            ? t.endedAt.replace("{time}", formatTelehealthTime(session.endedAtMs, locale))
            : session.lastMessageAtMs
              ? t.lastMessageAt.replace(
                  "{time}",
                  formatTelehealthTime(session.lastMessageAtMs, locale),
                )
              : "";
          return (
            <li key={session.sessionId} className={styles.row}>
              <div className={styles.rowMain}>
                <p className={styles.rowTitle} title={who}>
                  {who}
                </p>
                <p className={styles.rowText}>{formatPreview(session, strings)}</p>
                <div className={styles.rowMeta}>
                  <TelehealthStatusBadge status={session.status} strings={strings} />
                  {when ? <span>{when}</span> : null}
                </div>
              </div>
              <Link
                className={styles.secondaryButton}
                href={Routes.vendor.telehealthChat(session.sessionId)}
                aria-label={`${t.openChat} ${session.buyer.displayName}`}
              >
                {t.openChat}
              </Link>
            </li>
          );
        })}
      </ul>
      {hasMore ? (
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.secondaryButton}
            disabled={isLoadingMore}
            onClick={onLoadMore}
          >
            {t.loadMore}
          </button>
        </div>
      ) : null}
    </>
  );
}
