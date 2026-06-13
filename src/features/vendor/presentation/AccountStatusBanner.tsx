"use client";

import { Strings } from "@/constants/strings";
import type { VendorProfile } from "@/features/auth/domain/types";
import type { VendorSessionKind } from "@/features/auth/infrastructure/resolve-vendor-session";

import styles from "./portal.module.css";

type AccountStatusBannerProps = {
  sessionKind: VendorSessionKind;
  profile: VendorProfile;
};

function formatExpiry(expiresAt: Date | null | undefined): string {
  if (!expiresAt) return "—";
  return expiresAt.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function AccountStatusBanner({
  sessionKind,
  profile,
}: AccountStatusBannerProps) {
  const isActive = sessionKind === "active";
  const isSuspended = sessionKind === "suspended";
  const status = profile.status ?? Strings.accountStatus.pending;

  const bannerTitle = isActive
    ? Strings.accountStatus.activeTitle
    : isSuspended
      ? Strings.accountStatus.suspended
      : Strings.accountStatus.pendingBannerTitle;

  const bannerMessage = isActive
    ? Strings.accountStatus.activeMessage
    : isSuspended && profile.restrictionReason
      ? `This account is suspended for ${profile.restrictionReason}${
          !profile.isPermanentRestriction && profile.restrictionExpiresAt
            ? ` until ${formatExpiry(profile.restrictionExpiresAt)}`
            : ""
        }.`
      : isSuspended
        ? Strings.accountStatus.suspendedProductsMessage
        : Strings.accountStatus.pendingBannerMessage;

  const bannerClass = isActive
    ? styles.statusBannerActive
    : isSuspended
      ? styles.statusBannerSuspended
      : styles.statusBannerPending;

  const statusLabel = isSuspended
    ? Strings.accountStatus.suspended
    : isActive
      ? Strings.accountStatus.active
      : status;

  const statusClass = isSuspended
    ? styles.statusSuspended
    : isActive
      ? styles.statusActive
      : styles.statusPending;

  return (
    <div className={`${styles.statusBanner} ${bannerClass}`} role="status">
      <div className={styles.statusBannerBody}>
        <strong>{bannerTitle}</strong>
        <p>{bannerMessage}</p>
        <div className={styles.statusChipRow}>
          <span className={styles.statusChipLabel}>{Strings.accountStatus.status}</span>
          <span className={`${styles.statusChipValue} ${statusClass}`}>
            {statusLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
