import { StatusBadge, type StatusTone } from "@/components/ui/badge/StatusBadge";
import type { CouponStatus } from "@/features/coupons/domain/types";
import type { AppStrings } from "@/shared/i18n/types";

export const COUPON_STATUS_TONE: Record<CouponStatus, StatusTone> = {
  active: "success",
  paused: "hold",
  expired: "neutral",
  exhausted: "neutral",
};

export function CouponStatusBadge({ status, strings }: { status: CouponStatus; strings: AppStrings }) {
  return (
    <StatusBadge
      tone={COUPON_STATUS_TONE[status]}
      label={strings.coupons.status[status]}
      status={status}
    />
  );
}
