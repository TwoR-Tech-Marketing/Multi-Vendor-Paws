import { readFileSync } from "node:fs";
import path from "node:path";

import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BranchDealRow, VendorDealView } from "@/features/deals/domain/types";
import { formatEgp } from "@/features/products/domain/currency";
import { getStrings } from "@/shared/i18n/get-strings";

const state = vi.hoisted(() => ({ locale: "en" as "en" | "ar", vendorType: "clinic" }));

vi.mock("@/shared/preferences/PreferencesContext", async () => {
  const { getStrings: load } = await import("@/shared/i18n/get-strings");
  return {
    useStrings: () => load(state.locale),
    usePreferences: () => ({ locale: state.locale, dir: state.locale === "ar" ? "rtl" : "ltr" }),
  };
});
vi.mock("@/features/vendor/presentation/PortalSessionContext", () => ({
  usePortalSession: () => ({ profile: { vendorType: state.vendorType } }),
}));
vi.mock("@/features/deals/application/deals.api", () => ({
  fetchVendorDeal: vi.fn(),
}));

import { DealPageSkeleton } from "@/features/deals/presentation/DealPageSkeleton";
import { DealSection } from "@/features/deals/presentation/DealSection";
import { DealView, type DealViewProps } from "@/features/deals/presentation/DealView";

const en = getStrings("en");
const ar = getStrings("ar");

// 2 Dec 2026 00:00 in Cairo (UTC+2 in winter).
const UPCOMING_FROM = Date.UTC(2026, 11, 1, 22);

const DEFAULT_CURRENT = {
  source: "default" as const,
  type: "percentage" as const,
  fixedFeePerOrderPiastres: 0,
  percentage: 10,
  feeBase: "items" as const,
};

function view(overrides: Partial<VendorDealView> = {}): VendorDealView {
  return {
    vendorType: "store",
    defaultPercent: 10,
    feeModel: "items_only",
    itemsOnlyFromMs: Date.UTC(2026, 10, 1),
    vendorDeal: null,
    effectiveFromMs: null,
    dealActive: false,
    applyToAllBranches: null,
    current: DEFAULT_CURRENT,
    branches: [],
    ...overrides,
  };
}

function branch(overrides: Partial<BranchDealRow> = {}): BranchDealRow {
  return {
    branchId: "b1",
    name: "Maadi",
    status: "active",
    deal: { source: "branch", type: "fixed", fixedFeePerOrderPiastres: 2000, percentage: 0 },
    ...overrides,
  };
}

function render(overrides: Partial<DealViewProps> = {}): string {
  return renderToStaticMarkup(
    <DealView
      strings={en}
      locale="en"
      deal={view()}
      isLoading={false}
      error={null}
      onRetry={() => {}}
      {...overrides}
    />,
  );
}

function decode(html: string): string {
  return html.replaceAll("&#x27;", "'").replaceAll("&amp;", "&");
}

beforeEach(() => {
  state.locale = "en";
  state.vendorType = "clinic";
});

describe("DealSection", () => {
  it("starts with the shimmer skeleton, not a spinner", () => {
    const html = renderToStaticMarkup(<DealSection />);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain(`aria-label="${en.common.loading}"`);
    expect(html).not.toContain(en.deals.current);
  });
});

describe("DealPageSkeleton", () => {
  it("labels the route skeleton with the localized loading text", () => {
    state.locale = "ar";
    const html = renderToStaticMarkup(<DealPageSkeleton />);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain(`aria-label="${ar.common.loading}"`);
  });
});

describe("DealView current fee", () => {
  it("shows the standard rate note with the default percent when there is no deal", () => {
    const html = decode(render({ deal: view({ defaultPercent: 12.5, current: { ...DEFAULT_CURRENT, percentage: 12.5 } }) }));
    expect(html).toContain(en.deals.current);
    expect(html).toContain(en.deals.source.default);
    expect(html).toContain(en.deals.defaultNote.replace("{percent}", "12.5"));
    expect(html).toContain(en.deals.type.percentage);
    expect(html).toContain("12.5%");
    expect(html).toContain(en.deals.itemsOnlyNote);
    expect(html).not.toContain(en.deals.fixedFee);
  });

  it("puts the fee base note before the default note", () => {
    const html = decode(render());
    const baseAt = html.indexOf(en.deals.itemsOnlyNote);
    const defaultAt = html.indexOf(en.deals.defaultNote.replace("{percent}", "10"));
    expect(baseAt).toBeGreaterThan(-1);
    expect(defaultAt).toBeGreaterThan(baseAt);
  });

  it("shows an account deal with fixed fee and percentage, items only", () => {
    const html = decode(
      render({
        deal: view({
          vendorDeal: { type: "both", fixedFeePerOrderPiastres: 1500, percentage: 8 },
          dealActive: true,
          applyToAllBranches: true,
          current: {
            source: "vendor",
            type: "both",
            fixedFeePerOrderPiastres: 1500,
            percentage: 8,
            feeBase: "items",
          },
        }),
      }),
    );
    expect(html).toContain(en.deals.source.vendor);
    expect(html).toContain(en.deals.type.both);
    expect(html).toContain(en.deals.fixedFee);
    expect(html).toContain(formatEgp(1500));
    expect(html).toContain("8%");
    expect(html).toContain(en.deals.itemsOnlyNote);
    expect(html).not.toContain(en.deals.defaultNote.split(":")[0]);
    expect(html).not.toContain(en.deals.upcoming);
  });

  it("shows a fixed fee deal without a percentage row", () => {
    const html = decode(
      render({
        deal: view({
          vendorDeal: { type: "fixed", fixedFeePerOrderPiastres: 2500, percentage: 0 },
          dealActive: true,
          current: {
            source: "vendor",
            type: "fixed",
            fixedFeePerOrderPiastres: 2500,
            percentage: 0,
            feeBase: "items",
          },
        }),
      }),
    );
    expect(html).toContain(en.deals.type.fixed);
    expect(html).toContain(formatEgp(2500));
    expect(html).not.toContain(`<dt>${en.deals.percentage}</dt>`);
  });

  it("shows the legacy rate on the order total before the cutover", () => {
    const html = decode(
      render({
        deal: view({
          feeModel: "legacy",
          itemsOnlyFromMs: null,
          current: {
            source: "legacy",
            type: "percentage",
            fixedFeePerOrderPiastres: 0,
            percentage: 7,
            feeBase: "order_total",
          },
        }),
      }),
    );
    expect(html).toContain(en.deals.source.legacy);
    expect(html).toContain(en.deals.legacyNote);
    expect(html).toContain("7%");
    expect(html).not.toContain(en.deals.itemsOnlyNote);
  });
});

describe("DealView upcoming deal", () => {
  it("shows the upcoming card with its Cairo start date when the deal is not active", () => {
    const html = decode(
      render({
        deal: view({
          vendorDeal: { type: "percentage", fixedFeePerOrderPiastres: 0, percentage: 6 },
          effectiveFromMs: UPCOMING_FROM,
          dealActive: false,
        }),
      }),
    );
    expect(html).toContain(en.deals.upcoming);
    expect(html).toContain(en.deals.upcomingFrom.replace("{date}", "2 Dec 2026"));
    expect(html).toContain("6%");
    expect(html).toContain(en.deals.source.default);
  });

  it("hides the upcoming card when there is no deal or the deal is active", () => {
    expect(render()).not.toContain(en.deals.upcoming);
    const active = render({
      deal: view({
        vendorDeal: { type: "percentage", fixedFeePerOrderPiastres: 0, percentage: 6 },
        dealActive: true,
        current: { ...DEFAULT_CURRENT, source: "vendor", percentage: 6 },
      }),
    });
    expect(active).not.toContain(en.deals.upcoming);
  });
});

describe("DealView branches", () => {
  it("lists each clinic branch with status, source and fee", () => {
    const html = decode(
      render({
        deal: view({
          vendorType: "clinic",
          branches: [
            branch(),
            branch({
              branchId: "b2",
              name: "Zamalek",
              status: "archived",
              deal: { source: "apply_all", type: "both", fixedFeePerOrderPiastres: 1000, percentage: 5 },
            }),
            branch({
              branchId: "b3",
              name: "Dokki",
              deal: { source: "vendor", type: "percentage", fixedFeePerOrderPiastres: 0, percentage: 9 },
            }),
            branch({
              branchId: "b4",
              name: "Heliopolis",
              deal: { source: "default", type: "percentage", fixedFeePerOrderPiastres: 0, percentage: 10 },
            }),
          ],
        }),
      }),
    );
    expect(html).toContain(en.deals.branches);
    for (const label of Object.values(en.deals.columns)) expect(html).toContain(label);
    for (const name of ["Maadi", "Zamalek", "Dokki", "Heliopolis"]) expect(html).toContain(name);
    expect(html).toContain(en.deals.source.branch);
    expect(html).toContain(en.deals.source.applyAll);
    expect(html).toContain(en.deals.source.vendor);
    expect(html).toContain(en.deals.source.default);
    expect(html).toContain(en.branches.archivedBadge);
    expect(html).toContain(en.deals.branch.fixed.replace("{amount}", formatEgp(2000)));
    expect(html).toContain(
      en.deals.branch.both.replace("{amount}", formatEgp(1000)).replace("{percent}", "5"),
    );
    expect(html).toContain(en.deals.branch.percentage.replace("{percent}", "9"));
  });

  it("shows the empty branches message for a groomer without branches", () => {
    const html = decode(render({ deal: view({ vendorType: "groomer", branches: [] }) }));
    expect(html).toContain(en.deals.branchesEmpty);
  });

  it("has no branch section for store and doctor", () => {
    expect(render({ deal: view({ vendorType: "store" }) })).not.toContain(en.deals.branches);
    expect(render({ deal: view({ vendorType: "doctor" }) })).not.toContain(en.deals.branches);
  });
});

describe("DealView states and links", () => {
  it("links to the earnings and statement pages", () => {
    const html = render();
    expect(html).toContain('href="/earnings"');
    expect(html).toContain('href="/earnings/payouts"');
    expect(html).toContain(en.deals.viewStatement);
    expect(html).toContain(en.deals.viewEarnings);
  });

  it("shows the skeleton while loading, with branch rows for clinic", () => {
    const store = render({ isLoading: true, vendorType: "store" });
    const clinic = render({ isLoading: true, vendorType: "clinic" });
    expect(store).toContain('aria-busy="true"');
    expect(store).not.toContain(en.deals.current);
    expect(clinic.length).toBeGreaterThan(store.length);
  });

  it("shows the error with a retry button when loading failed", () => {
    const html = decode(render({ deal: null, error: en.deals.loadError }));
    expect(html).toContain('role="alert"');
    expect(html).toContain(en.deals.loadError);
    expect(html).toContain(en.common.retry);
    expect(html).not.toContain(en.deals.current);
  });

  it("renders Arabic copy with Western digits", () => {
    const html = render({
      strings: ar,
      locale: "ar",
      deal: view({
        vendorType: "clinic",
        vendorDeal: { type: "both", fixedFeePerOrderPiastres: 1500, percentage: 8 },
        effectiveFromMs: UPCOMING_FROM,
        dealActive: false,
        branches: [branch()],
      }),
    });
    expect(html).toContain(ar.deals.current);
    expect(html).toContain(ar.deals.upcoming);
    expect(html).toContain(ar.deals.source.default);
    expect(html).toContain(ar.deals.source.branch);
    expect(html).toContain(ar.deals.defaultNote.replace("{percent}", "10"));
    expect(html).toMatch(/2026/);
    expect(html).not.toMatch(/[٠-٩]/);
  });

  it("uses no subscription wording in either language", () => {
    for (const strings of [en, ar]) {
      const copy = JSON.stringify(strings.deals).toLowerCase();
      expect(copy).not.toContain("subscription");
      expect(copy).not.toContain("اشتراك");
    }
  });
});

describe("deals.module.css", () => {
  const dir = path.resolve(__dirname);
  const css = readFileSync(path.join(dir, "deals.module.css"), "utf8");

  it.each([
    "DealView.tsx",
    "DealSkeleton.tsx",
    "DealCurrentCard.tsx",
    "DealUpcomingCard.tsx",
    "DealBranchesTable.tsx",
    "DealTermsList.tsx",
  ])("defines every class used by %s", (file) => {
    const source = readFileSync(path.join(dir, file), "utf8");
    const used = [...new Set([...source.matchAll(/\bstyles\.(\w+)/g)].map((m) => m[1]))];
    const missing = used.filter((name) => !new RegExp(`\\.${name}\\b`).test(css));
    expect(missing).toEqual([]);
  });
});
