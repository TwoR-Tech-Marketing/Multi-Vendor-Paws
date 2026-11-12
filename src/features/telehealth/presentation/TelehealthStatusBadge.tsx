import { StatusBadge, type StatusTone } from "@/components/ui/badge/StatusBadge";
import type { TelehealthSessionStatus } from "@/features/telehealth/domain/types";
import type { AppStrings } from "@/shared/i18n/types";

export const TELEHEALTH_STATUS_TONE: Record<TelehealthSessionStatus, StatusTone> = {
  queued: "warning",
  active: "success",
  ended: "neutral",
  refund_flagged: "neutral",
  unknown: "neutral",
};

export function TelehealthStatusBadge({
  status,
  strings,
}: {
  status: TelehealthSessionStatus;
  strings: AppStrings;
}) {
  return (
    <StatusBadge
      tone={TELEHEALTH_STATUS_TONE[status]}
      label={strings.telehealth.statusLabels[status]}
      status={status}
    />
  );
}
