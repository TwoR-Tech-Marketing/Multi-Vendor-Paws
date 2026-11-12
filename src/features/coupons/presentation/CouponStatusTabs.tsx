import {
  COUPON_STATUS_FILTERS,
  type CouponStatusFilter,
} from "@/features/coupons/domain/types";
import type { AppStrings } from "@/shared/i18n/types";

import styles from "./coupons.module.css";

type CouponStatusTabsProps = {
  strings: AppStrings;
  tab: CouponStatusFilter;
  onTabChange: (tab: CouponStatusFilter) => void;
};

export function CouponStatusTabs({ strings, tab, onTabChange }: CouponStatusTabsProps) {
  return (
    <div className={styles.tabs} role="tablist" aria-label={strings.coupons.filterLabel}>
      {COUPON_STATUS_FILTERS.map((id) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={tab === id}
          className={`${styles.tab} ${tab === id ? styles.tabActive : ""}`}
          onClick={() => onTabChange(id)}
        >
          {strings.coupons.tabs[id]}
        </button>
      ))}
    </div>
  );
}
