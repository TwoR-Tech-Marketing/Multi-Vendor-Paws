import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ensureClientAuth: vi.fn(async () => undefined),
  callableFn: vi.fn(),
  httpsCallable: vi.fn(),
}));

vi.mock("firebase/functions", () => ({ httpsCallable: mocks.httpsCallable }));
vi.mock("@/lib/client-auth", () => ({ ensureClientAuth: mocks.ensureClientAuth }));
vi.mock("@/lib/firebase", () => ({ firebaseFunctions: {} }));

import {
  createCoupon,
  getCoupon,
  listCoupons,
  mapCoupon,
  setCouponActive,
  updateCoupon,
} from "@/features/coupons/application/coupons.api";
import { mapCouponsError } from "@/features/coupons/domain/errors";
import { couponsErrorMessage } from "@/features/coupons/presentation/coupon-copy";
import { getStrings } from "@/shared/i18n/get-strings";

const RAW_COUPON = {
  couponId: "uid1_SAVE10",
  code: "SAVE10",
  type: "percentage",
  value: 10,
  maxDiscountPiastres: 5000,
  minOrderPiastres: 20000,
  expiresAtMs: 1798754399999,
  perUserLimit: 2,
  totalLimit: 100,
  active: true,
  status: "active",
  fundedBy: "vendor",
  usedCount: 3,
  discountGivenPiastres: 4500,
  lastUsedAtMs: 1700000000000,
  createdAtMs: 1,
  updatedAtMs: 2,
};

beforeEach(() => {
  mocks.callableFn.mockReset();
  mocks.httpsCallable.mockReset();
  mocks.httpsCallable.mockImplementation(() => mocks.callableFn);
});

function lastCall() {
  const name = mocks.httpsCallable.mock.calls.at(-1)?.[1];
  const payload = mocks.callableFn.mock.calls.at(-1)?.[0];
  return { name, payload };
}

describe("coupons api", () => {
  it("lists coupons with the status filter and maps every field", async () => {
    mocks.callableFn.mockResolvedValue({ data: { ok: true, items: [RAW_COUPON] } });
    const items = await listCoupons();
    expect(lastCall()).toEqual({
      name: "vendor_coupons-listMyVendorCoupons",
      payload: { status: "all" },
    });
    expect(items).toEqual([
      {
        couponId: "uid1_SAVE10",
        code: "SAVE10",
        type: "percentage",
        value: 10,
        maxDiscountPiastres: 5000,
        minOrderPiastres: 20000,
        expiresAtMs: 1798754399999,
        perUserLimit: 2,
        totalLimit: 100,
        active: true,
        status: "active",
        usedCount: 3,
        discountGivenPiastres: 4500,
        lastUsedAtMs: 1700000000000,
        createdAtMs: 1,
        updatedAtMs: 2,
      },
    ]);
  });

  it("defaults missing or broken fields safely", () => {
    const coupon = mapCoupon({ couponId: "c1", type: "other", value: 1.5, status: "weird" });
    expect(coupon).toMatchObject({
      type: "percentage",
      value: 0,
      maxDiscountPiastres: null,
      minOrderPiastres: 0,
      expiresAtMs: null,
      perUserLimit: 1,
      totalLimit: null,
      active: true,
      status: "active",
      usedCount: 0,
    });
    expect(mapCoupon(null).couponId).toBe("");
    expect(mapCoupon({ status: "exhausted", active: false })).toMatchObject({
      status: "exhausted",
      active: false,
    });
  });

  it("gets a coupon with usage and recent redemptions", async () => {
    mocks.callableFn.mockResolvedValue({
      data: {
        ok: true,
        coupon: { ...RAW_COUPON, type: "fixed", value: 5000, maxDiscountPiastres: null },
        usage: {
          usedCount: 3,
          remainingTotal: 97,
          discountGivenPiastres: 4500,
          lastUsedAtMs: 1700000000000,
          recent: [
            {
              orderId: "o1",
              vendorOrderId: "vo1",
              itemsPiastres: 30000,
              discountPiastres: 1500,
              status: "applied",
              createdAtMs: 1700000000000,
              reversedAtMs: null,
            },
            { orderId: "o2", vendorOrderId: "", status: "reversed", userId: "buyer" },
          ],
        },
      },
    });
    const detail = await getCoupon("uid1_SAVE10");
    expect(lastCall()).toEqual({
      name: "vendor_coupons-getMyVendorCoupon",
      payload: { couponId: "uid1_SAVE10" },
    });
    expect(detail.coupon.type).toBe("fixed");
    expect(detail.coupon.value).toBe(5000);
    expect(detail.usage.remainingTotal).toBe(97);
    expect(detail.usage.recent[0]).toEqual({
      orderId: "o1",
      vendorOrderId: "vo1",
      itemsPiastres: 30000,
      discountPiastres: 1500,
      status: "applied",
      createdAtMs: 1700000000000,
      reversedAtMs: null,
    });
    expect(detail.usage.recent[1]).toMatchObject({ vendorOrderId: null, status: "reversed" });
    expect(detail.usage.recent[1]).not.toHaveProperty("userId");
  });

  it("maps an unlimited coupon to a null remaining count", async () => {
    mocks.callableFn.mockResolvedValue({
      data: { ok: true, coupon: { ...RAW_COUPON, totalLimit: null }, usage: { remainingTotal: null } },
    });
    const detail = await getCoupon("uid1_SAVE10");
    expect(detail.usage.remainingTotal).toBeNull();
    expect(detail.usage.usedCount).toBe(3);
    expect(detail.usage.recent).toEqual([]);
  });

  it("creates, updates and pauses through the vendor callables", async () => {
    mocks.callableFn.mockResolvedValue({ data: { ok: true, coupon: RAW_COUPON } });
    const payload = {
      code: "save10",
      type: "percentage" as const,
      value: 10,
      maxDiscountPiastres: 5000,
      minOrderPiastres: 20000,
      expiresAtMs: 1798754399999,
      perUserLimit: 2,
      totalLimit: 100,
    };
    expect((await createCoupon(payload)).code).toBe("SAVE10");
    expect(lastCall()).toEqual({ name: "vendor_coupons-createMyVendorCoupon", payload });

    await updateCoupon("uid1_SAVE10", { perUserLimit: 3 });
    expect(lastCall()).toEqual({
      name: "vendor_coupons-updateMyVendorCoupon",
      payload: { perUserLimit: 3, couponId: "uid1_SAVE10" },
    });

    await setCouponActive("uid1_SAVE10", false);
    expect(lastCall()).toEqual({
      name: "vendor_coupons-setMyVendorCouponActive",
      payload: { couponId: "uid1_SAVE10", active: false },
    });
  });

  it("never sends a vendor id", async () => {
    mocks.callableFn.mockResolvedValue({ data: { ok: true, items: [] } });
    await listCoupons("paused");
    expect(lastCall().payload).toEqual({ status: "paused" });
  });

  it("propagates callable errors", async () => {
    mocks.callableFn.mockRejectedValue({ code: "functions/not-found", message: "Coupon not found." });
    await expect(getCoupon("x")).rejects.toMatchObject({ code: "functions/not-found" });
  });
});

describe("mapCouponsError", () => {
  it.each([
    [{ code: "functions/already-exists", message: "This code is already in use." }, "codeTaken"],
    [{ code: "functions/invalid-argument", message: "code must be 4 to 20 letters" }, "codeInvalid"],
    [{ code: "functions/invalid-argument", message: "code cannot be changed." }, "codeInvalid"],
    [
      { code: "functions/invalid-argument", message: "expiresAtMs must be more than 1 hour" },
      "expiryInvalid",
    ],
    [{ code: "functions/invalid-argument", message: "value must be a whole number" }, "invalidField"],
    [
      { code: "functions/failed-precondition", message: "type and value are locked after use." },
      "locked",
    ],
    [
      { code: "functions/failed-precondition", message: "totalLimit can only grow after use." },
      "locked",
    ],
    [
      {
        code: "functions/failed-precondition",
        message: "Expired or used up coupons cannot be resumed.",
      },
      "cannotResume",
    ],
    [
      { code: "functions/failed-precondition", message: "You can have at most 50 active coupons." },
      "limit",
    ],
    [{ code: "functions/not-found", message: "Coupon not found." }, "notFound"],
    [{ code: "functions/permission-denied", message: "Account is suspended." }, "notAllowed"],
    [{ code: "functions/unauthenticated", message: "" }, "notAllowed"],
    [{ code: "functions/internal", message: "boom" }, "generic"],
    [new Error("network"), "generic"],
    [null, "generic"],
  ])("maps %o to %s", (error, key) => {
    expect(mapCouponsError(error)).toBe(key);
  });

  it("turns keys into localized copy and never the raw message", () => {
    const en = getStrings("en");
    const ar = getStrings("ar");
    const taken = { code: "functions/already-exists", message: "This code is already in use." };
    expect(couponsErrorMessage(taken, en)).toBe(en.errors.coupons.codeTaken);
    expect(couponsErrorMessage(taken, ar)).toBe(ar.errors.coupons.codeTaken);
    const limit = { code: "functions/failed-precondition", message: "at most 50" };
    expect(couponsErrorMessage(limit, en)).toBe(en.coupons.limitReached);
    expect(couponsErrorMessage({ code: "functions/internal", message: "stack" }, en)).toBe(
      en.errors.generic,
    );
  });
});
