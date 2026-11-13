import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { makeBranch } from "@/features/branches/presentation/test-fixtures";
import { getStrings } from "@/shared/i18n/get-strings";

const state = vi.hoisted(() => ({
  locale: "en" as "en" | "ar",
  sessionKind: "active",
  vendorType: "clinic",
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("@/shared/preferences/PreferencesContext", async () => {
  const { getStrings: load } = await import("@/shared/i18n/get-strings");
  return {
    useStrings: () => load(state.locale),
    usePreferences: () => ({ locale: state.locale, dir: state.locale === "ar" ? "rtl" : "ltr" }),
  };
});
vi.mock("@/features/vendor/presentation/PortalSessionContext", () => ({
  usePortalSession: () => ({
    sessionKind: state.sessionKind,
    profile: { vendorType: state.vendorType },
    user: { uid: "uid1" },
  }),
}));
vi.mock("@/features/branches/application/branches.api", () => ({
  listBranches: vi.fn(),
  getBranchDeals: vi.fn(),
  createBranch: vi.fn(),
  updateBranch: vi.fn(),
  setBranchStatus: vi.fn(),
}));

import { BranchesSection, BranchList } from "@/features/branches/presentation/BranchesSection";
import { PendingBranchesHint } from "@/features/branches/presentation/PendingBranchesHint";

const en = getStrings("en");
const ar = getStrings("ar");
const noop = () => {};

function renderList(props: Partial<Parameters<typeof BranchList>[0]> = {}) {
  return renderToStaticMarkup(
    <BranchList
      branches={[]}
      deals={{}}
      strings={en}
      locale="en"
      readOnly={false}
      onAdd={noop}
      onEdit={noop}
      onArchive={noop}
      onRestore={noop}
      {...props}
    />,
  );
}

beforeEach(() => {
  state.locale = "en";
  state.sessionKind = "active";
  state.vendorType = "clinic";
});

describe("BranchesSection", () => {
  it("starts with the shimmer skeleton, not a spinner", () => {
    const html = renderToStaticMarkup(<BranchesSection />);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain(`aria-label="${en.common.loading}"`);
  });
});

describe("BranchList", () => {
  it("shows the empty state and the add button", () => {
    const html = renderList();
    expect(html).toContain(en.branches.emptyTitle);
    expect(html).toContain(en.branches.emptyDescription);
    expect(html).toContain('data-testid="empty-state-art"');
    expect(html).toContain(en.branches.add);
  });

  it("keeps the empty state without an add action when read only", () => {
    const html = renderList({ readOnly: true });
    expect(html).toContain(en.branches.emptyTitle);
    expect(html).not.toContain(en.branches.add);
  });

  it("gives long branch names a tooltip and a text status badge", () => {
    const name = "Heliopolis".repeat(8);
    const html = renderList({ branches: [makeBranch({ name })] });
    expect(html).toContain(`title="${name}"`);
    expect(html).toContain('data-tone="success"');
    expect(html).toContain(`aria-label="${en.branches.view} ${name}"`);
  });

  it("renders cards with service count, home visit badge, deal and detail link", () => {
    const html = renderList({
      branches: [
        makeBranch({
          serviceCount: 3,
          homeVisit: { enabled: true, feePiastres: 15000, radiusMeters: 3000 },
        }),
      ],
      deals: {
        b1: { source: "vendorDeal", type: "both", fixedFeePerOrderPiastres: 1000, percentage: 8 },
      },
    });
    expect(html).toContain("Nasr City");
    expect(html).toContain("3 services");
    expect(html).toContain(en.branches.homeVisitBadge);
    expect(html).toContain(en.deals.branch.source.vendorDeal);
    expect(html).toContain("10.00 EGP plus 8% per order");
    expect(html).toContain('href="/branches/b1"');
    expect(html).toContain(en.branches.archive);
  });

  it("lists archived branches separately with restore", () => {
    const html = renderList({ branches: [makeBranch({ status: "archived" })] });
    expect(html).toContain(en.branches.archivedTitle);
    expect(html).toContain(en.branches.restore);
    expect(html).toContain(en.branches.emptyTitle);
  });

  it("uses the singular for one service", () => {
    const html = renderList({ branches: [makeBranch({ serviceCount: 1 })] });
    expect(html).toContain(en.branches.serviceCountOne);
  });

  it("disables add at the 20 branch limit", () => {
    const branches = Array.from({ length: 20 }, (_, i) => makeBranch({ branchId: `b${i}` }));
    const html = renderList({ branches });
    expect(html).toContain(en.branches.limitReached);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Add branch<\/button>/);
  });

  it("is read only for suspended accounts", () => {
    const html = renderList({ branches: [makeBranch()], readOnly: true });
    expect(html).toContain(en.branches.readOnlyHint);
    expect(html).not.toContain(en.branches.add);
    expect(html).not.toContain(en.branches.edit);
    expect(html).not.toContain(en.branches.archive);
  });

  it("renders Arabic copy", () => {
    const html = renderList({ strings: ar, branches: [makeBranch()] });
    expect(html).toContain(ar.branches.title);
    expect(html).toContain(ar.branches.view);
  });

  it("shows the deal fee as amount then unit with isolated figures in Arabic", () => {
    const html = renderList({
      strings: ar,
      locale: "ar",
      branches: [makeBranch()],
      deals: {
        b1: { source: "vendorDeal", type: "fixed", fixedFeePerOrderPiastres: 1000, percentage: 0 },
      },
    });
    expect(html).toContain("\u206610.00\u2069 ج.م");
    expect(html).not.toMatch(/[٠-٩]/);
  });
});

describe("PendingBranchesHint", () => {
  it.each(["pending", "rejected"])("shows the hint to a %s clinic", (kind) => {
    state.sessionKind = kind;
    expect(renderToStaticMarkup(<PendingBranchesHint />)).toContain(en.branches.pendingHint);
  });

  it("is hidden for active providers and for stores", () => {
    expect(renderToStaticMarkup(<PendingBranchesHint />)).toBe("");
    state.sessionKind = "pending";
    state.vendorType = "store";
    expect(renderToStaticMarkup(<PendingBranchesHint />)).toBe("");
  });

  it("links to branches when asked", () => {
    state.sessionKind = "pending";
    expect(renderToStaticMarkup(<PendingBranchesHint showLink />)).toContain('href="/branches"');
  });
});
