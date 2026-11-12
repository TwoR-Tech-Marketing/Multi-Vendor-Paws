"use client";

import Link from "next/link";

import { Routes } from "@/constants/routes";
import { isScreenVisible } from "@/features/vendor/domain/vendor-type-config";
import { usePortalSession } from "@/features/vendor/presentation/PortalSessionContext";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./branches.module.css";

/** Onboarding hint for pending and rejected clinics and groomers. */
export function PendingBranchesHint({ showLink = false }: { showLink?: boolean }) {
  const strings = useStrings();
  const { profile, sessionKind } = usePortalSession();
  const applying = sessionKind === "pending" || sessionKind === "rejected";
  if (!applying || !isScreenVisible(profile.vendorType, "branches")) return null;

  return (
    <div className={styles.hint} role="status">
      <span>{strings.branches.pendingHint}</span>
      {showLink ? <Link href={Routes.vendor.branches}>{strings.nav.branches}</Link> : null}
    </div>
  );
}
