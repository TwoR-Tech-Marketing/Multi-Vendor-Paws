"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchVendorProfileFromApi } from "@/features/vendor/application/vendor-profile.api";
import type {
  VendorProfileChangeRequest,
  VendorStoreProfile,
} from "@/features/vendor/domain/types";
import { AccountStatusBanner } from "@/features/vendor/presentation/AccountStatusBanner";
import { ProfileActiveSessionCard } from "@/features/vendor/presentation/ProfileActiveSessionCard";
import { ProfileStoreForm } from "@/features/vendor/presentation/ProfileStoreForm";
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

  const loadProfile = useCallback(async () => {
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
  }, [refreshStoreBranding, strings.errors.generic]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (loadError || !storeProfile) {
    return (
      <div className={`${styles.alert} ${styles.alertError}`} role="alert">
        {loadError ?? strings.errors.generic}
      </div>
    );
  }

  const isSuspended = sessionKind === "suspended";

  return (
    <>
      <AccountStatusBanner sessionKind={sessionKind} profile={profile} />

      <ProfileStoreForm
        strings={strings}
        profile={storeProfile}
        pendingChange={pendingChange}
        lastRejectedChange={lastRejectedChange}
        disabled={isSuspended}
        onSubmitted={loadProfile}
      />

      <ProfileActiveSessionCard />
    </>
  );
}
