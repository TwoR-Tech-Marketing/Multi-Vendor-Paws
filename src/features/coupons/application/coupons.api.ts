import {
  COUPON_STATUSES,
  type Coupon,
  type CouponCreatePayload,
  type CouponDetail,
  type CouponRedemption,
  type CouponStatus,
  type CouponStatusFilter,
  type CouponUpdatePayload,
} from "@/features/coupons/domain/types";
import {
  COUPON_CALLABLES,
  invokeCouponCallable,
} from "@/features/coupons/infrastructure/coupons.callables";

/**
 * Vendor coupons through the shared `vendor_coupons` callables. No BFF
 * exists for this feature. vendorId is always the caller's auth uid on the
 * server; nothing here sends one.
 */

type Raw = Record<string, unknown>;

function asObject(value: unknown): Raw {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Raw) : {};
}

function asInt(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isInteger(value) ? value : fallback;
}

function asNullableInt(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asMillis(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asStatus(value: unknown): CouponStatus {
  return COUPON_STATUSES.find((s) => s === value) ?? "active";
}

export function mapCoupon(value: unknown): Coupon {
  const raw = asObject(value);
  return {
    couponId: asString(raw.couponId),
    code: asString(raw.code),
    type: raw.type === "fixed" ? "fixed" : "percentage",
    value: Math.max(0, asInt(raw.value)),
    maxDiscountPiastres: asNullableInt(raw.maxDiscountPiastres),
    minOrderPiastres: Math.max(0, asInt(raw.minOrderPiastres)),
    expiresAtMs: asMillis(raw.expiresAtMs),
    perUserLimit: asInt(raw.perUserLimit, 1),
    totalLimit: asNullableInt(raw.totalLimit),
    active: raw.active !== false,
    status: asStatus(raw.status),
    usedCount: Math.max(0, asInt(raw.usedCount)),
    discountGivenPiastres: Math.max(0, asInt(raw.discountGivenPiastres)),
    lastUsedAtMs: asMillis(raw.lastUsedAtMs),
    createdAtMs: asMillis(raw.createdAtMs),
    updatedAtMs: asMillis(raw.updatedAtMs),
  };
}

export function mapRedemption(value: unknown): CouponRedemption {
  const raw = asObject(value);
  return {
    orderId: asString(raw.orderId),
    vendorOrderId: typeof raw.vendorOrderId === "string" && raw.vendorOrderId
      ? raw.vendorOrderId
      : null,
    itemsPiastres: Math.max(0, asInt(raw.itemsPiastres)),
    discountPiastres: Math.max(0, asInt(raw.discountPiastres)),
    status: raw.status === "reversed" ? "reversed" : "applied",
    createdAtMs: asMillis(raw.createdAtMs),
    reversedAtMs: asMillis(raw.reversedAtMs),
  };
}

export function mapCouponDetail(value: unknown): CouponDetail {
  const raw = asObject(value);
  const coupon = mapCoupon(raw.coupon);
  const usage = asObject(raw.usage);
  return {
    coupon,
    usage: {
      usedCount: Math.max(0, asInt(usage.usedCount, coupon.usedCount)),
      remainingTotal: asNullableInt(usage.remainingTotal),
      discountGivenPiastres: Math.max(
        0,
        asInt(usage.discountGivenPiastres, coupon.discountGivenPiastres),
      ),
      lastUsedAtMs: asMillis(usage.lastUsedAtMs),
      recent: (Array.isArray(usage.recent) ? usage.recent : []).map(mapRedemption),
    },
  };
}

function couponFrom(data: unknown): Coupon {
  return mapCoupon(asObject(data).coupon);
}

export async function listCoupons(status: CouponStatusFilter = "all"): Promise<Coupon[]> {
  const data = asObject(await invokeCouponCallable(COUPON_CALLABLES.list, { status }));
  return (Array.isArray(data.items) ? data.items : []).map(mapCoupon);
}

export async function getCoupon(couponId: string): Promise<CouponDetail> {
  return mapCouponDetail(await invokeCouponCallable(COUPON_CALLABLES.get, { couponId }));
}

export async function createCoupon(payload: CouponCreatePayload): Promise<Coupon> {
  return couponFrom(await invokeCouponCallable(COUPON_CALLABLES.create, { ...payload }));
}

export async function updateCoupon(
  couponId: string,
  payload: CouponUpdatePayload,
): Promise<Coupon> {
  return couponFrom(
    await invokeCouponCallable(COUPON_CALLABLES.update, { ...payload, couponId }),
  );
}

export async function setCouponActive(couponId: string, active: boolean): Promise<Coupon> {
  return couponFrom(
    await invokeCouponCallable(COUPON_CALLABLES.setActive, { couponId, active }),
  );
}
