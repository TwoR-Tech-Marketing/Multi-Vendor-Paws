import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { VendorOrderStatusEvent } from "@/features/orders/domain/types";
import { OrderStatusTimeline } from "@/features/orders/presentation/OrderStatusTimeline";
import { getStrings } from "@/shared/i18n/get-strings";

const EVENTS: VendorOrderStatusEvent[] = [
  { status: "pending", at: new Date("2026-11-10T22:01:00.000Z"), byRole: "system", note: null },
  { status: "confirmed", at: new Date("2026-11-10T23:00:00.000Z"), byRole: "vendor", note: "Packed" },
  { status: "shipped", at: new Date("2026-11-11T08:00:00.000Z"), byRole: "admin", note: null },
];

function render(locale: "en" | "ar") {
  return renderToStaticMarkup(
    <OrderStatusTimeline
      events={EVENTS}
      strings={getStrings(locale)}
      formatDate={(date) => date.toISOString()}
    />,
  );
}

describe("OrderStatusTimeline", () => {
  it("shows the role label for each entry in English", () => {
    const html = render("en");
    expect(html).toContain(">System<");
    expect(html).toContain(">Vendor<");
    expect(html).toContain(">Admin<");
    expect(html).toContain("Packed");
    expect(html).toContain("2026-11-11T08:00:00.000Z");
    expect(html.match(/<li/g)).toHaveLength(3);
  });

  it("shows the role label for each entry in Arabic", () => {
    const html = render("ar");
    const ar = getStrings("ar").orders.historyRoleLabels;
    expect(ar).toEqual({ vendor: "التاجر", admin: "الإدارة", system: "النظام" });
    for (const label of Object.values(ar)) expect(html).toContain(`>${label}<`);
    expect(html).toContain(getStrings("ar").orders.statusLabels.shipped);
  });

  it("renders no rows for an empty history", () => {
    const html = renderToStaticMarkup(
      <OrderStatusTimeline events={[]} strings={getStrings("en")} formatDate={String} />,
    );
    expect(html).not.toContain("<li");
  });
});
