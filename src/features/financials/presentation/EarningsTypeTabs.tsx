import type { EarningsEntryFilter } from "@/features/financials/domain/types";
import type { AppStrings } from "@/shared/i18n/types";

import styles from "./earnings.module.css";

const FILTERS: EarningsEntryFilter[] = ["all", "sale", "refund", "adjustment", "payout"];

type EarningsTypeTabsProps = {
  strings: AppStrings;
  tab: EarningsEntryFilter;
  onTabChange: (tab: EarningsEntryFilter) => void;
};

export function EarningsTypeTabs({ strings, tab, onTabChange }: EarningsTypeTabsProps) {
  return (
    <div className={styles.tabs} role="tablist" aria-label={strings.earnings.filterLabel}>
      {FILTERS.map((id) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={tab === id}
          className={`${styles.tab} ${tab === id ? styles.tabActive : ""}`}
          onClick={() => onTabChange(id)}
        >
          {strings.earnings.types[id]}
        </button>
      ))}
    </div>
  );
}
