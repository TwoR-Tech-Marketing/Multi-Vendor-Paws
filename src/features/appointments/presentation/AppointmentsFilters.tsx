"use client";

import { PortalSelect } from "@/components/ui/select/PortalSelect";
import {
  DATE_PRESETS,
  STATUS_GROUPS,
  validateCustomRange,
  type AppointmentFilters,
  type DatePreset,
} from "@/features/appointments/domain/filters";
import type { AppStrings } from "@/shared/i18n/types";

import branchStyles from "@/features/branches/presentation/branches.module.css";
import styles from "./appointments.module.css";

export type BranchOption = { branchId: string; name: string };

type AppointmentsFiltersProps = {
  filters: AppointmentFilters;
  branches: BranchOption[];
  strings: AppStrings;
  onChange: (filters: AppointmentFilters) => void;
  onPresetChange: (preset: DatePreset) => void;
};

/** Status chips, branch and date filters. Pure: driven by props. */
export function AppointmentsFilters({
  filters,
  branches,
  strings,
  onChange,
  onPresetChange,
}: AppointmentsFiltersProps) {
  const t = strings.appointments.filters;
  const rangeError =
    filters.datePreset === "custom" ? validateCustomRange(filters.dateFrom, filters.dateTo) : null;

  return (
    <div className={branchStyles.stack}>
      <div className={styles.chips} role="group" aria-label={t.status}>
        {STATUS_GROUPS.map((group) => (
          <button
            key={group}
            type="button"
            aria-pressed={filters.group === group}
            className={`${styles.chip} ${filters.group === group ? styles.chipActive : ""}`}
            onClick={() => onChange({ ...filters, group })}
          >
            {t.groups[group]}
          </button>
        ))}
      </div>
      <div className={styles.filterGrid}>
        <div className={branchStyles.field}>
          <span className={branchStyles.label}>{t.branch}</span>
          <PortalSelect
            value={filters.branchId}
            ariaLabel={t.branch}
            options={[
              { value: "", label: t.allBranches },
              ...branches.map((b) => ({ value: b.branchId, label: b.name })),
            ]}
            onChange={(branchId) => onChange({ ...filters, branchId })}
          />
        </div>
        <div className={branchStyles.field}>
          <span className={branchStyles.label}>{t.date}</span>
          <PortalSelect
            value={filters.datePreset}
            ariaLabel={t.date}
            options={DATE_PRESETS.map((preset) => ({ value: preset, label: t.presets[preset] }))}
            onChange={(value) => onPresetChange(value as DatePreset)}
          />
        </div>
        {filters.datePreset === "custom" ? (
          <>
            <label className={branchStyles.field}>
              <span className={branchStyles.label}>{t.from}</span>
              <input
                type="date"
                className={branchStyles.input}
                value={filters.dateFrom}
                onChange={(event) => onChange({ ...filters, dateFrom: event.target.value })}
              />
            </label>
            <label className={branchStyles.field}>
              <span className={branchStyles.label}>{t.to}</span>
              <input
                type="date"
                className={branchStyles.input}
                value={filters.dateTo}
                onChange={(event) => onChange({ ...filters, dateTo: event.target.value })}
              />
            </label>
          </>
        ) : null}
      </div>
      {rangeError ? (
        <p className={branchStyles.fieldError} role="alert">
          {t[rangeError]}
        </p>
      ) : null}
    </div>
  );
}
