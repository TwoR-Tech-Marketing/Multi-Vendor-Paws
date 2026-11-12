import { describe, expect, it } from "vitest";

import {
  getPortalSidebarNavItems,
  resolvePortalNavId,
  resolvePortalPageMeta,
} from "@/features/vendor/presentation/portal-nav";
import { Routes } from "@/constants/routes";
import { getStrings } from "@/shared/i18n/get-strings";

const strings = getStrings("en");

/** The store sidebar exactly as it was before vendor types. */
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
    "shows visible branches and linked appointments for %s",
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
        href: Routes.vendor.appointments,
        comingSoon: false,
        requiresActiveAccount: true,
        label: strings.nav.appointments,
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

  it("gives the branch availability page its own title under branches", () => {
    expect(resolvePortalPageMeta("/branches/b1/availability", strings).title).toBe(
      strings.pages.availability.title,
    );
    expect(resolvePortalPageMeta("/branches/b1/availability/", strings).subtitle).toBe(
      strings.pages.availability.subtitle,
    );
    expect(resolvePortalNavId("/branches/b1/availability")).toBe("branches");
  });

  it.each(["clinic", "groomer"])("keeps availability out of the %s sidebar (branch sub-screen)", (type) => {
    const ids = getPortalSidebarNavItems(strings, type).map((item) => item.id as string);
    expect(ids).not.toContain("availability");
  });

  it("gives coupon pages their own title", () => {
    expect(resolvePortalPageMeta("/coupons", strings).title).toBe(strings.pages.coupons.title);
    expect(resolvePortalPageMeta("/coupons/uid1_SAVE10", strings).title).toBe(
      strings.pages.coupons.detailTitle,
    );
  });

  it("gives the statement page its own title under earnings", () => {
    expect(resolvePortalPageMeta("/earnings/payouts", strings).title).toBe(
      strings.pages.statement.title,
    );
    expect(resolvePortalNavId("/earnings/payouts")).toBe("earnings");
  });

  it("gives the deal page its own title under earnings", () => {
    expect(resolvePortalPageMeta("/earnings/deal", strings).title).toBe(strings.pages.deal.title);
    expect(resolvePortalNavId("/earnings/deal")).toBe("earnings");
  });

  it("links the telehealth item for doctors without an active lock", () => {
    const items = getPortalSidebarNavItems(strings, "doctor");
    expect(items.map((item) => item.id)).toEqual(["dashboard", "telehealth", "earnings", "settings"]);
    expect(items[1]).toMatchObject({
      comingSoon: false,
      href: Routes.vendor.telehealth,
      label: "Telehealth",
      requiresActiveAccount: false,
    });
    const ar = getStrings("ar");
    expect(getPortalSidebarNavItems(ar, "doctor")[1].label).toBe(ar.nav.telehealth);
  });

  it("never shows telehealth to other types", () => {
    for (const type of ["store", "clinic", "groomer", "hotel"]) {
      const ids = getPortalSidebarNavItems(strings, type).map((item) => item.id);
      expect(ids).not.toContain("telehealth");
    }
  });

  it("resolves the telehealth inbox and chat headers", () => {
    expect(resolvePortalNavId(Routes.vendor.telehealth)).toBe("telehealth");
    expect(resolvePortalPageMeta(Routes.vendor.telehealth, strings).title).toBe(
      strings.pages.telehealth.title,
    );
    expect(resolvePortalPageMeta(Routes.vendor.telehealthChat("s1"), strings).title).toBe(
      strings.pages.telehealth.chatTitle,
    );
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

  it("resolves the appointments inbox and detail headers", () => {
    expect(resolvePortalNavId(Routes.vendor.appointments)).toBe("appointments");
    expect(resolvePortalNavId(Routes.vendor.appointmentDetail("a1"))).toBe("appointments");
    expect(resolvePortalPageMeta(Routes.vendor.appointments, strings).title).toBe(
      strings.pages.appointments.title,
    );
    expect(resolvePortalPageMeta(Routes.vendor.appointmentDetail("a1"), strings).title).toBe(
      strings.pages.appointments.detailTitle,
    );
  });

  it("never shows appointments to store, doctor or unknown types", () => {
    for (const type of ["store", "doctor", "hotel"]) {
      const ids = getPortalSidebarNavItems(strings, type).map((item) => item.id as string);
      expect(ids).not.toContain("appointments");
    }
  });

  it("uses the Arabic labels", () => {
    const ar = getStrings("ar");
    expect(getPortalSidebarNavItems(ar, "clinic")[1].label).toBe(ar.nav.branches);
  });
});
