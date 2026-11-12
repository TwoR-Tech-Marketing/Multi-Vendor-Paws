import type { FormEvent } from "react";

import { TELEHEALTH_LIMITS, TELEHEALTH_PHOTO_TYPES } from "@/features/telehealth/domain/types";
import type { AppStrings } from "@/shared/i18n/types";

import styles from "./telehealth.module.css";

type TelehealthComposerProps = {
  draft: string;
  strings: AppStrings;
  isSending: boolean;
  isUploading: boolean;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onPhoto: (file: File) => void;
};

/** Text box, photo picker and send button. Pure. */
export function TelehealthComposer({
  draft,
  strings,
  isSending,
  isUploading,
  onDraftChange,
  onSend,
  onPhoto,
}: TelehealthComposerProps) {
  const t = strings.telehealth.chat;
  const busy = isSending || isUploading;
  const text = draft.trim();
  const tooLong = text.length > TELEHEALTH_LIMITS.textMax;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!busy && text && !tooLong) onSend();
  }

  return (
    <form className={styles.chat} onSubmit={submit}>
      {tooLong ? (
        <p className={styles.alertError} role="alert">
          {t.textTooLong}
        </p>
      ) : null}
      <div className={styles.composer}>
        <label className={styles.fileLabel} aria-disabled={busy}>
          {isUploading ? t.uploadingPhoto : t.attachPhoto}
          <input
            className={styles.visuallyHidden}
            type="file"
            accept={TELEHEALTH_PHOTO_TYPES.join(",")}
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) onPhoto(file);
            }}
          />
        </label>
        <textarea
          className={styles.composerInput}
          aria-label={t.inputLabel}
          placeholder={t.placeholder}
          value={draft}
          rows={2}
          disabled={isSending}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              submit(event);
            }
          }}
        />
        <button
          type="submit"
          className={styles.primaryButton}
          disabled={busy || !text || tooLong}
        >
          {isSending ? t.sending : t.send}
        </button>
      </div>
    </form>
  );
}
