import { readFileSync } from "node:fs";
import path from "node:path";

import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { VendorProfile } from "@/features/auth/domain/types";
import { getStrings } from "@/shared/i18n/get-strings";

const state = vi.hoisted(() => ({
  locale: "en" as "en" | "ar",
  pathname: "/orders",
  sessionKind: "active",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => state.pathname,
  useRouter: () => ({ back: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/shared/preferences/PreferencesContext", async () => {
  const { getStrings: load } = await import("@/shared/i18n/get-strings");
  return {
    useStrings: () => load(state.locale),
    usePreferences: () => ({ locale: state.locale, dir: state.locale === "ar" ? "rtl" : "ltr" }),
  };
});
vi.mock("@/features/vendor/presentation/PortalSessionContext", () => ({
  usePortalSession: () => ({
    isActiveVendor: state.sessionKind === "active",
    isLoggingOut: false,
    isTestAccount: false,
    profile: { vendorType: "store" },
    storeBranding: { storeName: "Paws Corner", logoUrl: null },
  }),
}));
vi.mock("@/features/vendor/presentation/PortalSignOutContext", () => ({
  usePortalSignOut: () => ({ requestSignOut: vi.fn() }),
}));
vi.mock("@/features/notifications/application/notifications.api", () => ({
  fetchVendorUnreadCount: vi.fn(() => new Promise(() => {})),
  NOTIFICATIONS_CHANGED_EVENT: "x",
}));

import {
  AccountStatusBanner,
  resolveAccountStatusBanner,
} from "@/features/vendor/presentation/AccountStatusBanner";
import { PortalHeaderActionsProvider } from "@/features/vendor/presentation/PortalHeaderActionsContext";
import { PortalSidebar } from "@/features/vendor/presentation/PortalSidebar";
import { PortalTopbar } from "@/features/vendor/presentation/PortalTopbar";

const en = getStrings("en");
const ar = getStrings("ar");

const PROFILE: VendorProfile = {
  vendorId: "v1",
  ownerName: "Mai",
  email: "owner@example.com",
  storeName: "Paws Corner",
  status: "suspended",
  vendorType: "store",
  restrictionReason: "Order quality review",
  suspensionMode: "view_only",
  restrictionExpiresAt: new Date("2026-12-01T10:00:00Z"),
  rejectionReason: "The photo is not readable.",
};

function renderTopbar(showBack = true) {
  return renderToStaticMarkup(
    <PortalHeaderActionsProvider>
      <PortalTopbar
        title={en.pages.orders.title}
        subtitle={en.pages.orders.subtitle}
        showBack={showBack}
        onMenuOpen={() => {}}
        isMenuOpen={false}
      />
    </PortalHeaderActionsProvider>,
  );
}

beforeEach(() => {
  state.locale = "en";
  state.pathname = "/orders";
  state.sessionKind = "active";
});

describe("PortalTopbar", () => {
  it("renders one h1 with the title and a labelled back, bell and profile control", () => {
    const html = renderTopbar();
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain(`>${en.pages.orders.title}</h1>`);
    expect(html).toContain(`aria-label="${en.portal.goBack}"`);
    expect(html).toContain(`aria-label="${en.notifications.open}"`);
    expect(html).toContain(`aria-label="${en.portal.openProfile}"`);
    expect(html).toContain(`aria-label="${en.portal.openMenu}"`);
  });

  it("hides the back control without history", () => {
    expect(renderTopbar(false)).not.toContain(`aria-label="${en.portal.goBack}"`);
  });
});

describe("PortalSidebar", () => {
  it("labels the navigation in the active language and marks the current page", () => {
    state.locale = "ar";
    const html = renderToStaticMarkup(<PortalSidebar isOpen={false} onClose={() => {}} />);
    expect(html).toContain(`aria-label="${ar.portal.navigationLabel}"`);
    expect(html).toContain('aria-current="page"');
    expect(html).toContain(ar.nav.orders);
  });

  it("disables locked items for accounts that are not active", () => {
    state.sessionKind = "pending";
    const html = renderToStaticMarkup(<PortalSidebar isOpen={false} onClose={() => {}} />);
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain(`title="${en.nav.lockedHint}"`);
  });
});

describe("AccountStatusBanner", () => {
  it.each([
    ["active", "success", en.accountStatus.activeTitle],
    ["pending", "warning", en.accountStatus.pendingBannerTitle],
    ["rejected", "danger", en.accountStatus.rejectedTitle],
    ["suspended", "hold", en.accountStatus.suspended],
    ["banned", "danger", en.accountStatus.bannedTitle],
  ] as const)("maps %s to the %s tone", (kind, tone, title) => {
    const view = resolveAccountStatusBanner(en, kind, PROFILE, "en");
    expect(view.tone).toBe(tone);
    expect(view.title).toBe(title);
  });

  it("lists the suspension mode, reason and restore date as labelled lines", () => {
    const view = resolveAccountStatusBanner(en, "suspended", PROFILE, "en");
    expect(view.details.map((d) => d.label)).toEqual([
      en.accountStatus.suspensionModeLabel,
      en.accountStatus.reason,
      en.accountStatus.accessRestored,
    ]);
    expect(view.details[2].value).toMatch(/2026/);
  });

  it("renders the title as a heading and the status as a text badge, in Arabic too", () => {
    state.locale = "ar";
    const html = renderToStaticMarkup(
      <AccountStatusBanner sessionKind="rejected" profile={PROFILE} />,
    );
    expect(html).toContain(`>${ar.accountStatus.rejectedTitle}</h2>`);
    expect(html).toContain(`>${ar.accountStatus.rejected}</span>`);
    expect(html).toContain(PROFILE.rejectionReason as string);
    expect(html).toContain('role="status"');
  });
});

describe("chrome styles", () => {
  const read = (file: string) =>
    readFileSync(path.join(__dirname, file), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

  it.each(["portal.module.css", "sidebar.module.css"])(
    "%s uses theme tokens, gates hover and respects reduced motion",
    (file) => {
      const css = read(file);
      expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(css).not.toMatch(/transition(-property)?:\s*all\b/);
      expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
      const hoverOutsideGate = css
        .split(/@media \(hover: hover\) and \(pointer: fine\)/)[0]
        .match(/:hover/);
      expect(hoverOutsideGate).toBeNull();
      expect(css).toContain(":focus-visible");
    },
  );

  it("keeps chrome motion within the theme durations", () => {
    for (const file of ["portal.module.css", "sidebar.module.css"]) {
      const css = read(file);
      expect(css).not.toMatch(/\d+(\.\d+)?m?s\s+(ease|linear|cubic)/);
    }
  });

  it("slides the drawer from the start edge and mirrors it in RTL", () => {
    const css = read("sidebar.module.css");
    expect(css).toContain("inset-inline-start: 0");
    expect(css).toMatch(/\[dir="rtl"\] \.sidebar \{\s*transform: translateX\(100%\)/);
  });
});
