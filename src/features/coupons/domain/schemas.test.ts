import { describe, expect, it } from "vitest";

import {
  buildCouponUpdate,
  cairoIsoDay,
  expiryDayBounds,
  initialCouponValues,
  normalizeCouponCode,
  parseCouponForm,
  parseExpiryDay,
  type CouponFormValues,
} from "@/features/coupons/domain/schemas";
import { FIXED_NOW_MS, makeCoupon } from "@/features/coupons/presentation/test-fixtures";

const NOW = FIXED_NOW_MS;

function values(patch: Partial<CouponFormValues> = {}): CouponFormValues {
  return {
    code: " save 10 ",
    type: "percentage",
    value: "15",
    maxDiscountEgp: "50",
    minOrderEgp: "200.50",
    expiresOn: "2026-12-31",
    perUserLimit: "1",
    totalLimit: "100",
    ...patch,
  };
}

function errorsOf(patch: Partial<CouponFormValues>) {
  const result = parseCouponForm(values(patch), NOW);
  return result.ok ? {} : result.errors;
}

describe("normalizeCouponCode", () => {
  it("trims, drops spaces and upper cases ASCII", () => {
    expect(normalizeCouponCode("  summer sale-1 ")).toBe("SUMMERSALE-1");
  });
});

describe("parseCouponForm", () => {
  it("returns a percentage payload in piastres with the Cairo end of day", () => {
    expect(parseCouponForm(values(), NOW)).toEqual({
      ok: true,
      payload: {
        code: "SAVE10",
        type: "percentage",
        value: 15,
        maxDiscountPiastres: 5000,
        minOrderPiastres: 20050,
        expiresAtMs: Date.UTC(2026, 11, 31, 21, 59, 59, 999),
        perUserLimit: 1,
        totalLimit: 100,
      },
    });
  });

  it("returns a fixed payload with no cap and optional fields empty", () => {
    const result = parseCouponForm(
      values({
        type: "fixed",
        value: "50.25",
        maxDiscountEgp: "999",
        minOrderEgp: "100",
        totalLimit: "",
      }),
      NOW,
    );
    expect(result.ok && result.payload).toMatchObject({
      type: "fixed",
      value: 5025,
      maxDiscountPiastres: null,
      minOrderPiastres: 10000,
      totalLimit: null,
    });
  });

  it("defaults the minimum order to 0 and the cap to null", () => {
    const result = parseCouponForm(values({ minOrderEgp: "", maxDiscountEgp: "" }), NOW);
    expect(result.ok && result.payload).toMatchObject({
      minOrderPiastres: 0,
      maxDiscountPiastres: null,
    });
  });

  it.each(["ab1", "12345", "CODE!", "كوبون1234", "A".repeat(21)])("refuses code %s", (code) => {
    expect(errorsOf({ code })).toEqual({ code: true });
  });

  it.each(["0", "91", "12.5", "", "abc"])("refuses percent %s", (value) => {
    expect(errorsOf({ value })).toEqual({ value: true });
  });

  it.each(["0.99", "100000.01", "1.234", ""])("refuses fixed amount %s", (value) => {
    expect(errorsOf({ type: "fixed", value, minOrderEgp: "200000" })).toEqual({ value: true });
  });

  it("accepts the fixed bounds 1 and 100,000 EGP", () => {
    expect(parseCouponForm(values({ type: "fixed", value: "1" }), NOW).ok).toBe(true);
    expect(
      parseCouponForm(values({ type: "fixed", value: "100000", minOrderEgp: "100000" }), NOW).ok,
    ).toBe(true);
  });

  it("needs the minimum order to cover a fixed discount", () => {
    expect(errorsOf({ type: "fixed", value: "300", minOrderEgp: "200" })).toEqual({
      minOrder: true,
    });
    expect(errorsOf({ type: "fixed", value: "300", minOrderEgp: "" })).toEqual({ minOrder: true });
  });

  it("checks the cap range only for percentage coupons", () => {
    expect(errorsOf({ maxDiscountEgp: "0.5" })).toEqual({ maxDiscount: true });
    expect(errorsOf({ maxDiscountEgp: "100000.01" })).toEqual({ maxDiscount: true });
  });

  it("checks the minimum order range", () => {
    expect(errorsOf({ minOrderEgp: "1000000.01" })).toEqual({ minOrder: true });
    expect(errorsOf({ minOrderEgp: "-1" })).toEqual({ minOrder: true });
  });

  it.each(["", "2026-11-11", "2027-11-13", "2026-02-30", "31/12/2026"])(
    "refuses expiry %s",
    (expiresOn) => {
      expect(errorsOf({ expiresOn })).toEqual({ expiresAt: true });
    },
  );

  it("accepts today while more than an hour is left, and one year ahead", () => {
    expect(parseCouponForm(values({ expiresOn: "2026-11-12" }), NOW).ok).toBe(true);
    expect(parseCouponForm(values({ expiresOn: "2027-11-12" }), NOW).ok).toBe(true);
    const lateEvening = Date.UTC(2026, 10, 12, 21, 30);
    expect(parseExpiryDay("2026-11-12", lateEvening)).toBeNull();
  });

  it("checks the per customer and total limits", () => {
    expect(errorsOf({ perUserLimit: "" })).toEqual({ perUserLimit: true });
    expect(errorsOf({ perUserLimit: "0" })).toEqual({ perUserLimit: true });
    expect(errorsOf({ perUserLimit: "101", totalLimit: "" })).toEqual({ perUserLimit: true });
    expect(errorsOf({ totalLimit: "0" })).toEqual({ totalLimit: true });
    expect(errorsOf({ totalLimit: "100001" })).toEqual({ totalLimit: true });
    expect(errorsOf({ perUserLimit: "5", totalLimit: "4" })).toEqual({ totalLimit: true });
  });

  it("keeps an unchanged expiry of the coupon being edited without checking it again", () => {
    const pastExpiry = Date.UTC(2026, 9, 1, 20, 59, 59, 999);
    const form = values({ expiresOn: cairoIsoDay(pastExpiry) });
    expect(parseCouponForm(form, NOW).ok).toBe(false);
    const result = parseCouponForm(form, NOW, { currentExpiresAtMs: pastExpiry });
    expect(result.ok && result.payload.expiresAtMs).toBe(pastExpiry);
  });
});

describe("expiryDayBounds", () => {
  it("starts today, or tomorrow in the last hour of the Cairo day", () => {
    expect(expiryDayBounds(NOW)).toEqual({ min: "2026-11-12", max: "2027-11-12" });
    expect(expiryDayBounds(Date.UTC(2026, 10, 12, 21, 30)).min).toBe("2026-11-13");
  });
});

describe("buildCouponUpdate", () => {
  it("never sends the code and drops an unchanged expiry", () => {
    const coupon = makeCoupon();
    const result = parseCouponForm(values(), NOW);
    if (!result.ok) throw new Error("expected a valid form");
    const same = buildCouponUpdate(
      { ...result.payload, expiresAtMs: coupon.expiresAtMs as number },
      coupon,
    );
    expect(same).not.toHaveProperty("code");
    expect(same).not.toHaveProperty("expiresAtMs");
    const changed = buildCouponUpdate({ ...result.payload, expiresAtMs: 1 }, coupon);
    expect(changed.expiresAtMs).toBe(1);
    expect(changed.perUserLimit).toBe(1);
  });
});

describe("initialCouponValues", () => {
  it("starts a new coupon with one use per customer and a default expiry", () => {
    expect(initialCouponValues(null, NOW)).toMatchObject({
      code: "",
      type: "percentage",
      perUserLimit: "1",
      expiresOn: "2026-12-12",
    });
  });

  it("prefills money in EGP and the Cairo expiry day", () => {
    const fixed = makeCoupon({
      type: "fixed",
      value: 5025,
      maxDiscountPiastres: null,
      totalLimit: null,
    });
    expect(initialCouponValues(fixed, NOW)).toEqual({
      code: "SAVE10",
      type: "fixed",
      value: "50.25",
      maxDiscountEgp: "",
      minOrderEgp: "200",
      expiresOn: "2026-12-31",
      perUserLimit: "1",
      totalLimit: "",
    });
  });
});
