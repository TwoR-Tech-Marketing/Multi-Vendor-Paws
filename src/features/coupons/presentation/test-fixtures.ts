import type { Coupon, CouponDetail } from "@/features/coupons/domain/types";

/** 2026-11-12 10:00 UTC (12:00 Cairo). */
export const FIXED_NOW_MS = Date.UTC(2026, 10, 12, 10, 0, 0);

export function makeCoupon(patch: Partial<Coupon> = {}): Coupon {
  return {
    couponId: "uid1_SAVE10",
    code: "SAVE10",
    type: "percentage",
    value: 10,
    maxDiscountPiastres: 5000,
    minOrderPiastres: 20000,
    expiresAtMs: Date.UTC(2026, 11, 31, 21, 59, 59, 999),
    perUserLimit: 1,
    totalLimit: 100,
    active: true,
    status: "active",
    usedCount: 0,
    discountGivenPiastres: 0,
    lastUsedAtMs: null,
    createdAtMs: 1,
    updatedAtMs: 1,
    ...patch,
  };
}

export function makeCouponDetail(patch: Partial<CouponDetail> = {}): CouponDetail {
  return {
    coupon: makeCoupon(),
    usage: {
      usedCount: 0,
      remainingTotal: 100,
      discountGivenPiastres: 0,
      lastUsedAtMs: null,
      recent: [],
    },
    ...patch,
  };
}
