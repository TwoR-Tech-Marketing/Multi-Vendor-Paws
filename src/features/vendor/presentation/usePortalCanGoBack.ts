"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange);
  return () => window.removeEventListener("popstate", onStoreChange);
}

function historyHasPreviousEntry(): boolean {
  return window.history.length > 1;
}

/**
 * True when the browser history stack has a previous entry (including on dashboard).
 */
export function usePortalCanGoBack(): boolean {
  const pathname = usePathname();
  const historyHasBack = useSyncExternalStore(
    subscribe,
    historyHasPreviousEntry,
    () => false,
  );
  return historyHasBack && pathname.startsWith("/");
}
