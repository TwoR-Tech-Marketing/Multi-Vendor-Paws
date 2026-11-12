"use client";

import { useEffect, useId, useRef } from "react";

import { useFocusTrap } from "@/components/ui/dialog/useFocusTrap";
import { usePresence } from "@/components/ui/dialog/usePresence";
import { IconClose } from "@/features/vendor/presentation/PortalNavIcons";

import styles from "./LogoutConfirmDialog.module.css";

type LogoutConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  /** Accessible name of the close icon. Defaults to the cancel label. */
  closeLabel?: string;
  isConfirming?: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
};

export function LogoutConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  closeLabel,
  isConfirming = false,
  onCancel,
  onConfirm,
}: LogoutConfirmDialogProps) {
  const titleId = useId();
  const messageId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const { mounted, state, onExited } = usePresence(open);
  useFocusTrap(dialogRef, open && mounted);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!mounted) return null;

  return (
    <div
      className={styles.overlay}
      role="presentation"
      data-state={state}
      onMouseDown={open ? onCancel : undefined}
      onTransitionEnd={(event) => {
        if (event.target === event.currentTarget) onExited();
      }}
    >
      <div
        ref={dialogRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.headerRow}>
          <div className={styles.headerText}>
            <p id={titleId} className={styles.title}>
              {title}
            </p>
            <p id={messageId} className={styles.message}>
              {message}
            </p>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            aria-label={closeLabel ?? cancelLabel}
            onClick={onCancel}
            disabled={isConfirming}
          >
            <IconClose width={20} height={20} />
          </button>
        </div>

        <div className={styles.buttonsRow}>
          <button
            type="button"
            className={styles.btnCancel}
            onClick={onCancel}
            disabled={isConfirming}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={styles.btnDanger}
            onClick={() => void onConfirm()}
            disabled={isConfirming}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Generic name for the same confirm dialog, for confirmations other than sign out. */
export { LogoutConfirmDialog as ConfirmDialog };
