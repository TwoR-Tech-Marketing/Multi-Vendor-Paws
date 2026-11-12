import styles from "./toast.module.css";

type ToastProps = {
  message: string;
  dismissLabel: string;
  onDismiss: () => void;
  tone?: "error" | "info";
  /**
   * Whether the toast shows. Keep the toast mounted and flip this, so it
   * slides in from the bottom end edge and leaves the same way. Defaults to
   * true for callers that mount it only while it shows.
   */
  open?: boolean;
};

/** Small floating notice. The parent decides when it shows and hides. */
export function Toast({ message, dismissLabel, onDismiss, tone = "error", open = true }: ToastProps) {
  const isError = tone === "error";
  return (
    <>
      <div
        className={`${styles.toast} ${isError ? styles.error : styles.info}`}
        data-state={open ? "open" : "closed"}
        data-tone={tone}
        aria-hidden={open ? undefined : true}
        inert={open ? undefined : true}
      >
        <span className={styles.glyph} aria-hidden />
        <p className={styles.message} aria-hidden>
          {message}
        </p>
        <button type="button" className={styles.dismiss} onClick={onDismiss}>
          {dismissLabel}
        </button>
      </div>
      <p
        className={styles.srOnly}
        role={isError ? "alert" : "status"}
        aria-live={isError ? "assertive" : "polite"}
      >
        {open ? message : ""}
      </p>
    </>
  );
}
