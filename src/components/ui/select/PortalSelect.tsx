"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import type { PortalSelectProps } from "@/components/ui/select/PortalSelect.types";

import styles from "./PortalSelect.module.css";

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
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find((option) => option.value === value)?.label ?? "";

  const close = useCallback(() => setIsOpen(false), []);

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        close();
      }
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

  function onSelect(nextValue: string) {
    onChange(nextValue);
    close();
  }

  const rootClassName = [styles.container, className].filter(Boolean).join(" ");

  return (
    <div ref={containerRef} className={rootClassName}>
      <button
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

      <div
        id={listboxId}
        role="listbox"
        aria-label={ariaLabel}
        className={`${styles.popup} ${isOpen ? styles.popupOpen : ""}`}
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
    </div>
  );
}
