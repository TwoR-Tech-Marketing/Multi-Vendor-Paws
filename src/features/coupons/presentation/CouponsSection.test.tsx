import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { makeCoupon } from "@/features/coupons/presentation/test-fixtures";
import { getStrings } from "@/shared/i18n/get-strings";

const state = vi.hoisted(() => ({ locale: "en" as "en" | "ar" }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("@/shared/preferences/PreferencesContext", async () => {
  const { getStrings: load } = await import("@/shared/i18n/get-strings");
  return {
    useStrings: () => load(state.locale),
    usePreferences: () => ({ locale: state.locale, dir: state.locale === "ar" ? "rtl" : "ltr" }),
  };
});
vi.mock("@/features/coupons/application/coupons.api", () => ({
  listCoupons: vi.fn(),
  createCoupon: vi.fn(),
  updateCoupon: vi.fn(),
  setCouponActive: vi.fn(),
}));

import { CouponList, CouponsSection } from "@/features/coupons/presentation/CouponsSection";

const en = getStrings("en");
const ar = getStrings("ar");
const noop = () => {};

function renderList(props: Partial<Parameters<typeof CouponList>[0]> = {}) {
  return renderToStaticMarkup(
    <CouponList
      coupons={[]}
      tab="all"
      strings={en}
      locale="en"
      isBusy={false}
      onTabChange={noop}
      onAdd={noop}
      onEdit={noop}
      onPause={noop}
      onResume={noop}
      {...props}
    />,
  );
}

beforeEach(() => {
  state.locale = "en";
});

describe("CouponsSection", () => {
  it("starts with the shimmer skeleton, not a spinner", () => {
    const html = renderToStaticMarkup(<CouponsSection />);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain(`aria-label="${en.common.loading}"`);
  });
});

describe("CouponList", () => {
  it("shows the empty state and the create button", () => {
    const html = renderList();
    expect(html).toContain(en.coupons.empty);
    expect(html).toContain(en.coupons.add);
    expect(html).not.toContain('role="tablist"');
  });

  it("renders rows with value, conditions, status, usage, expiry and actions", () => {
    const html = renderList({
      coupons: [makeCoupon({ usedCount: 3 }), makeCoupon({ couponId: "c2", code: "FLAT50", type: "fixed", value: 5000, maxDiscountPiastres: null, totalLimit: null, status: "paused", active: false })],
    });
    expect(html).toContain("SAVE10");
    expect(html).toContain("10% off");
    expect(html).toMatch(/up to 50[\d.]* EGP/);
    expect(html).toMatch(/Min\. order 200[\d.]* EGP/);
    expect(html).toContain("3 of 100");
    expect(html).toContain("0 used");
    expect(html).toContain("Dec 31, 2026");
    expect(html).toContain('href="/coupons/uid1_SAVE10"');
    expect(html).toContain(en.coupons.pause);
    expect(html).toContain(en.coupons.resume);
    expect(html).toContain(en.coupons.status.paused);
    for (const id of ["all", "active", "paused", "expired", "exhausted"] as const) {
      expect(html).toContain(en.coupons.tabs[id]);
    }
  });

  it("filters by the status tab and shows the filtered empty state", () => {
    const coupons = [makeCoupon(), makeCoupon({ couponId: "c2", code: "OLD1", status: "expired" })];
    const expired = renderList({ coupons, tab: "expired" });
    expect(expired).toContain("OLD1");
    expect(expired).not.toContain("SAVE10");
    expect(expired).not.toContain(`>${en.coupons.pause}<`);
    const exhausted = renderList({ coupons, tab: "exhausted" });
    expect(exhausted).toContain(en.coupons.filteredEmpty);
  });

  it("disables create at 50 active or paused coupons; ended ones do not count", () => {
    const open = Array.from({ length: 50 }, (_, i) =>
      makeCoupon({ couponId: `c${i}`, status: i % 2 ? "paused" : "active" }),
    );
    const html = renderList({ coupons: open });
    expect(html).toContain(en.coupons.limitReached);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Create coupon<\/button>/);

    const mixed = [...open.slice(0, 49), makeCoupon({ couponId: "x", status: "expired" })];
    expect(renderList({ coupons: mixed })).not.toContain(en.coupons.limitReached);
  });

  it("renders Arabic copy with Western digits", () => {
    const html = renderList({ strings: ar, locale: "ar", coupons: [makeCoupon({ usedCount: 3 })] });
    expect(html).toContain(ar.coupons.title);
    expect(html).toContain(ar.coupons.status.active);
    expect(html).toContain("3 من 100");
    expect(html).toContain("2026");
    expect(html).not.toMatch(/[٠-٩]/);
  });
});
