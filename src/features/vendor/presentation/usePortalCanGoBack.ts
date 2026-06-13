"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

/**
 * True when the browser history stack has a previous entry (including on dashboard).
 */
export function usePortalCanGoBack(): boolean {
  const pathname = usePathname();
  const [canGoBack, setCanGoBack] = useState(false);

  const sync = useCallback(() => {
    setCanGoBack(window.history.length > 1);
  }, []);

  useEffect(() => {
    sync();
  }, [pathname, sync]);

  useEffect(() => {
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [sync]);

  return canGoBack;
}
