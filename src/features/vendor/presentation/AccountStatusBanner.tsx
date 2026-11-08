"use client";

import type { VendorProfile } from "@/features/auth/domain/types";
import type { VendorSessionKind } from "@/features/auth/infrastructure/resolve-vendor-session";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./portal.module.css";

type AccountStatusBannerProps = {
  sessionKind: VendorSessionKind;
  profile: VendorProfile;
};

function formatExpiry(expiresAt: Date | null | undefined, locale: string): string {
  if (!expiresAt) return "—";
  return expiresAt.toLocaleString(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function AccountStatusBanner({
  sessionKind,
  profile,
}: AccountStatusBannerProps) {
  const strings = useStrings();
  const locale = typeof document !== "undefined" ? document.documentElement.lang : "en";

  const isActive = sessionKind === "active";
  const isSuspended = sessionKind === "suspended";
  const isRejected = sessionKind === "rejected";
  const isBanned = sessionKind === "banned";

  let bannerTitle = strings.accountStatus.pendingBannerTitle;
  let bannerMessage = strings.accountStatus.pendingBannerMessage;
  let bannerClass = styles.statusBannerPending;
  let statusLabel = strings.accountStatus.pending;
  let statusClass = styles.statusPending;

  if (isActive) {
    bannerTitle = strings.accountStatus.activeTitle;
    bannerMessage = strings.accountStatus.activeMessage;
    bannerClass = styles.statusBannerActive;
    statusLabel = strings.accountStatus.active;
    statusClass = styles.statusActive;
  } else if (isBanned) {
    bannerTitle = strings.accountStatus.bannedTitle;
    bannerMessage = profile.restrictionReason
      ? `${strings.accountStatus.bannedMessage} ${strings.accountStatus.reason}: ${profile.restrictionReason}`
      : strings.accountStatus.bannedMessage;
    bannerClass = styles.statusBannerSuspended;
    statusLabel = strings.accountStatus.banned;
    statusClass = styles.statusSuspended;
  } else if (isSuspended) {
    const modeLine =
      profile.suspensionMode === "view_only"
        ? strings.accountStatus.suspensionModeViewOnly
        : strings.accountStatus.suspensionModeHidden;
    bannerTitle = strings.accountStatus.suspended;
    bannerMessage = [
      strings.accountStatus.suspendedProductsMessage,
      `${strings.accountStatus.suspensionModeLabel}: ${modeLine}`,
      profile.restrictionReason
        ? `${strings.accountStatus.reason}: ${profile.restrictionReason}`
        : null,
      !profile.isPermanentRestriction && profile.restrictionExpiresAt
        ? formatExpiry(profile.restrictionExpiresAt, locale)
        : null,
    ]
      .filter(Boolean)
      .join(" ");
    bannerClass = styles.statusBannerSuspended;
    statusLabel = strings.accountStatus.suspended;
    statusClass = styles.statusSuspended;
  } else if (isRejected) {
    bannerTitle = strings.accountStatus.rejectedTitle;
    bannerMessage = profile.rejectionReason
      ? `${strings.accountStatus.rejectedMessage} ${strings.accountStatus.reason}: ${profile.rejectionReason}`
      : strings.accountStatus.rejectedNoReason;
    bannerClass = styles.statusBannerSuspended;
    statusLabel = strings.accountStatus.rejected;
    statusClass = styles.statusSuspended;
  }

  return (
    <div className={`${styles.statusBanner} ${bannerClass}`} role="status">
      <div className={styles.statusBannerBody}>
        <strong>{bannerTitle}</strong>
        <p>{bannerMessage}</p>
        <div className={styles.statusChipRow}>
          <span className={styles.statusChipLabel}>{strings.accountStatus.status}</span>
          <span className={`${styles.statusChipValue} ${statusClass}`}>
            {statusLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
