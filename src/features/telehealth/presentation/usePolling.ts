"use client";

import { useEffect, useRef } from "react";

import { createPoller, documentVisibility } from "@/features/telehealth/application/poller";

/** Calls the latest `task` every `intervalMs` while enabled and the tab is visible. */
export function usePolling(task: () => Promise<unknown>, intervalMs: number, enabled: boolean) {
  const taskRef = useRef(task);

  useEffect(() => {
    taskRef.current = task;
  }, [task]);

  useEffect(() => {
    if (!enabled) return;
    const poller = createPoller(() => taskRef.current(), intervalMs, documentVisibility);
    poller.start();
    return () => poller.stop();
  }, [enabled, intervalMs]);
}
