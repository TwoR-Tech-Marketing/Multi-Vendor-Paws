import { readFileSync } from "node:fs";
import path from "node:path";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { VendorEarningsEntry } from "@/features/financials/domain/types";
import { getStrings } from "@/shared/i18n/get-strings";

import { EarningsView, type EarningsViewProps } from "./EarningsView";

const en = getStrings("en");
const ar = getStrings("ar");

function entry(overrides: Partial<VendorEarningsEntry> = {}): VendorEarningsEntry {
  return {
    entryId: "sale_vo1",
    vendorId: "",
    type: "sale",
    amountPiastres: 11500,
    commissionPiastres: 1000,
    netPiastres: 10500,
    vendorOrderId: "vo1",
    orderId: "abcdefgh",
    description: "Order ABCDEFGH",
    currency: "EGP",
    createdAt: new Date("2026-11-12T10:00:00.000Z"),
    ...overrides,
  };
}

function render(overrides: Partial<EarningsViewProps> = {}): string {
  const noop = () => {};
  return renderToStaticMarkup(
    <EarningsView
      strings={en}
      locale="en"
      vendorType="store"
      summary={null}
      entries={[]}
      isLoading={false}
      error={null}
      paged={false}
      tab="all"
      isLoadingEntries={false}
      hasMore={false}
      isLoadingMore={false}
      onTabChange={noop}
      onLoadMore={noop}
      onRetry={noop}
      {...overrides}
    />,
  );
}

describe("EarningsView", () => {
  it("renders the shimmer skeleton on first load, not a spinner", () => {
    const html = render({ isLoading: true });
    expect(html).toContain('aria-busy="true"');
    expect(html).not.toContain(en.earnings.ledgerTitle);
  });

  it("keeps the bff layout: no tabs and no load more", () => {
    const html = render({ entries: [entry()], hasMore: true });
    expect(html).not.toContain('role="tablist"');
    expect(html).not.toContain(en.earnings.loadMore);
    expect(html).toContain("Order ABCDEFGH");
  });

  it("shows the five type tabs with the active one selected on the callable path", () => {
    const html = render({ paged: true, tab: "refund", entries: [entry()] });
    const tabs = [...html.matchAll(/<button[^>]*role="tab"[^>]*>([^<]*)<\/button>/g)];
    expect(tabs.map((m) => m[1])).toEqual([
      en.earnings.types.all,
      en.earnings.types.sale,
      en.earnings.types.refund,
      en.earnings.types.adjustment,
      en.earnings.types.payout,
    ]);
    const selected = tabs.filter((m) => m[0].includes('aria-selected="true"')).map((m) => m[1]);
    expect(selected).toEqual([en.earnings.types.refund]);
  });

  it("shows load more when there is a next page, and its busy state", () => {
    expect(render({ paged: true, entries: [entry()], hasMore: true })).toContain(en.earnings.loadMore);
    expect(render({ paged: true, entries: [entry()], hasMore: false })).not.toContain(
      en.earnings.loadMore,
    );
    const busy = render({ paged: true, entries: [entry()], hasMore: true, isLoadingMore: true });
    expect(busy).toMatch(new RegExp(`<button[^>]*disabled=""[^>]*>${en.earnings.loadingMore}</button>`));
  });

  it("shows row skeletons while a tab loads and a filtered empty message", () => {
    const loading = render({ paged: true, tab: "sale", isLoadingEntries: true });
    expect(loading).toContain('aria-busy="true"');
    expect(loading).toContain('role="tablist"');

    const empty = render({ paged: true, tab: "payout" });
    expect(empty).toContain(en.earnings.entries.empty);
    expect(empty).not.toContain(en.earnings.emptyTitle);

    expect(render({ paged: true, tab: "all" })).toContain(en.earnings.emptyTitle);
  });

  it("formats negative piastres with a sign instead of failing", () => {
    const html = render({
      paged: true,
      entries: [entry({ entryId: "p1", type: "payout", amountPiastres: -2500, commissionPiastres: 0, netPiastres: -2500, vendorOrderId: null, description: null })],
    });
    expect(html).toContain("-25.00 EGP");
    expect(html).toContain(en.earnings.typeLabels.payout);
    expect(html).toMatch(/class="[^"]*negative[^"]*">-25\.00 EGP/);
  });

  it("shows a negative payout row and negative summary on the bff layout", () => {
    const html = render({
      paged: false,
      summary: {
        vendorId: "",
        totalSalesPiastres: 0,
        totalCommissionPiastres: 0,
        netEarningsPiastres: -199,
        pendingPayoutPiastres: -50,
        currency: "EGP",
        updatedAt: new Date(0),
      },
      entries: [entry({ entryId: "payout_M2026-10", type: "payout", amountPiastres: -2500, commissionPiastres: 0, netPiastres: -2500, vendorOrderId: null, description: "Payout M2026-10" })],
    });
    expect(html).toContain("-25.00 EGP");
    expect(html).toContain("-1.99 EGP");
    expect(html).toContain("-0.50 EGP");
  });

  it("aligns the three money columns to the end edge", () => {
    const html = render({ entries: [entry()] });
    expect(html.match(/<th class="[^"]*money[^"]*"/g)).toHaveLength(3);
    expect(html.match(/<td class="[^"]*money[^"]*"/g)).toHaveLength(3);
  });

  it("links to the statement page", () => {
    const html = render({ entries: [entry()] });
    expect(html).toContain('href="/earnings/payouts"');
    expect(html).toContain(en.statement.viewStatement);
  });

  it("links to the deal page", () => {
    const html = render({ entries: [] });
    expect(html).toContain('href="/earnings/deal"');
    expect(html).toContain(en.earnings.viewDeal);
  });

  it("renders Arabic copy for tabs and summary", () => {
    const html = render({ strings: ar, paged: true, entries: [entry()], hasMore: true });
    expect(html).toContain(ar.earnings.types.all);
    expect(html).toContain(ar.earnings.summarySales);
    expect(html).toContain(ar.earnings.loadMore);
  });

  it("shows the full error with a retry and no zero totals when the first load failed", () => {
    const html = render({ error: { kind: "error", title: en.earnings.loadError } });
    expect(html).toContain('role="alert"');
    expect(html).toContain(en.common.retry);
    expect(html).not.toContain(en.earnings.summarySales);
  });

  it("shows the offline state when the connection dropped", () => {
    const html = render({
      error: { kind: "offline", title: en.states.offlineTitle, description: en.states.offlineDescription },
    });
    expect(html).toContain('data-kind="offline"');
    expect(html).toContain(en.states.offlineTitle);
  });

  it("keeps loaded rows under a compact error when loading more failed", () => {
    const html = render({
      summary: {
        vendorId: "v1",
        totalSalesPiastres: 100,
        totalCommissionPiastres: 10,
        netEarningsPiastres: 90,
        pendingPayoutPiastres: 0,
        currency: "EGP",
        updatedAt: new Date("2026-11-12T10:00:00.000Z"),
      },
      entries: [entry()],
      error: { kind: "error", title: en.earnings.loadError },
    });
    expect(html).toContain('role="alert"');
    expect(html).toContain("Order ABCDEFGH");
  });

  it("shows money as amount then unit with isolated figures and Cairo dates in Arabic", () => {
    const html = render({ strings: ar, locale: "ar", entries: [entry()] });
    expect(html).toContain("\u2066115.00\u2069 ج.م");
    expect(html).not.toMatch(/[٠-٩]/);
    expect(html).toContain("<bdi>Order ABCDEFGH</bdi>");
  });
});

describe("earnings.module.css", () => {
  const dir = path.resolve(__dirname);
  const css = readFileSync(path.join(dir, "earnings.module.css"), "utf8");

  it.each(["EarningsView.tsx", "EarningsTypeTabs.tsx", "EarningsEmptyState.tsx"])(
    "defines every class used by %s",
    (file) => {
      const source = readFileSync(path.join(dir, file), "utf8");
      const used = [...new Set([...source.matchAll(/\bstyles\.(\w+)/g)].map((m) => m[1]))];
      const missing = used.filter((name) => !new RegExp(`\\.${name}\\b`).test(css));
      expect(missing).toEqual([]);
    },
  );
});
