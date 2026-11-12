/**
 * Runs `task` every `intervalMs` while the page is visible. Hidden pages pause
 * the timer; becoming visible runs the task at once and resumes. Runs never
 * overlap: the next one is scheduled after the current one settles.
 */

export type VisibilitySource = {
  isHidden: () => boolean;
  subscribe: (listener: () => void) => () => void;
};

export type Poller = { start: () => void; stop: () => void };

export function createPoller(
  task: () => Promise<unknown> | unknown,
  intervalMs: number,
  visibility: VisibilitySource,
): Poller {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let running = false;
  let stopped = true;
  let unsubscribe: (() => void) | null = null;

  function clear() {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  }

  function schedule() {
    clear();
    if (!stopped && !visibility.isHidden()) timer = setTimeout(run, intervalMs);
  }

  async function run() {
    timer = null;
    if (stopped || running || visibility.isHidden()) return;
    running = true;
    try {
      await task();
    } catch {
      // The task reports its own errors; polling keeps going.
    } finally {
      running = false;
      schedule();
    }
  }

  function onVisibility() {
    if (visibility.isHidden()) clear();
    else void run();
  }

  return {
    start() {
      if (!stopped) return;
      stopped = false;
      unsubscribe = visibility.subscribe(onVisibility);
      schedule();
    },
    stop() {
      stopped = true;
      clear();
      unsubscribe?.();
      unsubscribe = null;
    },
  };
}

/** The browser document as a visibility source. */
export const documentVisibility: VisibilitySource = {
  isHidden: () => typeof document !== "undefined" && document.hidden,
  subscribe: (listener) => {
    if (typeof document === "undefined") return () => {};
    document.addEventListener("visibilitychange", listener);
    return () => document.removeEventListener("visibilitychange", listener);
  },
};
