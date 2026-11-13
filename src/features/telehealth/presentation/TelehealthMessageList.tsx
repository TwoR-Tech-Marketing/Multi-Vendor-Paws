import Image from "next/image";
import type { Ref } from "react";

import { EmptyState } from "@/components/ui/empty-state/EmptyState";
import {
  TELEHEALTH_PHOTO_THUMB_PX,
  type TelehealthMessage,
} from "@/features/telehealth/domain/types";
import { formatTelehealthClock } from "@/features/telehealth/presentation/telehealth-copy";
import type { AppStrings } from "@/shared/i18n/types";

import styles from "./telehealth.module.css";

type TelehealthMessageListProps = {
  messages: TelehealthMessage[];
  strings: AppStrings;
  locale: string;
  hasOlder: boolean;
  isLoadingOlder: boolean;
  onLoadOlder: () => void;
  scrollRef?: Ref<HTMLDivElement>;
};

/** Chat bubbles: the doctor's own on the inline end side (mirrors in RTL). Pure. */
export function TelehealthMessageList({
  messages,
  strings,
  locale,
  hasOlder,
  isLoadingOlder,
  onLoadOlder,
  scrollRef,
}: TelehealthMessageListProps) {
  const t = strings.telehealth.chat;
  return (
    <div
      ref={scrollRef}
      className={styles.messages}
      role="log"
      aria-live="polite"
      aria-label={strings.pages.telehealth.chatTitle}
    >
      {hasOlder ? (
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.secondaryButton}
            disabled={isLoadingOlder}
            onClick={onLoadOlder}
          >
            {t.loadEarlier}
          </button>
        </div>
      ) : null}
      {messages.length === 0 ? <EmptyState headingLevel={3} title={t.empty} /> : null}
      {messages.map((message) => {
        const own = message.senderRole === "doctor";
        return (
          <div
            key={message.messageId}
            className={`${styles.bubbleRow} ${own ? styles.bubbleRowOwn : ""}`}
          >
            <div className={`${styles.bubble} ${own ? styles.bubbleOwn : ""}`}>
              {message.type === "photo" && message.photoUrl ? (
                <a
                  className={styles.photoLink}
                  href={message.photoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Image
                    className={styles.photo}
                    src={message.photoUrl}
                    alt={t.photoAlt}
                    width={TELEHEALTH_PHOTO_THUMB_PX}
                    height={TELEHEALTH_PHOTO_THUMB_PX}
                    unoptimized
                  />
                </a>
              ) : null}
              {message.text ? <span>{message.text}</span> : null}
              <span className={styles.bubbleMeta}>
                {own ? t.you : t.owner} · {formatTelehealthClock(message.createdAtMs, locale)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
