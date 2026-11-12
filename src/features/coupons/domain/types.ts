/**
 * Vendor coupons as returned by the shared `vendor_coupons` callables.
 * Money is integer piastres; times are epoch millis. Status is derived on
 * the server when read and never stored.
 */

export const COUPON_TYPES = ["percentage", "fixed"] as const;
export type CouponType = (typeof COUPON_TYPES)[number];

export const COUPON_STATUSES = ["active", "paused", "expired", "exhausted"] as const;
export type CouponStatus = (typeof COUPON_STATUSES)[number];

export const COUPON_STATUS_FILTERS = ["all", ...COUPON_STATUSES] as const;
export type CouponStatusFilter = (typeof COUPON_STATUS_FILTERS)[number];

/** Same limits as the callables. */
export const COUPON_LIMITS = {
  codeMin: 4,
  codeMax: 20,
  percentMin: 1,
  percentMax: 90,
  fixedMinPiastres: 100,
  fixedMaxPiastres: 10_000_000,
  maxDiscountMinPiastres: 100,
  maxDiscountMaxPiastres: 10_000_000,
  minOrderMaxPiastres: 100_000_000,
  perUserMin: 1,
  perUserMax: 100,
  totalMin: 1,
  totalMax: 100_000,
  openPerVendor: 50,
  maxExpiryDays: 365,
  minExpiryLeadMs: 60 * 60 * 1000,
} as const;

export type Coupon = {
  couponId: string;
  code: string;
  type: CouponType;
  /** Whole percent for percentage coupons, piastres for fixed coupons. */
  value: number;
  maxDiscountPiastres: number | null;
  minOrderPiastres: number;
  expiresAtMs: number | null;
  perUserLimit: number;
  totalLimit: number | null;
  active: boolean;
  status: CouponStatus;
  usedCount: number;
  discountGivenPiastres: number;
  lastUsedAtMs: number | null;
  createdAtMs: number | null;
  updatedAtMs: number | null;
};

export type CouponRedemption = {
  orderId: string;
  vendorOrderId: string | null;
  itemsPiastres: number;
  discountPiastres: number;
  status: "applied" | "reversed";
  createdAtMs: number | null;
  reversedAtMs: number | null;
};

export type CouponUsage = {
  usedCount: number;
  remainingTotal: number | null;
  discountGivenPiastres: number;
  lastUsedAtMs: number | null;
  recent: CouponRedemption[];
};

export type CouponDetail = {
  coupon: Coupon;
  usage: CouponUsage;
};

/** Create request. The code is sent as typed; the server normalizes it. */
export type CouponCreatePayload = {
  code: string;
  type: CouponType;
  value: number;
  maxDiscountPiastres: number | null;
  minOrderPiastres: number;
  expiresAtMs: number;
  perUserLimit: number;
  totalLimit: number | null;
};

/** Update request: editable fields only, never the code. */
export type CouponUpdatePayload = Partial<Omit<CouponCreatePayload, "code">>;

/** Active and paused coupons count toward the per vendor limit. */
export function countOpenCoupons(coupons: Coupon[]): number {
  return coupons.filter((c) => c.status === "active" || c.status === "paused").length;
}
