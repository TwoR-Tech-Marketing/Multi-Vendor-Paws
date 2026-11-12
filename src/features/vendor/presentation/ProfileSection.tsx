"use client";

import { useCallback, useEffect, useState } from "react";

import {
  fetchVendorProfileFromApi,
  isProfileHistoryAvailable,
} from "@/features/vendor/application/vendor-profile.api";
import type {
  VendorProfileChangeRequest,
  VendorStoreProfile,
} from "@/features/vendor/domain/types";
import { AccountStatusBanner } from "@/features/vendor/presentation/AccountStatusBanner";
import { ProfileActiveSessionCard } from "@/features/vendor/presentation/ProfileActiveSessionCard";
import { ProfileHistorySection } from "@/features/vendor/presentation/ProfileHistorySection";
import { ProfileStoreForm } from "@/features/vendor/presentation/ProfileStoreForm";
import { RejectedReapplyForm } from "@/features/vendor/presentation/RejectedReapplyForm";
import { VendorDocumentsSection } from "@/features/vendor/presentation/VendorDocumentsSection";
import { usePortalSession } from "@/features/vendor/presentation/PortalSessionContext";
import { ProfileSkeleton } from "@/features/vendor/presentation/ProfileSkeleton";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./profile.module.css";

export function ProfileSection() {
  const strings = useStrings();
  const { profile, sessionKind, refreshStoreBranding } = usePortalSession();
  const [storeProfile, setStoreProfile] = useState<VendorStoreProfile | null>(null);
  const [pendingChange, setPendingChange] =
    useState<VendorProfileChangeRequest | null>(null);
  const [lastRejectedChange, setLastRejectedChange] =
    useState<VendorProfileChangeRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const needsStoreProfile =
    sessionKind === "active" ||
    sessionKind === "pending" ||
    sessionKind === "rejected" ||
    sessionKind === "suspended";

  const loadProfile = useCallback(async () => {
    if (!needsStoreProfile) {
      setIsLoading(false);
      return;
    }

    setLoadError(null);

    try {
      const {
        profile: nextProfile,
        pendingChange: pending,
        lastRejectedChange: rejected,
      } = await fetchVendorProfileFromApi();

      setStoreProfile(nextProfile);
      setPendingChange(pending);
      setLastRejectedChange(rejected);
      await refreshStoreBranding();
    } catch {
      setLoadError(strings.errors.generic);
    } finally {
      setIsLoading(false);
    }
  }, [needsStoreProfile, refreshStoreBranding, strings.errors.generic]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProfile();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadProfile]);

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (sessionKind === "rejected") {
    return (
      <>
        <AccountStatusBanner sessionKind={sessionKind} profile={profile} />
        <RejectedReapplyForm
          profile={profile}
          storedProviderProfile={storeProfile?.providerProfile}
        />
        <VendorDocumentsSection />
        <ProfileActiveSessionCard />
      </>
    );
  }

  if (sessionKind === "banned") {
    return (
      <>
        <AccountStatusBanner sessionKind={sessionKind} profile={profile} />
        <ProfileActiveSessionCard />
      </>
    );
  }

  if (loadError || !storeProfile) {
    return (
      <div className={`${styles.alert} ${styles.alertError}`} role="alert">
        {loadError ?? strings.errors.generic}
      </div>
    );
  }

  const isSuspended = sessionKind === "suspended";
  const canSubmit = sessionKind === "active";

  return (
    <>
      <AccountStatusBanner sessionKind={sessionKind} profile={profile} />

      <ProfileStoreForm
        strings={strings}
        profile={storeProfile}
        pendingChange={pendingChange}
        lastRejectedChange={lastRejectedChange}
        disabled={!canSubmit}
        lockedReason={canSubmit ? null : isSuspended ? "suspended" : "notApproved"}
        onSubmitted={loadProfile}
      />

      {isProfileHistoryAvailable() ? (
        <ProfileHistorySection
          reloadKey={`${pendingChange?.id ?? ""}:${lastRejectedChange?.id ?? ""}`}
        />
      ) : null}

      {!isSuspended ? <VendorDocumentsSection /> : null}

      <ProfileActiveSessionCard />
    </>
  );
}
