"use client";

import type { AppStrings } from "@/shared/i18n/types";

import styles from "./availability.module.css";

export type AvailabilityTab = "weekly" | "homeVisit" | "exceptions" | "preview";

const TABS: AvailabilityTab[] = ["weekly", "homeVisit", "exceptions", "preview"];

type AvailabilityTabsProps = {
  value: AvailabilityTab;
  strings: AppStrings;
  onChange: (tab: AvailabilityTab) => void;
};

export function AvailabilityTabs({ value, strings, onChange }: AvailabilityTabsProps) {
  return (
    <div className={styles.tabs} role="tablist" aria-label={strings.availability.title}>
      {TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={tab === value}
          className={`${styles.tab} ${tab === value ? styles.tabActive : ""}`}
          onClick={() => onChange(tab)}
        >
          {strings.availability.tabs[tab]}
        </button>
      ))}
    </div>
  );
}
