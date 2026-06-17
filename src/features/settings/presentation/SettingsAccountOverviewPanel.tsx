import Link from "next/link";

import { Routes } from "@/constants/routes";
import type { VendorSessionKind } from "@/features/auth/infrastructure/resolve-vendor-session";
import type { VendorAccountStatus } from "@/features/auth/domain/types";
import type { AppStrings } from "@/shared/i18n/types";

import portalStyles from "@/features/vendor/presentation/portal.module.css";
import styles from "./settings.module.css";

type SettingsAccountOverviewPanelProps = {
  strings: AppStrings;
  storeName: string;
  email: string;
  sessionKind: VendorSessionKind;
  status: VendorAccountStatus;
};

function resolveStatusPresentation(
  strings: AppStrings,
  sessionKind: VendorSessionKind,
  status: VendorAccountStatus,
): { label: string; className: string } {
  if (sessionKind === "suspended") {
    return {
      label: strings.accountStatus.suspended,
      className: styles.statusSuspended,
    };
  }
  if (sessionKind === "active") {
    return {
      label: strings.accountStatus.active,
      className: styles.statusActive,
    };
  }
  if (status === "suspended") {
    return {
      label: strings.accountStatus.suspended,
      className: styles.statusSuspended,
    };
  }
  return {
    label: strings.accountStatus.pending,
    className: styles.statusPending,
  };
}

export function SettingsAccountOverviewPanel({
  strings,
  storeName,
  email,
  sessionKind,
  status,
}: SettingsAccountOverviewPanelProps) {
  const t = strings.settings;
  const statusPresentation = resolveStatusPresentation(strings, sessionKind, status);

  return (
    <article className={portalStyles.panel} aria-labelledby="settings-account-title">
      <h2 id="settings-account-title" className={styles.panelTitle}>
        {t.accountTitle}
      </h2>

      <dl className={styles.metaList}>
        <div className={styles.metaRow}>
          <dt>{t.storeNameLabel}</dt>
          <dd>{storeName}</dd>
        </div>
        <div className={styles.metaRow}>
          <dt>{t.emailLabel}</dt>
          <dd>{email}</dd>
        </div>
        <div className={styles.metaRow}>
          <dt>{t.statusLabel}</dt>
          <dd>
            <span className={`${styles.statusValue} ${statusPresentation.className}`}>
              {statusPresentation.label}
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
