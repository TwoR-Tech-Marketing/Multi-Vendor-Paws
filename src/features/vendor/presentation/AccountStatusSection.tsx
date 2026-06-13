"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Routes } from "@/constants/routes";
import { Strings } from "@/constants/strings";
import { usePortalSession } from "@/features/vendor/presentation/PortalSessionContext";

import styles from "./portal.module.css";

function formatExpiry(expiresAt: Date | null | undefined): string {
  if (!expiresAt) return "—";
  return expiresAt.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function AccountStatusSection() {
  const router = useRouter();
  const { user, profile, sessionKind } = usePortalSession();

  const isSuspended = sessionKind === "suspended";
  const status = profile.status ?? "pending";

  useEffect(() => {
    if (sessionKind === "active") {
      router.replace(Routes.vendor.dashboard);
    }
  }, [sessionKind, router]);

  if (sessionKind === "active") {
    return null;
  }

  return (
    <>
      <div
        className={`${styles.statusBanner} ${
          isSuspended ? styles.statusBannerSuspended : styles.statusBannerPending
        }`}
        role="status"
      >
        <div>
          <strong>
            {isSuspended
              ? Strings.accountStatus.suspended
              : Strings.accountStatus.pendingMessage}
          </strong>
          <p>
            {isSuspended && profile.restrictionReason
              ? `This account is suspended for ${profile.restrictionReason}${
                  !profile.isPermanentRestriction && profile.restrictionExpiresAt
                    ? ` until ${formatExpiry(profile.restrictionExpiresAt)}`
                    : ""
                }.`
              : Strings.accountStatus.pendingMessage}
          </p>
        </div>
      </div>

      <div className={styles.panel}>
        <h3>{Strings.accountStatus.title}</h3>
        <div className={styles.reviewGrid}>
          <div className={styles.reviewRow}>
            <span>{Strings.accountStatus.store}</span>
            <strong>{profile.storeName}</strong>
          </div>
          <div className={styles.reviewRow}>
            <span>{Strings.accountStatus.email}</span>
            <strong>{profile.email || user.email}</strong>
          </div>
          <div className={styles.reviewRow}>
            <span>{Strings.accountStatus.status}</span>
            <strong
              className={
                isSuspended ? styles.statusSuspended : styles.statusPending
              }
            >
              {isSuspended ? Strings.accountStatus.suspended : status}
            </strong>
          </div>
          {isSuspended ? (
            <>
              <div className={styles.reviewRow}>
                <span>{Strings.accountStatus.reason}</span>
                <strong>{profile.restrictionReason ?? "—"}</strong>
              </div>
              <div className={styles.reviewRow}>
                <span>{Strings.accountStatus.accessRestored}</span>
                <strong>
                  {profile.isPermanentRestriction
                    ? Strings.accountStatus.contactSupport
                    : formatExpiry(profile.restrictionExpiresAt)}
                </strong>
              </div>
            </>
          ) : null}
        </div>

        <p className={styles.hint}>
          {isSuspended
            ? Strings.accountStatus.suspendedProductsMessage
            : Strings.accountStatus.pendingProductsMessage}
        </p>
      </div>
    </>
  );
}
