import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { makeCoupon, makeCouponDetail } from "@/features/coupons/presentation/test-fixtures";
import { getStrings } from "@/shared/i18n/get-strings";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("@/shared/preferences/PreferencesContext", async () => {
  const { getStrings: load } = await import("@/shared/i18n/get-strings");
  return {
    useStrings: () => load("en"),
    usePreferences: () => ({ locale: "en", dir: "ltr" }),
  };
});
vi.mock("@/features/coupons/application/coupons.api", () => ({
  getCoupon: vi.fn(),
  updateCoupon: vi.fn(),
  setCouponActive: vi.fn(),
}));

import { CouponDetail } from "@/features/coupons/presentation/CouponDetail";
import { CouponDetailSection } from "@/features/coupons/presentation/CouponDetailSection";

const en = getStrings("en");
const ar = getStrings("ar");
const noop = () => {};

function render(props: Partial<Parameters<typeof CouponDetail>[0]> = {}) {
  return renderToStaticMarkup(
    <CouponDetail
      detail={makeCouponDetail()}
      strings={en}
      locale="en"
      isBusy={false}
      onEdit={noop}
      onPause={noop}
      onResume={noop}
      {...props}
    />,
  );
}

describe("CouponDetailSection", () => {
  it("starts with the shimmer skeleton", () => {
    const html = renderToStaticMarkup(<CouponDetailSection couponId="c1" />);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain(`aria-label="${en.common.loading}"`);
  });
});

describe("CouponDetail", () => {
  it("shows an unused coupon with an empty usage table", () => {
    const html = render();
    expect(html).toContain("SAVE10");
    expect(html).toContain("10% off");
    expect(html).toContain(en.coupons.usage.title);
    expect(html).toContain(en.coupons.usage.neverUsed);
    expect(html).toContain(en.coupons.usage.recentEmpty);
    expect(html).toContain(en.coupons.pause);
    expect(html).toContain('href="/coupons"');
  });

  it("shows usage, remaining, discount given and recent redemptions", () => {
    const html = render({
      detail: makeCouponDetail({
        coupon: makeCoupon({ usedCount: 2, status: "paused", active: false }),
        usage: {
          usedCount: 2,
          remainingTotal: 98,
          discountGivenPiastres: 3550,
          lastUsedAtMs: Date.UTC(2026, 10, 10, 10),
          recent: [
            {
              orderId: "o1",
              vendorOrderId: "vo1",
              itemsPiastres: 30000,
              discountPiastres: 3000,
              status: "applied",
              createdAtMs: Date.UTC(2026, 10, 10, 10),
              reversedAtMs: null,
            },
            {
              orderId: "o2",
              vendorOrderId: null,
              itemsPiastres: 5500,
              discountPiastres: 550,
              status: "reversed",
              createdAtMs: Date.UTC(2026, 10, 9, 10),
              reversedAtMs: Date.UTC(2026, 10, 9, 12),
            },
          ],
        },
      }),
    });
    expect(html).toContain(">98<");
    expect(html).toContain("35.50 EGP");
    expect(html).toContain("Nov 10, 2026");
    expect(html).toContain('href="/orders/vo1"');
    expect(html).toContain("300.00 EGP");
    expect(html).toContain(en.coupons.usage.applied);
    expect(html).toContain(en.coupons.usage.reversed);
    expect(html).toContain(en.coupons.resume);
    expect(html).not.toContain(`>${en.coupons.pause}<`);
  });

  it("shows unlimited remaining uses and no pause or resume once ended", () => {
    const html = render({
      detail: makeCouponDetail({
        coupon: makeCoupon({ status: "expired", totalLimit: null }),
        usage: { usedCount: 0, remainingTotal: null, discountGivenPiastres: 0, lastUsedAtMs: null, recent: [] },
      }),
    });
    expect(html).toContain(en.coupons.usage.unlimited);
    expect(html).toContain(en.coupons.status.expired);
    expect(html).not.toContain(`>${en.coupons.pause}<`);
    expect(html).not.toContain(`>${en.coupons.resume}<`);
  });

  it("renders Arabic copy", () => {
    const html = render({ strings: ar, locale: "ar" });
    expect(html).toContain(ar.coupons.usage.title);
    expect(html).toContain(ar.coupons.usage.recentEmpty);
    expect(html).not.toMatch(/[٠-٩]/);
  });
});
