import styles from "./errorState.module.css";

export type ErrorStateKind = "error" | "offline";

type ErrorStateProps = {
  /** "offline" shows the connection art; "error" the alert art. */
  kind?: ErrorStateKind;
  title: string;
  /** One friendly sentence; never a raw error message. */
  description?: string;
  /** Retry button label. The button shows only with onRetry. */
  retryLabel?: string;
  onRetry?: () => void;
  /** Disables the retry button while a retry is running. */
  isRetrying?: boolean;
  retryingLabel?: string;
  /** Heading level of the title. Defaults to h3. */
  headingLevel?: 2 | 3 | 4;
  /** Inline variant for a failed card inside a loaded page. */
  compact?: boolean;
  className?: string;
};

function AlertArt() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" data-testid="error-state-art">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5" />
      <path d="M12 16.25v.01" />
    </svg>
  );
}

function OfflineArt() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" data-testid="offline-state-art">
      <path d="M2 8.8a15 15 0 0 1 4.2-2.6" />
      <path d="M10.7 5.1A15 15 0 0 1 22 8.8" />
      <path d="M5 12.6a10 10 0 0 1 5.2-2.6" />
      <path d="M16.9 10.7A10 10 0 0 1 19 12.6" />
      <path d="M8.5 16.3a5 5 0 0 1 7 0" />
      <path d="M12 20h.01" />
      <path d="M3 3l18 18" />
    </svg>
  );
}

/**
 * Friendly error or offline state with an optional retry. Announced as an
 * alert so screen readers hear it when a load fails.
 */
export function ErrorState({
  kind = "error",
  title,
  description,
  retryLabel,
  onRetry,
  isRetrying = false,
  retryingLabel,
  headingLevel = 3,
  compact = false,
  className,
}: ErrorStateProps) {
  const Heading = `h${headingLevel}` as const;
  const rootClass = [styles.errorState, compact ? styles.compact : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass} role="alert" data-kind={kind}>
      <span className={styles.art}>{kind === "offline" ? <OfflineArt /> : <AlertArt />}</span>
      <div className={styles.text}>
        <Heading className={styles.title}>{title}</Heading>
        {description ? <p className={styles.description}>{description}</p> : null}
      </div>
      {onRetry && retryLabel ? (
        <button
          type="button"
          className={styles.retry}
          onClick={onRetry}
          disabled={isRetrying}
          aria-busy={isRetrying || undefined}
        >
          {isRetrying && retryingLabel ? retryingLabel : retryLabel}
        </button>
      ) : null}
    </div>
  );
}
