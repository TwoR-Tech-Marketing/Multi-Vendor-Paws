import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { VendorOrder } from "@/features/orders/domain/types";
import { OrderDetailSkeleton } from "@/features/orders/presentation/OrderDetailSkeleton";
import { OrdersListPanel } from "@/features/orders/presentation/OrdersListPanel";
import { getStrings } from "@/shared/i18n/get-strings";

const en = getStrings("en");
const ar = getStrings("ar");
const esc = (text: string) => text.replace(/'/g, "&#x27;");
const noop = () => {};

function order(overrides: Partial<VendorOrder> = {}): VendorOrder {
  return {
    vendorOrderId: "vo1",
    orderId: "TP-1048",
    vendorId: "v1",
    buyerUid: "b1",
    buyerDisplayName: "Omar Hassan",
    buyerPhone: null,
    status: "pending",
    holdState: null,
    heldReason: null,
    statusHistory: [],
    lineItems: [],
    itemCount: 3,
    subtotalPiastres: 0,
    deliveryFeePiastres: 0,
    discountPiastres: 0,
    totalPiastres: 45900,
    commissionRatePercent: 10,
    commissionPiastres: 0,
    netPiastres: 0,
    currency: "EGP",
    placedAt: new Date("2026-11-13T08:30:00Z"),
    updatedAt: new Date("2026-11-13T08:30:00Z"),
    vendorStoreName: null,
    store: null,
    fulfillmentOwner: "vendor",
    adminEditable: false,
    deliveryAddress: null,
    paymentMethod: null,
    paymentStatus: null,
    ...overrides,
  };
}

function render(props: Partial<Parameters<typeof OrdersListPanel>[0]> = {}) {
  return renderToStaticMarkup(
    <OrdersListPanel
      orders={[]}
      error={null}
      isFiltered={false}
      strings={en}
      locale="en"
      onRetry={noop}
      onClearFilters={noop}
      {...props}
    />,
  );
}

const ERROR = { kind: "error" as const, title: en.states.errorTitle, description: en.orders.loadError };

describe("OrdersListPanel", () => {
  it("shows the empty state with the new copy", () => {
    const html = render();
    expect(html).toContain(en.orders.emptyTitle);
    expect(html).toContain(en.orders.emptyDescription);
  });

  it("offers clear filters on a filtered empty list", () => {
    const html = render({ isFiltered: true });
    expect(html).toContain(en.orders.emptyFilteredTitle);
    expect(html).toContain(`>${en.orders.clearFilters}</button>`);
  });

  it("shows the error state with retry instead of the empty state", () => {
    const html = render({ error: ERROR });
    expect(html).toContain('role="alert"');
    expect(html).toContain(esc(en.orders.loadError));
    expect(html).toContain(`>${en.states.retry}</button>`);
    expect(html).not.toContain(en.orders.emptyTitle);
  });

  it("keeps loaded rows and shows a compact error above them", () => {
    const html = render({ error: ERROR, orders: [order()] });
    expect(html).toContain('role="alert"');
    expect(html).toContain("<table");
  });

  it("shows the offline copy for a lost connection", () => {
    const html = render({
      error: { kind: "offline", title: en.states.offlineTitle, description: en.states.offlineDescription },
    });
    expect(html).toContain('data-kind="offline"');
    expect(html).toContain(en.states.offlineTitle);
  });

  it("end aligns money, isolates the order id and falls back to a guest name", () => {
    const html = render({ orders: [order({ buyerDisplayName: null })] });
    expect(html).toContain("<bdi>#TP-1048</bdi>");
    expect(html).toContain("459.00 EGP");
    expect(html).toContain(en.orders.guestCustomer);
  });

  it("formats Arabic rows with the unit after isolated figures and a held badge", () => {
    const html = renderToStaticMarkup(
      <OrdersListPanel
        orders={[order({ holdState: "held", totalPiastres: 99999999999 })]}
        error={null}
        isFiltered={false}
        strings={ar}
        locale="ar"
        onRetry={noop}
        onClearFilters={noop}
      />,
    );
    expect(html).toContain("⁦999,999,999.99⁩ ج.م");
    expect(html).toContain(`>${ar.orders.heldLabel}</span>`);
    expect(html).toContain('data-tone="hold"');
  });
});

describe("OrderDetailSkeleton", () => {
  it("is a busy status region built from shimmer primitives", () => {
    const html = renderToStaticMarkup(<OrderDetailSkeleton />);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toMatch(/shimmer/);
  });
});
