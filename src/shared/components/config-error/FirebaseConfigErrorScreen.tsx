import type { AppStrings } from "@/shared/i18n/types";

import styles from "./FirebaseConfigErrorScreen.module.css";

type FirebaseConfigErrorScreenProps = {
  strings: AppStrings;
  /** Variable names only, never values. Shown only when `showDetails` is true. */
  missingKeys: readonly string[];
  showDetails: boolean;
};

/** Shown instead of the auth and portal screens when the browser Firebase settings are missing. */
export function FirebaseConfigErrorScreen({
  strings,
  missingKeys,
  showDetails,
}: FirebaseConfigErrorScreenProps) {
  const copy = strings.configError;
  const details = showDetails && missingKeys.length > 0;

  return (
    <main className={styles.page}>
      <section className={styles.card} role="alert" aria-labelledby="config-error-title">
        <h1 id="config-error-title" className={styles.title}>
          {details ? copy.devTitle : copy.title}
        </h1>
        <p className={styles.description}>{details ? copy.devDescription : copy.description}</p>
        {details ? (
          <>
            <h2 className={styles.listLabel}>{copy.devMissingLabel}</h2>
            <ul className={styles.list}>
              {missingKeys.map((key) => (
                <li key={key}>
                  <code dir="ltr" className={styles.code}>
                    {key}
                  </code>
                </li>
              ))}
            </ul>
            <p className={styles.hint}>{copy.devDemoHint}</p>
          </>
        ) : null}
      </section>
    </main>
  );
}
