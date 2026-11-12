import { invokeCallable } from "@/lib/callable";

/** Callable names of the `vendor_coupons` export group (vendor side only). */
export const COUPON_CALLABLES = {
  list: "vendor_coupons-listMyVendorCoupons",
  get: "vendor_coupons-getMyVendorCoupon",
  create: "vendor_coupons-createMyVendorCoupon",
  update: "vendor_coupons-updateMyVendorCoupon",
  setActive: "vendor_coupons-setMyVendorCouponActive",
} as const;

export type CouponCallableName = (typeof COUPON_CALLABLES)[keyof typeof COUPON_CALLABLES];

/** Calls one coupons callable and returns its raw data. Errors propagate. */
export async function invokeCouponCallable(
  name: CouponCallableName,
  payload: Record<string, unknown>,
): Promise<unknown> {
  return invokeCallable(name, payload);
}
