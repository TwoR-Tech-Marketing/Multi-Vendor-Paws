import { describe, expect, it } from "vitest";

import { getPortalSidebarNavItems } from "@/features/vendor/presentation/portal-nav";
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

describe("getPortalSidebarNavItems", () => {
  it("keeps today's store sidebar for store vendors and vendors without a type", () => {
    expect(getPortalSidebarNavItems(strings, "store")).toEqual(STORE_SIDEBAR_BEFORE_S17);
    expect(getPortalSidebarNavItems(strings)).toEqual(STORE_SIDEBAR_BEFORE_S17);
    expect(getPortalSidebarNavItems(strings, null)).toEqual(STORE_SIDEBAR_BEFORE_S17);
    expect(getPortalSidebarNavItems(strings, "")).toEqual(STORE_SIDEBAR_BEFORE_S17);
  });

  it.each(["clinic", "groomer"])("shows comingSoon branches and appointments for %s", (type) => {
    const items = getPortalSidebarNavItems(strings, type);
    expect(items.map((item) => item.id)).toEqual([
      "dashboard",
      "branches",
      "appointments",
      "earnings",
      "settings",
    ]);
    for (const item of items.filter((i) => i.id === "branches" || i.id === "appointments")) {
      expect(item.comingSoon).toBe(true);
      expect(item.href).toBe(null);
    }
    expect(items.find((item) => item.id === "earnings")?.href).toBe("/earnings");
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
