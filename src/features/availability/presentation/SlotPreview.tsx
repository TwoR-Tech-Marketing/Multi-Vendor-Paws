"use client";

import { PortalSelect } from "@/components/ui/select/PortalSelect";
import { SkeletonBox, SkeletonText } from "@/components/ui/skeleton";
import { formatDayLabel } from "@/features/availability/domain/time";
import type { AvailabilityMode, SlotPreview as SlotPreviewData } from "@/features/availability/domain/types";
import { timeLabel } from "@/features/availability/presentation/availability-copy";
import type { BranchService } from "@/features/branches/domain/types";
import { serviceDisplayName } from "@/features/branches/presentation/branch-copy";
import type { AppStrings } from "@/shared/i18n/types";

import branchStyles from "@/features/branches/presentation/branches.module.css";
import styles from "./availability.module.css";

type SlotPreviewProps = {
  services: BranchService[];
  serviceId: string;
  mode: AvailabilityMode;
  homeVisitEnabled: boolean;
  preview: SlotPreviewData | null;
  isLoading: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
  canPrevWeek: boolean;
  canNextWeek: boolean;
  strings: AppStrings;
  locale: string;
  onServiceChange: (serviceId: string) => void;
  onModeChange: (mode: AvailabilityMode) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
};

function PreviewSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-busy="true" aria-label={label}>
      {[0, 1, 2].map((row) => (
        <div key={row} className={styles.previewDay}>
          <SkeletonText size="md" width={140} />
          <div className={styles.chips}>
            <SkeletonBox width={88} height={40} borderRadius="var(--radius-sm)" />
            <SkeletonBox width={88} height={40} borderRadius="var(--radius-sm)" />
            <SkeletonBox width={88} height={40} borderRadius="var(--radius-sm)" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Provider preview of what buyers can book (generated on the server). */
export function SlotPreview({
  services,
  serviceId,
  mode,
  homeVisitEnabled,
  preview,
  isLoading,
  error,
  hasUnsavedChanges,
  canPrevWeek,
  canNextWeek,
  strings,
  locale,
  onServiceChange,
  onModeChange,
  onPrevWeek,
  onNextWeek,
}: SlotPreviewProps) {
  const t = strings.availability.preview;

  if (services.length === 0) return <p className={branchStyles.muted}>{t.noServices}</p>;

  const modeOptions = [{ value: "branch", label: strings.availability.tabs.weekly }];
  if (homeVisitEnabled) modeOptions.push({ value: "home", label: strings.availability.tabs.homeVisit });

  return (
    <div className={branchStyles.stack}>
      <p className={branchStyles.muted}>{t.hint}</p>
      {hasUnsavedChanges ? <p className={branchStyles.muted}>{t.saveFirst}</p> : null}
      <div className={styles.previewFilters}>
        <div className={branchStyles.field}>
          <span className={branchStyles.label}>{t.service}</span>
          <PortalSelect
            value={serviceId}
            ariaLabel={t.service}
            options={services.map((s) => ({ value: s.serviceId, label: serviceDisplayName(s, locale) }))}
            onChange={onServiceChange}
          />
        </div>
        <div className={branchStyles.field}>
          <span className={branchStyles.label}>{t.mode}</span>
          <PortalSelect
            value={mode}
            ariaLabel={t.mode}
            options={modeOptions}
            onChange={(value) => onModeChange(value === "home" ? "home" : "branch")}
          />
        </div>
      </div>

      <div className={branchStyles.actions}>
        <button
          type="button"
          className={branchStyles.secondaryButton}
          disabled={!canPrevWeek || isLoading}
          onClick={onPrevWeek}
        >
          {t.previousWeek}
        </button>
        <button
          type="button"
          className={branchStyles.secondaryButton}
          disabled={!canNextWeek || isLoading}
          onClick={onNextWeek}
        >
          {t.nextWeek}
        </button>
      </div>

      {error ? (
        <div className={branchStyles.alertError} role="alert">
          {error}
        </div>
      ) : isLoading || !preview ? (
        <PreviewSkeleton label={strings.common.loading} />
      ) : (
        <div>
          {preview.days.map((day) => (
            <div key={day.date} className={styles.previewDay} data-date={day.date}>
              <span className={branchStyles.label}>{formatDayLabel(day.date, locale)}</span>
              {day.closed ? (
                <span className={branchStyles.muted}>{t.closed}</span>
              ) : day.slots.length === 0 ? (
                <span className={branchStyles.muted}>{t.noSlots}</span>
              ) : (
                <div className={styles.chips}>
                  {day.slots.map((slot) => (
                    <span
                      key={slot.startMs}
                      className={`${styles.chip} ${slot.remaining === 0 ? styles.chipFull : ""}`}
                    >
                      <span>{timeLabel(slot.startLocal, strings)}</span>
                      <span className={styles.chipMeta}>
                        {slot.remaining === 0
                          ? t.full
                          : t.remaining.replace("{count}", String(slot.remaining))}
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
