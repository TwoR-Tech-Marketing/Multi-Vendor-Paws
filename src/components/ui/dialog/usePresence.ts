"use client";

import { useEffect, useState } from "react";

/** Longest exit duration of any theme, plus a margin, when no transitionend fires. */
export const EXIT_FALLBACK_MS = 260;

/**
 * Keeps a closing layer mounted until its exit transition ends, so it can
 * leave the same way it came. Returns whether to render and the data-state.
 */
export function usePresence(open: boolean) {
  const [mounted, setMounted] = useState(open);

  if (open && !mounted) setMounted(true);

  useEffect(() => {
    if (open || !mounted) return;
    const timer = window.setTimeout(() => setMounted(false), EXIT_FALLBACK_MS);
    return () => window.clearTimeout(timer);
  }, [open, mounted]);

  return {
    mounted: open || mounted,
    state: open ? ("open" as const) : ("closed" as const),
    onExited: () => {
      if (!open) setMounted(false);
    },
  };
}
