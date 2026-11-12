"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Focusable elements inside a container, in tab order. */
export function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.hasAttribute("inert") && el.getAttribute("aria-hidden") !== "true",
  );
}

/**
 * Index of the element that should take focus after Tab or Shift+Tab, so the
 * focus wraps inside the dialog. Returns null when the browser can move on.
 */
export function nextTrapIndex(count: number, currentIndex: number, backwards: boolean): number | null {
  if (count === 0) return null;
  if (backwards && currentIndex <= 0) return count - 1;
  if (!backwards && (currentIndex === -1 || currentIndex >= count - 1)) return 0;
  return null;
}

/**
 * Keeps keyboard focus inside the container while active: moves focus in on
 * open, wraps Tab at both ends and gives focus back to the opener on close.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const container = ref.current;
    if (!container) return;
    const previous = document.activeElement as HTMLElement | null;
    const first = getFocusable(container)[0];
    (first ?? container).focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab" || !container) return;
      const items = getFocusable(container);
      const index = items.indexOf(document.activeElement as HTMLElement);
      const next = nextTrapIndex(items.length, index, event.shiftKey);
      if (next === null) return;
      event.preventDefault();
      items[next]?.focus();
    }

    container.addEventListener("keydown", onKeyDown);
    return () => {
      container.removeEventListener("keydown", onKeyDown);
      previous?.focus?.();
    };
  }, [ref, active]);
}
