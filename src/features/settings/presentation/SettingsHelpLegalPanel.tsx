import type { AppStrings } from "@/shared/i18n/types";

import portalStyles from "@/features/vendor/presentation/portal.module.css";
import styles from "./settings.module.css";

type SettingsHelpLegalPanelProps = {
  strings: AppStrings;
};

export function SettingsHelpLegalPanel({ strings }: SettingsHelpLegalPanelProps) {
  const t = strings.settings;

  return (
    <article className={portalStyles.panel} aria-label={t.helpTitle}>
      <div className={styles.helpLegalGrid}>
        <section aria-labelledby="settings-help-section-title">
          <h2 id="settings-help-section-title" className={styles.panelTitle}>
            {t.helpTitle}
          </h2>
          <p className={styles.helpDescription}>{t.helpDescription}</p>
          <div className={styles.linkRow}>
            <button type="button" className={styles.textLink}>
              {t.contactSupport}
            </button>
            <button type="button" className={styles.textLink}>
              {t.sellerGuide}
            </button>
          </div>
        </section>

        <section aria-labelledby="settings-legal-section-title">
          <h2 id="settings-legal-section-title" className={styles.panelTitle}>
            {t.legalTitle}
          </h2>
          <div className={styles.linkRow}>
            <button type="button" className={styles.textLink}>
              {t.termsOfService}
            </button>
            <button type="button" className={styles.textLink}>
              {t.privacyPolicy}
            </button>
            <button type="button" className={styles.textLink}>
              {t.vendorAgreement}
            </button>
          </div>
        </section>
      </div>
    </article>
  );
}
