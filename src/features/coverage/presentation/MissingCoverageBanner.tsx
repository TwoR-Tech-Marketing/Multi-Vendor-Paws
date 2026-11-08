"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { fetchMyDeliveryCoverage } from "@/features/coverage/application/coverage.api";
import { Routes } from "@/constants/routes";
import { usePortalSession } from "@/features/vendor/presentation/PortalSessionContext";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./coverage.module.css";

export function MissingCoverageBanner() {
  const strings = useStrings();
  const { sessionKind } = usePortalSession();
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (sessionKind !== "active") {
        setMissing(false);
        return;
      }
      void (async () => {
        try {
          const result = await fetchMyDeliveryCoverage();
          if (result.vendorType && result.vendorType !== "store") {
            setMissing(false);
            return;
          }
          setMissing(!result.deliveryCoverage?.mode);
        } catch {
          setMissing(false);
        }
      })();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [sessionKind]);

  if (!missing) return null;

  return (
    <div className={styles.banner} role="status">
      <strong>{strings.coverage.missingBannerTitle}</strong>
      <p>{strings.coverage.missingBannerMessage}</p>
      <Link href={Routes.vendor.coverage}>{strings.coverage.missingBannerCta}</Link>
    </div>
  );
}
