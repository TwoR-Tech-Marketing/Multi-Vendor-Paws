import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FIXED_NOW_MS, makeCoupon } from "@/features/coupons/presentation/test-fixtures";
import { getStrings } from "@/shared/i18n/get-strings";

const state = vi.hoisted(() => ({ locale: "en" as "en" | "ar" }));

vi.mock("@/shared/preferences/PreferencesContext", async () => {
  const { getStrings: load } = await import("@/shared/i18n/get-strings");
  return { useStrings: () => load(state.locale) };
});

import { CouponForm } from "@/features/coupons/presentation/CouponForm";

const en = getStrings("en");
const ar = getStrings("ar");
const noop = () => {};

function render(props: Partial<Parameters<typeof CouponForm>[0]> = {}) {
  return renderToStaticMarkup(
    <CouponForm
      nowMs={FIXED_NOW_MS}
      isSaving={false}
      serverError={null}
      onSubmit={noop}
      onCancel={noop}
      {...props}
    />,
  );
}

afterEach(() => {
  state.locale = "en";
});

describe("CouponForm", () => {
  it("renders the create form with every field, hints and Cairo date bounds", () => {
    const html = render();
    expect(html).toContain(en.coupons.add);
    for (const label of [
      en.coupons.fields.code,
      en.coupons.fields.type,
      en.coupons.fields.valuePercent,
      en.coupons.fields.maxDiscount,
      en.coupons.fields.minOrder,
      en.coupons.fields.expiresAt,
      en.coupons.fields.perUserLimit,
      en.coupons.fields.totalLimit,
      en.coupons.hints.fundedByVendor,
      en.coupons.hints.feesOnDiscounted,
    ]) {
      expect(html).toContain(label);
    }
    expect(html).toContain('type="date"');
    expect(html).toContain('min="2026-11-12"');
    expect(html).toContain('max="2027-11-12"');
    expect(html).toContain('value="2026-12-12"');
    expect(html).not.toContain("<select");
  });

  it("prefills a fixed coupon in EGP, hides the cap and locks the code", () => {
    const coupon = makeCoupon({ type: "fixed", value: 5025, maxDiscountPiastres: null });
    const html = render({ coupon });
    expect(html).toContain(en.coupons.edit);
    expect(html).toContain(en.coupons.fields.valueFixed);
    expect(html).not.toContain(en.coupons.fields.maxDiscount);
    expect(html).toContain('value="50.25"');
    expect(html).toContain('value="200"');
    expect(html).toMatch(/id="coupon-code"[^>]*disabled=""/);
    expect(html).not.toContain('role="note"');
  });

  it("locks type and value after the coupon was used", () => {
    const html = render({ coupon: makeCoupon({ usedCount: 2 }) });
    expect(html).toContain(en.coupons.lockedHint.replace("'", "&#x27;"));
    expect(html).toMatch(/id="coupon-value"[^>]*disabled=""/);
    expect(html).toMatch(/id="coupon-type"[^>]*disabled=""/);
    expect(html).not.toMatch(/id="coupon-per-user"[^>]*disabled=""/);
  });

  it("shows the server error and the saving state", () => {
    const html = render({ isSaving: true, serverError: en.errors.coupons.codeTaken });
    expect(html).toContain(en.errors.coupons.codeTaken);
    expect(html).toContain(en.coupons.saving);
  });

  it("renders in Arabic", () => {
    state.locale = "ar";
    const html = render();
    expect(html).toContain(ar.coupons.fields.code);
    expect(html).toContain(ar.coupons.save);
    expect(html).toContain(ar.coupons.hints.fundedByVendor);
  });
});
