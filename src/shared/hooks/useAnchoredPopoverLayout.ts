"use client";

import type { CSSProperties, RefObject } from "react";
import { useLayoutEffect, useState } from "react";

const GAP_PX = 8;
const VIEW_MARGIN_PX = 12;
const DEFAULT_MAX_WIDTH_PX = 382;

export function useAnchoredPopoverLayout(
  open: boolean,
  anchorRef: RefObject<Element | null>,
  options?: { maxWidthPx?: number; popoverZIndex?: number },
): CSSProperties {
  const maxWidthPx = options?.maxWidthPx ?? DEFAULT_MAX_WIDTH_PX;
  const popoverZIndex = options?.popoverZIndex ?? 11001;

  const [layout, setLayout] = useState<CSSProperties>({});

  useLayoutEffect(() => {
    if (!open) {
      setLayout({});
      return;
    }

    const compute = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const width = Math.min(maxWidthPx, vw - VIEW_MARGIN_PX * 2);
      let left = rect.right - width;
      left = Math.max(VIEW_MARGIN_PX, Math.min(left, vw - width - VIEW_MARGIN_PX));

      const spaceBelow = vh - rect.bottom - GAP_PX - VIEW_MARGIN_PX;
      const spaceAbove = rect.top - GAP_PX - VIEW_MARGIN_PX;
      const heightCap = Math.min(vh * 0.82, 560);
      const placeBelow = spaceBelow >= 140 || spaceBelow >= spaceAbove;

      if (placeBelow) {
        setLayout({
          position: "fixed",
          top: rect.bottom + GAP_PX,
          left,
          width,
          right: "auto",
          maxHeight: Math.min(heightCap, spaceBelow),
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          zIndex: popoverZIndex,
        });
      } else {
        setLayout({
          position: "fixed",
          bottom: vh - rect.top + GAP_PX,
          left,
          width,
          right: "auto",
          maxHeight: Math.min(heightCap, spaceAbove),
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          zIndex: popoverZIndex,
        });
      }
    };

    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
  }, [open, anchorRef, maxWidthPx, popoverZIndex]);

  return layout;
}
