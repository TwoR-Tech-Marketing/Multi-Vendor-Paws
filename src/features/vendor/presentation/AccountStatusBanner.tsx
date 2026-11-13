"use client";

import { StatusBadge, type StatusTone } from "@/components/ui/badge/StatusBadge";
import type { VendorProfile } from "@/features/auth/domain/types";
import type { VendorSessionKind } from "@/features/auth/infrastructure/resolve-vendor-session";
import type { AppStrings } from "@/shared/i18n/types";
import { formatDateTime } from "@/shared/lib/format-date";
import type { AppLocale } from "@/shared/preferences/domain/types";
import { usePreferences, useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./portal.module.css";

type AccountStatusBannerProps = {
  sessionKind: VendorSessionKind;
  profile: VendorProfile;
};

type BannerDetail = { label: string; value: string };

type BannerView = {
  title: string;
  message: string;
  details: BannerDetail[];
  className: string;
  tone: StatusTone;
  statusLabel: string;
};

/** Maps the session kind to the banner copy, tone and detail lines. */
export function resolveAccountStatusBanner(
  strings: AppStrings,
  sessionKind: VendorSessionKind,
  profile: VendorProfile,
  locale: AppLocale,
): BannerView {
  const t = strings.accountStatus;
  const reason = (value: string | null | undefined): BannerDetail[] =>
    value ? [{ label: t.reason, value }] : [];

  if (sessionKind === "active") {
    return {
      title: t.activeTitle,
      message: t.activeMessage,
      details: [],
      className: styles.statusBannerActive,
      tone: "success",
      statusLabel: t.active,
    };
  }
  if (sessionKind === "banned") {
    return {
      title: t.bannedTitle,
      message: t.bannedMessage,
      details: reason(profile.restrictionReason),
      className: styles.statusBannerSuspended,
      tone: "danger",
      statusLabel: t.banned,
    };
  }
  if (sessionKind === "suspended") {
    const expiry =
      !profile.isPermanentRestriction && profile.restrictionExpiresAt
        ? [{ label: t.accessRestored, value: formatDateTime(profile.restrictionExpiresAt, locale) }]
        : [];
    return {
      title: t.suspended,
      message: t.suspendedProductsMessage,
      details: [
        {
          label: t.suspensionModeLabel,
          value:
            profile.suspensionMode === "view_only"
              ? t.suspensionModeViewOnly
              : t.suspensionModeHidden,
        },
        ...reason(profile.restrictionReason),
        ...expiry,
      ],
      className: styles.statusBannerSuspended,
      tone: "hold",
      statusLabel: t.suspended,
    };
  }
  if (sessionKind === "rejected") {
    return {
      title: t.rejectedTitle,
      message: profile.rejectionReason ? t.rejectedMessage : t.rejectedNoReason,
      details: reason(profile.rejectionReason),
      className: styles.statusBannerSuspended,
      tone: "danger",
      statusLabel: t.rejected,
    };
  }
  return {
    title: t.pendingBannerTitle,
    message: t.pendingBannerMessage,
    details: [],
    className: styles.statusBannerPending,
    tone: "warning",
    statusLabel: t.pending,
  };
}

export function AccountStatusBanner({ sessionKind, profile }: AccountStatusBannerProps) {
  const strings = useStrings();
  const { locale } = usePreferences();
  const view = resolveAccountStatusBanner(strings, sessionKind, profile, locale);

  return (
    <section
      className={`${styles.statusBanner} ${view.className}`}
      role="status"
      aria-labelledby="account-status-title"
    >
      <div className={styles.statusBannerBody}>
        <h2 id="account-status-title" className={styles.statusBannerTitle}>
          {view.title}
        </h2>
        <p className={styles.statusBannerText}>{view.message}</p>
        {view.details.map((detail) => (
          <p key={detail.label} className={styles.statusBannerDetail}>
            <span className={styles.statusBannerDetailLabel}>{detail.label}: </span>
            {detail.value}
          </p>
        ))}
      </div>
      <StatusBadge tone={view.tone} label={view.statusLabel} status={sessionKind} />
    </section>
  );
}
