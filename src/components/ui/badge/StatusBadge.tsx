import styles from "./statusBadge.module.css";

export const STATUS_TONES = [
  "success",
  "warning",
  "danger",
  "info",
  "hold",
  "cancelled",
  "confirmed",
  "neutral",
] as const;

export type StatusTone = (typeof STATUS_TONES)[number];

type StatusBadgeProps = {
  tone: StatusTone;
  label: string;
  className?: string;
  /** Raw status value, kept on the element for styling hooks and tests. */
  status?: string;
  testId?: string;
};

/** Status label with a tone colour and a tone shape (dot, pause glyph or hollow dot). */
export function StatusBadge({ tone, label, className, status, testId }: StatusBadgeProps) {
  const classes = [styles.badge, styles[tone], className].filter(Boolean).join(" ");
  return (
    <span className={classes} data-tone={tone} data-status={status} data-testid={testId}>
      {label}
    </span>
  );
}
