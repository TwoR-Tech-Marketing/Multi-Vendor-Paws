import styles from "./toast.module.css";

type ToastProps = {
  message: string;
  dismissLabel: string;
  onDismiss: () => void;
  tone?: "error" | "info";
};

/** Small floating notice. The parent decides when it shows and hides. */
export function Toast({ message, dismissLabel, onDismiss, tone = "error" }: ToastProps) {
  return (
    <div
      className={`${styles.toast} ${tone === "error" ? styles.error : styles.info}`}
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
    >
      <p className={styles.message}>{message}</p>
      <button type="button" className={styles.dismiss} onClick={onDismiss}>
        {dismissLabel}
      </button>
    </div>
  );
}
