import Link from "next/link";

import { Routes } from "@/constants/routes";
import { SETTINGS_PREVIEW } from "@/features/settings/presentation/settings-preview";
import type { AppStrings } from "@/shared/i18n/types";

import portalStyles from "@/features/vendor/presentation/portal.module.css";
import styles from "./settings.module.css";

type SettingsAccountOverviewPanelProps = {
  strings: AppStrings;
};

export function SettingsAccountOverviewPanel({ strings }: SettingsAccountOverviewPanelProps) {
  const t = strings.settings;

  return (
    <article className={portalStyles.panel} aria-labelledby="settings-account-title">
      <h2 id="settings-account-title" className={styles.panelTitle}>
        {t.accountTitle}
      </h2>

      <dl className={styles.metaList}>
        <div className={styles.metaRow}>
          <dt>{t.storeNameLabel}</dt>
          <dd>{SETTINGS_PREVIEW.storeName}</dd>
        </div>
        <div className={styles.metaRow}>
          <dt>{t.emailLabel}</dt>
          <dd>{SETTINGS_PREVIEW.email}</dd>
        </div>
        <div className={styles.metaRow}>
          <dt>{t.statusLabel}</dt>
          <dd>
            <span className={`${styles.statusValue} ${styles.statusActive}`}>
              {strings.accountStatus.active}
            </span>
          </dd>
        </div>
      </dl>

      <Link href={Routes.vendor.profile} className={styles.panelAction}>
        {t.viewProfile}
      </Link>
    </article>
  );
}
