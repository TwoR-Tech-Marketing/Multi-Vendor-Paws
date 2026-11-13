import { readFileSync } from "node:fs";
import path from "node:path";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { STATUS_TONES, StatusBadge } from "@/components/ui/badge/StatusBadge";
import {
  APPOINTMENT_STATUS_TONE,
  AppointmentBadges,
} from "@/features/appointments/presentation/AppointmentBadges";
import { orderStatusTone } from "@/features/orders/presentation/OrderStatusBadge";
import { productStatusTone } from "@/features/products/presentation/ProductStatusBadge";
import { getStrings } from "@/shared/i18n/get-strings";

const css = readFileSync(path.join(__dirname, "statusBadge.module.css"), "utf8");

function ruleBody(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`(^|\\n)${escaped}\\s*\\{([^}]*)\\}`));
  return match?.[2] ?? "";
}

describe("StatusBadge", () => {
  it("renders the label with the tone class and data attributes", () => {
    const html = renderToStaticMarkup(<StatusBadge tone="success" label="Delivered" status="delivered" />);
    expect(html).toContain(">Delivered</span>");
    expect(html).toContain('data-tone="success"');
    expect(html).toContain('data-status="delivered"');
    expect(html).toMatch(/class="[^"]*badge[^"]*success/);
  });

  it("renders Arabic labels unchanged", () => {
    const label = getStrings("ar").orders.statusLabels.delivered;
    const html = renderToStaticMarkup(<StatusBadge tone="success" label={label} />);
    expect(html).toContain(label);
  });

  it.each(STATUS_TONES)("defines a colour rule for the %s tone", (tone) => {
    expect(ruleBody(`.${tone}`)).toMatch(/color: var\(--tp-color-/);
  });

  it("gives every badge a shape: dot by default, pause glyph for on hold, hollow dot for cancelled", () => {
    expect(ruleBody(".badge::before")).toContain("background: currentColor");
    expect(ruleBody(".hold::before")).toContain("linear-gradient");
    expect(ruleBody(".cancelled::before")).toContain("background: transparent");
    expect(ruleBody(".cancelled::before")).toContain("border: 1.5px solid currentColor");
  });

  it("uses the selected colours for confirmed", () => {
    expect(ruleBody(".confirmed")).toContain("var(--tp-color-selected-bg)");
    expect(ruleBody(".confirmed")).toContain("var(--tp-color-selected-fg)");
  });
});

describe("feature status tones", () => {
  it("maps order statuses", () => {
    expect(orderStatusTone("delivered")).toBe("success");
    expect(orderStatusTone("pending")).toBe("warning");
    expect(orderStatusTone("confirmed")).toBe("confirmed");
    expect(orderStatusTone("shipped")).toBe("info");
    expect(orderStatusTone("cancelled")).toBe("cancelled");
  });

  it("maps product statuses", () => {
    expect(productStatusTone("active")).toBe("success");
    expect(productStatusTone("out_of_stock")).toBe("warning");
    expect(productStatusTone("archived")).toBe("cancelled");
    expect(productStatusTone("inactive")).toBe("neutral");
  });

  it("maps appointment statuses and shows held as on hold", () => {
    expect(APPOINTMENT_STATUS_TONE.paid).toBe("confirmed");
    expect(APPOINTMENT_STATUS_TONE.no_show).toBe("danger");
    expect(APPOINTMENT_STATUS_TONE.cancelled_by_user).toBe("cancelled");
    const en = getStrings("en");
    const html = renderToStaticMarkup(
      <AppointmentBadges status="paid" held noShowState={null} strings={en} />,
    );
    expect(html).toContain('data-tone="hold"');
    expect(html).toContain(en.appointments.held);
    expect(html).toContain(en.appointments.status.paid);
  });
});
