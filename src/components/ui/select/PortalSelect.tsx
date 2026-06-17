"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import type { PortalSelectProps } from "@/components/ui/select/PortalSelect.types";

import styles from "./PortalSelect.module.css";

const POPUP_GAP_PX = 6;
const OPTION_HEIGHT_PX = 44;
const POPUP_PADDING_PX = 24;

type PopupPosition = {
  top: number;
  left: number;
  width: number;
};

function measurePopupPosition(
  trigger: HTMLElement,
  optionCount: number,
): PopupPosition {
  const rect = trigger.getBoundingClientRect();
  const estimatedHeight = optionCount * OPTION_HEIGHT_PX + POPUP_PADDING_PX;
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  const openUpward = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;

  return {
    left: rect.left,
    width: rect.width,
    top: openUpward
      ? Math.max(POPUP_GAP_PX, rect.top - estimatedHeight - POPUP_GAP_PX)
      : rect.bottom + POPUP_GAP_PX,
  };
}

export function PortalSelect({
  id,
  value,
  options,
  onChange,
  ariaLabel,
  className,
}: PortalSelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const listboxId = `${selectId}-listbox`;
  const [isOpen, setIsOpen] = useState(false);
  const [popupPosition, setPopupPosition] = useState<PopupPosition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find((option) => option.value === value)?.label ?? "";

  const close = useCallback(() => setIsOpen(false), []);

  const updatePopupPosition = useCallback(() => {
    if (!triggerRef.current) return;
    setPopupPosition(measurePopupPosition(triggerRef.current, options.length));
  }, [options.length]);

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (popupRef.current?.contains(target)) return;
      close();
    },
    [close],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, isOpen]);

  useLayoutEffect(() => {
    if (!isOpen) {
      setPopupPosition(null);
      return;
    }

    updatePopupPosition();

    function handleViewportChange() {
      updatePopupPosition();
    }

    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [isOpen, updatePopupPosition]);

  function onSelect(nextValue: string) {
    onChange(nextValue);
    close();
  }

  const rootClassName = [styles.container, className].filter(Boolean).join(" ");

  const popup = isOpen && popupPosition ? (
    <div
      ref={popupRef}
      id={listboxId}
      role="listbox"
      aria-label={ariaLabel}
      className={`${styles.popup} ${styles.popupFixed} ${styles.popupOpen}`}
      style={{
        top: popupPosition.top,
        left: popupPosition.left,
        width: popupPosition.width,
      }}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="option"
            aria-selected={isSelected}
            className={styles.option}
            onClick={() => onSelect(option.value)}
          >
            <span
              className={`${styles.radio} ${isSelected ? styles.radioSelected : ""}`}
              aria-hidden
            >
              <span
                className={`${styles.radioDot} ${isSelected ? styles.radioDotSelected : ""}`}
              />
            </span>
            <span className={styles.optionLabel}>{option.label}</span>
          </button>
        );
      })}
    </div>
  ) : null;

  return (
    <div ref={containerRef} className={rootClassName}>
      <button
        ref={triggerRef}
        type="button"
        id={selectId}
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ""}`}
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={ariaLabel}
      >
        {selectedLabel}
      </button>

      <span
        className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}
        aria-hidden
      />

      {typeof document !== "undefined" && popup
        ? createPortal(popup, document.body)
        : null}
    </div>
  );
}
