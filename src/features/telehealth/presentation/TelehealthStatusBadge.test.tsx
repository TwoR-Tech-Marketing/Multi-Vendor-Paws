import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { COUPON_STATUS_TONE } from "@/features/coupons/presentation/CouponStatusBadge";
import { getStrings } from "@/shared/i18n/get-strings";

import { TELEHEALTH_STATUS_TONE, TelehealthStatusBadge } from "./TelehealthStatusBadge";

describe("status tones shared with the vendor app", () => {
  it("maps telehealth statuses to queued warning, active success, ended neutral, refund flagged danger", () => {
    expect(TELEHEALTH_STATUS_TONE.queued).toBe("warning");
    expect(TELEHEALTH_STATUS_TONE.active).toBe("success");
    expect(TELEHEALTH_STATUS_TONE.ended).toBe("neutral");
    expect(TELEHEALTH_STATUS_TONE.refund_flagged).toBe("danger");
  });

  it("shows an exhausted coupon as neutral", () => {
    expect(COUPON_STATUS_TONE.exhausted).toBe("neutral");
  });

  it("renders the refund flagged badge with the danger tone and its label", () => {
    const en = getStrings("en");
    const html = renderToStaticMarkup(<TelehealthStatusBadge status="refund_flagged" strings={en} />);
    expect(html).toContain('data-tone="danger"');
    expect(html).toContain(en.telehealth.statusLabels.refund_flagged);
  });
});
