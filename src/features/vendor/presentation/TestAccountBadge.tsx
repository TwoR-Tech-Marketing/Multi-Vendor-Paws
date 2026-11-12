"use client";

import { useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./testAccountBadge.module.css";

type TestAccountBadgeProps = {
  isTest: boolean;
};

/** Small header badge shown only for test accounts. */
export function TestAccountBadge({ isTest }: TestAccountBadgeProps) {
  const strings = useStrings();

  if (!isTest) return null;

  return (
    <span className={styles.badge} data-testid="test-account-badge">
      {strings.portal.testAccountBadge}
    </span>
  );
}
