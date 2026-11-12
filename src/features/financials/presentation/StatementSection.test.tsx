import { readFileSync } from "node:fs";
import path from "node:path";

import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { StatementPeriod, VendorStatement } from "@/features/financials/domain/statement-types";
import { formatEgp } from "@/features/products/domain/currency";
import { getStrings } from "@/shared/i18n/get-strings";

const state = vi.hoisted(() => ({ locale: "en" as "en" | "ar" }));

vi.mock("@/shared/preferences/PreferencesContext", async () => {
  const { getStrings: load } = await import("@/shared/i18n/get-strings");
  return {
    useStrings: () => load(state.locale),
    usePreferences: () => ({ locale: state.locale, dir: state.locale === "ar" ? "rtl" : "ltr" }),
  };
});
vi.mock("@/features/financials/application/statement.api", () => ({
  fetchVendorStatement: vi.fn(),
}));

import { StatementSection } from "@/features/financials/presentation/StatementSection";
import { StatementView, type StatementViewProps } from "@/features/financials/presentation/StatementView";

const en = getStrings("en");
const ar = getStrings("ar");

// October 2026 in Cairo, which is on summer time (UTC+3) until the last Thursday of October.
const OCT_START = Date.UTC(2026, 8, 30, 21);
const OCT_END = Date.UTC(2026, 9, 31, 22) - 1;

function period(overrides: Partial<StatementPeriod> = {}): StatementPeriod {
  return {
    periodKey: "M2026-10",
    startMs: OCT_START,
    endMs: OCT_END,
    closed: true,
    openingPiastres: 0,
    salesPiastres: 11000,
    feesPiastres: 1000,
    refundsPiastres: -500,
    adjustmentsPiastres: 200,
    payoutsPiastres: -9000,
    closingPiastres: 700,
    payouts: [
      {
        entryId: "payout_M2026-09",
        periodKey: "M2026-09",
        amountPiastres: 9000,
        transferReference: "TRX-001",
        paidAtMs: Date.UTC(2026, 9, 3, 10),
        createdAtMs: Date.UTC(2026, 9, 3, 11),
      },
    ],
    ...overrides,
  };
}

function statement(overrides: Partial<VendorStatement> = {}): VendorStatement {
  return { cycle: "monthly", currentBalancePiastres: 700, periods: [period()], ...overrides };
}

function render(overrides: Partial<StatementViewProps> = {}): string {
  return renderToStaticMarkup(
    <StatementView
      strings={en}
      locale="en"
      statement={statement()}
      isLoading={false}
      error={null}
      onRetry={() => {}}
      {...overrides}
    />,
  );
}

beforeEach(() => {
  state.locale = "en";
});

describe("StatementSection", () => {
  it("starts with the shimmer skeleton, not a spinner", () => {
    const html = renderToStaticMarkup(<StatementSection />);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain(`aria-label="${en.common.loading}"`);
    expect(html).not.toContain(en.statement.currentBalance);
  });
});

describe("StatementView", () => {
  it("shows the balance, cycle and every period column", () => {
    const html = render();
    expect(html).toContain(en.statement.currentBalance);
    expect(html).toContain(formatEgp(700));
    expect(html).toContain(en.statement.cycleLabel);
    expect(html).toContain(en.statement.cycle.monthly);
    for (const label of Object.values(en.statement.columns)) expect(html).toContain(label);
    expect(html).toContain(en.statement.period.closed);
  });

  it("shows Cairo period bounds with Western digits", () => {
    expect(render()).toContain("1 Oct 2026 to 31 Oct 2026");
  });

  it("signs fees, refunds and payouts as negative amounts", () => {
    const html = render();
    expect(html).toContain(formatEgp(11000));
    expect(html).toContain(formatEgp(-1000));
    expect(html).toContain(formatEgp(-500));
    expect(html).toContain(formatEgp(-9000));
    expect(formatEgp(-9000).startsWith("-")).toBe(true);
  });

  it("lists payouts with reference, paid date and amount", () => {
    const html = render();
    expect(html).toContain(en.statement.payout.title);
    expect(html).toContain("TRX-001");
    expect(html).toContain("3 Oct 2026");
  });

  it("marks an open period and omits the payouts table when there are none", () => {
    const html = render({
      statement: statement({ cycle: "weekly", periods: [period({ closed: false, payouts: [] })] }),
    });
    expect(html).toContain(en.statement.period.open);
    expect(html).toContain(en.statement.cycle.weekly);
    expect(html).not.toContain(en.statement.payout.title);
  });

  it("links to the deal page", () => {
    const html = render();
    expect(html).toContain('href="/earnings/deal"');
    expect(html).toContain(en.earnings.viewDeal);
  });

  it("shows the empty state for a statement without periods", () => {
    const html = render({ statement: statement({ currentBalancePiastres: 0, periods: [] }) });
    expect(html).toContain(en.statement.empty);
  });

  it("shows the error with a retry button when loading failed", () => {
    const html = render({ statement: null, error: en.statement.loadError });
    expect(html).toContain('role="alert"');
    expect(html).toContain(en.statement.loadError.replace("'", "&#x27;"));
    expect(html).toContain(en.common.retry);
  });

  it("shows the skeleton while loading", () => {
    const html = render({ isLoading: true });
    expect(html).toContain('aria-busy="true"');
    expect(html).not.toContain(en.statement.periodsTitle);
  });

  it("renders Arabic copy with Western digits", () => {
    const html = render({ strings: ar, locale: "ar" });
    expect(html).toContain(ar.statement.currentBalance);
    expect(html).toContain(ar.statement.columns.closing);
    expect(html).toContain(ar.statement.cycle.monthly);
    expect(html).toMatch(/2026/);
    expect(html).not.toMatch(/[٠-٩]/);
  });
});

describe("statement.module.css", () => {
  const dir = path.resolve(__dirname);
  const css = readFileSync(path.join(dir, "statement.module.css"), "utf8");

  it.each(["StatementView.tsx", "StatementSkeleton.tsx"])("defines every class used by %s", (file) => {
    const source = readFileSync(path.join(dir, file), "utf8");
    const used = [...new Set([...source.matchAll(/\bstyles\.(\w+)/g)].map((m) => m[1]))];
    const missing = used.filter((name) => !new RegExp(`\\.${name}\\b`).test(css));
    expect(missing).toEqual([]);
  });
});
