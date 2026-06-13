"use client";

import { useEffect } from "react";

import { IconClose } from "@/features/vendor/presentation/PortalNavIcons";

import styles from "./LogoutConfirmDialog.module.css";

type LogoutConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
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
  isConfirming = false,
  onCancel,
  onConfirm,
}: LogoutConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      role="presentation"
      onMouseDown={onCancel}
    >
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.headerRow}>
          <div className={styles.headerText}>
            <p className={styles.title}>{title}</p>
            <p className={styles.message}>{message}</p>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            aria-label="Close"
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
