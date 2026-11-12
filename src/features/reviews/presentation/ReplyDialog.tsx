"use client";

import { useEffect, useId, useRef, useState } from "react";

import { isValidReplyText } from "@/features/reviews/domain/schemas";
import { REVIEW_LIMITS } from "@/features/reviews/domain/types";
import type { AppStrings } from "@/shared/i18n/types";

import branchStyles from "@/features/branches/presentation/branches.module.css";
import styles from "./reviews.module.css";

type ReplyDialogProps = {
  strings: AppStrings;
  isSubmitting: boolean;
  error: string | null;
  onConfirm: (text: string) => void;
  onClose: () => void;
};

/** One time reply, 1 to 500 characters, with a notice that it can't be changed. */
export function ReplyDialog({ strings, isSubmitting, error, onConfirm, onClose }: ReplyDialogProps) {
  const t = strings.reviews.reply;
  const id = useId();
  const [text, setText] = useState("");
  const [touched, setTouched] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const valid = isValidReplyText(text);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    textareaRef.current?.focus();
    return () => previous?.focus?.();
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, isSubmitting]);

  return (
    <div className={branchStyles.overlay} role="presentation">
      <div className={branchStyles.modal} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`}>
        <h2 id={`${id}-title`} className={branchStyles.panelTitle}>
          {t.title}
        </h2>
        <p className={styles.notice}>{t.once}</p>
        <div className={branchStyles.field}>
          <label className={branchStyles.label} htmlFor={id}>
            {t.yourReply}
          </label>
          <textarea
            id={id}
            ref={textareaRef}
            className={styles.textarea}
            value={text}
            placeholder={t.placeholder}
            maxLength={REVIEW_LIMITS.replyMax}
            aria-describedby={`${id}-hint`}
            aria-invalid={touched && !valid}
            onChange={(event) => {
              setTouched(true);
              setText(event.target.value);
            }}
          />
          <p id={`${id}-hint`} className={touched && !valid ? branchStyles.fieldError : branchStyles.muted}>
            {touched && !valid
              ? t.invalid
              : t.counter
                  .replace("{count}", String(text.length))
                  .replace("{max}", String(REVIEW_LIMITS.replyMax))}
          </p>
        </div>
        {error ? (
          <div className={branchStyles.alertError} role="alert">
            {error}
          </div>
        ) : null}
        <div className={branchStyles.actions}>
          <button
            type="button"
            className={branchStyles.primaryButton}
            disabled={!valid || isSubmitting}
            onClick={() => onConfirm(text)}
          >
            {isSubmitting ? t.submitting : t.submit}
          </button>
          <button
            type="button"
            className={branchStyles.secondaryButton}
            disabled={isSubmitting}
            onClick={onClose}
          >
            {t.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
