"use client";

import { PortalSelect } from "@/components/ui/select/PortalSelect";
import { REVIEW_FILTERS, type ReviewFilter } from "@/features/reviews/domain/types";
import type { AppStrings } from "@/shared/i18n/types";

import branchStyles from "@/features/branches/presentation/branches.module.css";
import styles from "./reviews.module.css";

export type ReviewBranchOption = { branchId: string; name: string };

type ReviewsFiltersProps = {
  filter: ReviewFilter;
  branchId: string;
  branches: ReviewBranchOption[];
  strings: AppStrings;
  onFilterChange: (filter: ReviewFilter) => void;
  onBranchChange: (branchId: string) => void;
};

/** Filter chips (all, not replied, low) and the branch select. Pure. */
export function ReviewsFilters({
  filter,
  branchId,
  branches,
  strings,
  onFilterChange,
  onBranchChange,
}: ReviewsFiltersProps) {
  const t = strings.reviews;
  return (
    <div className={styles.filters}>
      <div className={styles.chips} role="group" aria-label={t.filterLabel}>
        {REVIEW_FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            className={`${styles.chip} ${filter === value ? styles.chipActive : ""}`}
            onClick={() => onFilterChange(value)}
          >
            {t.filters[value]}
          </button>
        ))}
      </div>
      <div className={`${branchStyles.field} ${styles.branchField}`}>
        <span className={branchStyles.label}>{t.branch}</span>
        <PortalSelect
          value={branchId}
          ariaLabel={t.branch}
          options={[
            { value: "", label: t.allBranches },
            ...branches.map((b) => ({ value: b.branchId, label: b.name })),
          ]}
          onChange={onBranchChange}
        />
      </div>
    </div>
  );
}
