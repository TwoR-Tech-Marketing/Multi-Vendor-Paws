import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { EarningsEmptyState } from "@/features/financials/presentation/EarningsEmptyState";
import { getStrings } from "@/shared/i18n/get-strings";

const en = getStrings("en");

function render(vendorType?: string) {
  return renderToStaticMarkup(<EarningsEmptyState strings={en} vendorType={vendorType} />);
}

describe("EarningsEmptyState", () => {
  it("keeps today's store empty state with the orders link", () => {
    for (const type of ["store", undefined]) {
      const html = render(type);
      expect(html).toContain(en.earnings.emptyDescription);
      expect(html).toContain('href="/orders"');
      expect(html).toContain(en.earnings.goToOrders);
    }
  });

  it("shows provider wording without an orders link for a clinic", () => {
    const html = render("clinic");
    expect(html).toContain(en.earnings.emptyDescriptionProvider);
    expect(html).not.toContain("href=");
    expect(html.toLowerCase()).not.toContain("order");
  });
});
