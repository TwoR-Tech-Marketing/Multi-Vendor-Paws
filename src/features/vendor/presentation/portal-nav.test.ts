import { describe, expect, it } from "vitest";

import {
  getPortalSidebarNavItems,
  resolvePortalPageMeta,
} from "@/features/vendor/presentation/portal-nav";
import { getStrings } from "@/shared/i18n/get-strings";

const strings = getStrings("en");

/** The store sidebar exactly as it was before S1.7. */
const STORE_SIDEBAR_BEFORE_S17 = [
  { id: "dashboard", href: "/dashboard", label: "Dashboard", icon: "/portal-nav/nav-dashboard.svg", requiresActiveAccount: false },
  { id: "products", href: "/products", label: "Products", icon: "/portal-nav/nav-inventory.svg", requiresActiveAccount: true },
  { id: "orders", href: "/orders", label: "Orders", icon: "/portal-nav/nav-orders.svg", requiresActiveAccount: true },
  { id: "earnings", href: "/earnings", label: "Earnings", icon: "/portal-nav/nav-reports.svg", requiresActiveAccount: true },
  { id: "settings", href: "/settings", label: "Settings", icon: "/portal-nav/nav-settings.svg", requiresActiveAccount: false },
].map((item) => ({ ...item, comingSoon: false }));

const COUPONS_ITEM = {
  id: "coupons",
  href: "/coupons",
  label: "Coupons",
  icon: "/portal-nav/nav-coupons.svg",
  requiresActiveAccount: true,
  comingSoon: false,
};

/** The store sidebar keeps every earlier item, with Coupons before Settings. */
const STORE_SIDEBAR = [...STORE_SIDEBAR_BEFORE_S17.slice(0, 4), COUPONS_ITEM, STORE_SIDEBAR_BEFORE_S17[4]];

describe("getPortalSidebarNavItems", () => {
  it("keeps today's store sidebar plus Coupons for store vendors and vendors without a type", () => {
    expect(getPortalSidebarNavItems(strings, "store")).toEqual(STORE_SIDEBAR);
    expect(getPortalSidebarNavItems(strings)).toEqual(STORE_SIDEBAR);
    expect(getPortalSidebarNavItems(strings, null)).toEqual(STORE_SIDEBAR);
    expect(getPortalSidebarNavItems(strings, "")).toEqual(STORE_SIDEBAR);
  });

  it.each(["clinic", "groomer"])(
    "shows visible branches and comingSoon appointments for %s",
    (type) => {
      const items = getPortalSidebarNavItems(strings, type);
      expect(items.map((item) => item.id)).toEqual([
        "dashboard",
        "branches",
        "appointments",
        "earnings",
        "coupons",
        "settings",
      ]);
      expect(items.find((item) => item.id === "coupons")).toEqual(COUPONS_ITEM);
      const branches = items.find((item) => item.id === "branches");
      expect(branches).toMatchObject({
        href: "/branches",
        comingSoon: false,
        requiresActiveAccount: false,
      });
      expect(items.find((item) => item.id === "appointments")).toMatchObject({
        href: null,
        comingSoon: true,
        requiresActiveAccount: true,
      });
      expect(items.find((item) => item.id === "earnings")?.href).toBe("/earnings");
    },
  );

  it("gives branch pages their own title", () => {
    expect(resolvePortalPageMeta("/branches", strings).title).toBe(strings.pages.branches.title);
    expect(resolvePortalPageMeta("/branches/b1", strings).title).toBe(
      strings.pages.branches.detailTitle,
    );
  });

  it("gives coupon pages their own title", () => {
    expect(resolvePortalPageMeta("/coupons", strings).title).toBe(strings.pages.coupons.title);
    expect(resolvePortalPageMeta("/coupons/uid1_SAVE10", strings).title).toBe(
      strings.pages.coupons.detailTitle,
    );
  });

  it("shows a comingSoon telehealth item for doctors", () => {
    const items = getPortalSidebarNavItems(strings, "doctor");
    expect(items.map((item) => item.id)).toEqual(["dashboard", "telehealth", "earnings", "settings"]);
    expect(items[1]).toMatchObject({ comingSoon: true, href: null, label: "Telehealth" });
  });

  it("never shows store items to providers or unknown types", () => {
    for (const type of ["clinic", "groomer", "doctor", "hotel"]) {
      const ids = getPortalSidebarNavItems(strings, type).map((item) => item.id);
      expect(ids).not.toContain("products");
      expect(ids).not.toContain("orders");
    }
    for (const type of ["doctor", "hotel"]) {
      const ids = getPortalSidebarNavItems(strings, type).map((item) => item.id);
      expect(ids).not.toContain("coupons");
    }
    expect(getPortalSidebarNavItems(strings, "hotel").map((item) => item.id)).toEqual([
      "dashboard",
      "settings",
    ]);
  });

  it("uses the Arabic labels", () => {
    const ar = getStrings("ar");
    expect(getPortalSidebarNavItems(ar, "clinic")[1].label).toBe(ar.nav.branches);
  });
});
