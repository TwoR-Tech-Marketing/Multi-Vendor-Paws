import { z } from "zod";

import {
  COUPON_LIMITS as L,
  COUPON_TYPES,
  type Coupon,
  type CouponCreatePayload,
  type CouponType,
  type CouponUpdatePayload,
} from "@/features/coupons/domain/types";
import {
  cairoDayEndMs,
  cairoDayNumber,
  parseIsoDay,
} from "@/features/orders/lib/cairoDates";
import { egpToPiastres, piastresToEgp } from "@/features/products/domain/currency";

/**
 * Form values are strings as typed. Parsing returns the callable payload with
 * money in integer piastres and the expiry at the end of the chosen Cairo
 * day, or one error per field. Error values are field names; presentation
 * shows `coupons.validation.<field>`.
 */

export type CouponFormValues = {
  code: string;
  type: CouponType;
  /** Whole percent for percentage coupons, EGP for fixed coupons. */
  value: string;
  maxDiscountEgp: string;
  minOrderEgp: string;
  /** Cairo calendar day, `YYYY-MM-DD`. */
  expiresOn: string;
  perUserLimit: string;
  totalLimit: string;
};

export type CouponFormField =
  | "code"
  | "type"
  | "value"
  | "maxDiscount"
  | "minOrder"
  | "expiresAt"
  | "perUserLimit"
  | "totalLimit";

export type CouponFormResult =
  | { ok: true; payload: CouponCreatePayload }
  | { ok: false; errors: Partial<Record<CouponFormField, true>> };

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_EXPIRY_DAYS = 30;

/** Trim, drop inner spaces, ASCII upper case, the same as the server. */
export function normalizeCouponCode(raw: string): string {
  return raw.trim().replace(/\s+/g, "").replace(/[a-z]/g, (c) => c.toUpperCase());
}

export const couponCodeSchema = z
  .string()
  .transform(normalizeCouponCode)
  .refine((code) => /^[A-Z0-9_-]{4,20}$/.test(code) && /[A-Z]/.test(code));

/** Up to two decimals, non negative, as piastres within a range. */
const egpPiastres = (minPiastres: number, maxPiastres: number) =>
  z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/)
    .transform((value) => egpToPiastres(Number(value)))
    .refine((value) => value >= minPiastres && value <= maxPiastres);

const intString = (min: number, max: number) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/)
    .transform(Number)
    .refine((value) => value >= min && value <= max);

const optional = <T extends z.ZodTypeAny>(schema: T) =>
  z.union([z.string().trim().length(0).transform(() => null), schema]);

export const couponFormSchema = z.object({
  code: couponCodeSchema,
  type: z.enum(COUPON_TYPES),
  value: z.string(),
  maxDiscountEgp: z.string(),
  minOrderEgp: optional(egpPiastres(0, L.minOrderMaxPiastres)),
  expiresOn: z.string(),
  perUserLimit: intString(L.perUserMin, L.perUserMax),
  totalLimit: optional(intString(L.totalMin, L.totalMax)),
});

const FIELD_BY_PATH: Record<string, CouponFormField> = {
  code: "code",
  type: "type",
  minOrderEgp: "minOrder",
  perUserLimit: "perUserLimit",
  totalLimit: "totalLimit",
};

/** `YYYY-MM-DD` of a day number (days since 1970-01-01). */
export function isoDayFromNumber(dayNum: number): string {
  return new Date(dayNum * DAY_MS).toISOString().slice(0, 10);
}

/** Cairo `YYYY-MM-DD` of an instant. */
export function cairoIsoDay(ms: number): string {
  return isoDayFromNumber(cairoDayNumber(ms));
}

/** First and last Cairo days a vendor may pick, for the date input bounds. */
export function expiryDayBounds(nowMs: number): { min: string; max: string } {
  const today = cairoDayNumber(nowMs);
  const firstDay =
    cairoDayEndMs(today) > nowMs + L.minExpiryLeadMs ? today : today + 1;
  return {
    min: isoDayFromNumber(firstDay),
    max: isoDayFromNumber(cairoDayNumber(nowMs + L.maxExpiryDays * DAY_MS)),
  };
}

/** End of the chosen Cairo day in millis, or null when the day is not allowed. */
export function parseExpiryDay(value: string, nowMs: number): number | null {
  const day = parseIsoDay(value.trim());
  if (day === null) return null;
  const endMs = cairoDayEndMs(day);
  const lastDay = cairoDayNumber(nowMs + L.maxExpiryDays * DAY_MS);
  if (endMs <= nowMs + L.minExpiryLeadMs || day > lastDay) return null;
  return endMs;
}

function parseValue(type: CouponType, value: string): number | null {
  const parsed =
    type === "percentage"
      ? intString(L.percentMin, L.percentMax).safeParse(value)
      : egpPiastres(L.fixedMinPiastres, L.fixedMaxPiastres).safeParse(value);
  return parsed.success ? parsed.data : null;
}

export type ParseCouponOptions = {
  /** Stored expiry of the coupon being edited; keeping its day skips the date checks. */
  currentExpiresAtMs?: number | null;
};

export function parseCouponForm(
  values: CouponFormValues,
  nowMs: number,
  options: ParseCouponOptions = {},
): CouponFormResult {
  const errors: Partial<Record<CouponFormField, true>> = {};
  const parsed = couponFormSchema.safeParse(values);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = FIELD_BY_PATH[String(issue.path[0])];
      if (field) errors[field] = true;
    }
  }

  const type: CouponType = values.type === "fixed" ? "fixed" : "percentage";
  const value = parseValue(type, values.value);
  if (value === null) errors.value = true;

  let maxDiscountPiastres: number | null = null;
  if (type === "percentage") {
    const cap = optional(
      egpPiastres(L.maxDiscountMinPiastres, L.maxDiscountMaxPiastres),
    ).safeParse(values.maxDiscountEgp);
    if (cap.success) maxDiscountPiastres = cap.data;
    else errors.maxDiscount = true;
  }

  const current = options.currentExpiresAtMs ?? null;
  const keepsExpiry = current !== null && values.expiresOn.trim() === cairoIsoDay(current);
  const expiresAtMs = keepsExpiry ? current : parseExpiryDay(values.expiresOn, nowMs);
  if (expiresAtMs === null) errors.expiresAt = true;

  if (parsed.success) {
    const data = parsed.data;
    const minOrder = data.minOrderEgp ?? 0;
    if (type === "fixed" && value !== null && minOrder < value) errors.minOrder = true;
    if (data.totalLimit !== null && data.totalLimit < data.perUserLimit) {
      errors.totalLimit = true;
    }
  }

  if (!parsed.success || Object.keys(errors).length > 0 || value === null) {
    return { ok: false, errors };
  }

  const data = parsed.data;
  return {
    ok: true,
    payload: {
      code: data.code,
      type,
      value,
      maxDiscountPiastres,
      minOrderPiastres: data.minOrderEgp ?? 0,
      expiresAtMs: expiresAtMs as number,
      perUserLimit: data.perUserLimit,
      totalLimit: data.totalLimit,
    },
  };
}

/**
 * Update request from a parsed form: never the code, and the expiry only when
 * the day changed (an unchanged expiry is not checked again).
 */
export function buildCouponUpdate(
  payload: CouponCreatePayload,
  coupon: Coupon,
): CouponUpdatePayload {
  const update: CouponUpdatePayload = {
    type: payload.type,
    value: payload.value,
    maxDiscountPiastres: payload.maxDiscountPiastres,
    minOrderPiastres: payload.minOrderPiastres,
    perUserLimit: payload.perUserLimit,
    totalLimit: payload.totalLimit,
  };
  if (payload.expiresAtMs !== coupon.expiresAtMs) update.expiresAtMs = payload.expiresAtMs;
  return update;
}

function egpText(piastres: number): string {
  return String(piastresToEgp(piastres));
}

export function initialCouponValues(coupon: Coupon | null, nowMs: number): CouponFormValues {
  if (!coupon) {
    return {
      code: "",
      type: "percentage",
      value: "",
      maxDiscountEgp: "",
      minOrderEgp: "",
      expiresOn: cairoIsoDay(nowMs + DEFAULT_EXPIRY_DAYS * DAY_MS),
      perUserLimit: "1",
      totalLimit: "",
    };
  }
  return {
    code: coupon.code,
    type: coupon.type,
    value: coupon.type === "fixed" ? egpText(coupon.value) : String(coupon.value),
    maxDiscountEgp:
      coupon.maxDiscountPiastres === null ? "" : egpText(coupon.maxDiscountPiastres),
    minOrderEgp: coupon.minOrderPiastres > 0 ? egpText(coupon.minOrderPiastres) : "",
    expiresOn: coupon.expiresAtMs === null ? "" : cairoIsoDay(coupon.expiresAtMs),
    perUserLimit: String(coupon.perUserLimit),
    totalLimit: coupon.totalLimit === null ? "" : String(coupon.totalLimit),
  };
}
