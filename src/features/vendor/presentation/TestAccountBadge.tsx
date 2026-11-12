"use client";

import { StatusBadge } from "@/components/ui/badge/StatusBadge";
import { useStrings } from "@/shared/preferences/PreferencesContext";

type TestAccountBadgeProps = {
  isTest: boolean;
};

/** Small header badge shown only for test accounts. */
export function TestAccountBadge({ isTest }: TestAccountBadgeProps) {
  const strings = useStrings();

  if (!isTest) return null;

  return (
    <StatusBadge
      tone="warning"
      label={strings.portal.testAccountBadge}
      testId="test-account-badge"
    />
  );
}
