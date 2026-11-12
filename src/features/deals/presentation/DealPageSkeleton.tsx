"use client";

import { DealSkeleton } from "@/features/deals/presentation/DealSkeleton";
import { useStrings } from "@/shared/preferences/PreferencesContext";

/** Route level skeleton with a localized accessible label. */
export function DealPageSkeleton() {
  const strings = useStrings();
  return <DealSkeleton label={strings.common.loading} />;
}
