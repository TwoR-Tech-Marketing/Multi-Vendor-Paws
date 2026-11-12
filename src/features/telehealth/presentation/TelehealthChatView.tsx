import Link from "next/link";
import type { ReactNode } from "react";

import { Routes } from "@/constants/routes";
import { isSessionOpen, type TelehealthSession } from "@/features/telehealth/domain/types";
import { TelehealthStatusBadge } from "@/features/telehealth/presentation/TelehealthStatusBadge";
import { formatPet } from "@/features/telehealth/presentation/telehealth-copy";
import type { AppStrings } from "@/shared/i18n/types";

import styles from "./telehealth.module.css";

type TelehealthChatViewProps = {
  session: TelehealthSession;
  strings: AppStrings;
  isEnding: boolean;
  messageList: ReactNode;
  composer: ReactNode;
  onEnd: () => void;
};

/**
 * Chat header (buyer, pet, status, end), intake question, messages and the
 * composer. Ended, refund flagged or unknown sessions are read only. Pure.
 */
export function TelehealthChatView({
  session,
  strings,
  isEnding,
  messageList,
  composer,
  onEnd,
}: TelehealthChatViewProps) {
  const t = strings.telehealth;
  const open = isSessionOpen(session.status);
  const pet = formatPet(session.buyer);
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div className={styles.rowMain}>
          <h2 className={styles.panelTitle}>{session.buyer.displayName}</h2>
          <div className={styles.rowMeta}>
            {pet ? <span>{`${t.chat.petLabel}: ${pet}`}</span> : null}
            <TelehealthStatusBadge status={session.status} strings={strings} />
          </div>
        </div>
        <div className={styles.actions}>
          <Link className={styles.secondaryButton} href={Routes.vendor.telehealth}>
            {t.chat.back}
          </Link>
          {open ? (
            <button
              type="button"
              className={styles.dangerButton}
              disabled={isEnding}
              onClick={onEnd}
            >
              {isEnding ? t.chat.ending : t.chat.end}
            </button>
          ) : null}
        </div>
      </div>
      {session.intakeNote ? (
        <div className={styles.intake}>
          <p className={styles.intakeLabel}>{t.chat.intake}</p>
          <p className={styles.rowTitle}>{session.intakeNote}</p>
        </div>
      ) : null}
      {messageList}
      {open ? (
        composer
      ) : (
        <div className={styles.alertInfo} role="status">
          {session.status === "ended" ? t.chat.readOnlyEnded : t.chat.readOnlyClosed}
        </div>
      )}
    </section>
  );
}
