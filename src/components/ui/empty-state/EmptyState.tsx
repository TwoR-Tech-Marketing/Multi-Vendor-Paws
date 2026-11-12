import type { ReactNode } from "react";

import styles from "./emptyState.module.css";

type EmptyStateProps = {
  title: string;
  /** One line of guidance under the title. */
  description?: string;
  /** Optional call to action, rendered under the text. */
  action?: ReactNode;
  /** Replaces the default theme art, for example a feature glyph. */
  art?: ReactNode;
  /** Heading level of the title. Defaults to h3. */
  headingLevel?: 2 | 3 | 4;
  /** Announce the empty state politely, for lists that empty while open. */
  live?: boolean;
  className?: string;
};

/** Default art: a heart outline with a paw inside, in the theme accent. */
export function EmptyStateArt() {
  return (
    <svg
      className={styles.art}
      viewBox="0 0 96 96"
      aria-hidden="true"
      focusable="false"
      data-testid="empty-state-art"
    >
      <path
        className={styles.artHeart}
        d="M48 82C30 68 12 54 12 36c0-11 8-19 18-19 7 0 13 4 18 10 5-6 11-10 18-10 10 0 18 8 18 19 0 18-18 32-36 46z"
      />
      <g className={styles.artPaw}>
        <ellipse cx="37" cy="42" rx="3.5" ry="4.5" />
        <ellipse cx="44" cy="35" rx="3.5" ry="4.5" />
        <ellipse cx="52" cy="35" rx="3.5" ry="4.5" />
        <ellipse cx="59" cy="42" rx="3.5" ry="4.5" />
        <path d="M48 45c-5 0-10 6.5-10 10.5 0 3.3 2.5 5 5 5 2 0 3-1 5-1s3 1 5 1c2.5 0 5-1.7 5-5 0-4-5-10.5-10-10.5z" />
      </g>
    </svg>
  );
}

/** One title, one line of guidance and the theme accent art. */
export function EmptyState({
  title,
  description,
  action,
  art,
  headingLevel = 3,
  live = false,
  className,
}: EmptyStateProps) {
  const Heading = `h${headingLevel}` as const;
  return (
    <div
      className={[styles.emptyState, className].filter(Boolean).join(" ")}
      role={live ? "status" : undefined}
      aria-live={live ? "polite" : undefined}
    >
      {art ?? <EmptyStateArt />}
      <Heading className={styles.title}>{title}</Heading>
      {description ? <p className={styles.description}>{description}</p> : null}
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
