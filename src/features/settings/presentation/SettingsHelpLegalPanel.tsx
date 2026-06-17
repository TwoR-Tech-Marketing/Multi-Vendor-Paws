import type { ReactNode } from "react";

import { VendorPortalLinks } from "@/constants/vendor-portal-links";
import type { AppStrings } from "@/shared/i18n/types";

import portalStyles from "@/features/vendor/presentation/portal.module.css";
import styles from "./settings.module.css";

type SettingsHelpLegalPanelProps = {
  strings: AppStrings;
};

function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className={styles.textLink}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}

export function SettingsHelpLegalPanel({ strings }: SettingsHelpLegalPanelProps) {
  const t = strings.settings;
  const supportMailto = `mailto:${VendorPortalLinks.supportEmail}`;

  return (
    <article className={portalStyles.panel} aria-label={t.helpTitle}>
      <div className={styles.helpLegalGrid}>
        <section aria-labelledby="settings-help-section-title">
          <h2 id="settings-help-section-title" className={styles.panelTitle}>
            {t.helpTitle}
          </h2>
          <p className={styles.helpDescription}>{t.helpDescription}</p>
          <div className={styles.linkRow}>
            <a href={supportMailto} className={styles.textLink}>
              {t.contactSupport}
            </a>
            {VendorPortalLinks.sellerGuideUrl ? (
              <ExternalLink href={VendorPortalLinks.sellerGuideUrl}>
                {t.sellerGuide}
              </ExternalLink>
            ) : null}
          </div>
        </section>

        <section aria-labelledby="settings-legal-section-title">
          <h2 id="settings-legal-section-title" className={styles.panelTitle}>
            {t.legalTitle}
          </h2>
          <div className={styles.linkRow}>
            {VendorPortalLinks.termsUrl ? (
              <ExternalLink href={VendorPortalLinks.termsUrl}>
                {t.termsOfService}
              </ExternalLink>
            ) : null}
            {VendorPortalLinks.privacyUrl ? (
              <ExternalLink href={VendorPortalLinks.privacyUrl}>
                {t.privacyPolicy}
              </ExternalLink>
            ) : null}
            {VendorPortalLinks.vendorAgreementUrl ? (
              <ExternalLink href={VendorPortalLinks.vendorAgreementUrl}>
                {t.vendorAgreement}
              </ExternalLink>
            ) : null}
            {!VendorPortalLinks.termsUrl &&
            !VendorPortalLinks.privacyUrl &&
            !VendorPortalLinks.vendorAgreementUrl ? (
              <p className={styles.legalPlaceholder}>{t.legalPlaceholder}</p>
            ) : null}
          </div>
        </section>
      </div>
    </article>
  );
}
