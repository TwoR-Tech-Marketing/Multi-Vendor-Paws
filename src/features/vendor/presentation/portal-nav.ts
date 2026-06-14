import { Routes } from "@/constants/routes";
import { portalNavAssets } from "@/features/vendor/presentation/portal-assets";
import type { AppStrings } from "@/shared/i18n/types";

export type PortalNavId =
  | "dashboard"
  | "profile"
  | "products"
  | "orders"
  | "earnings"
  | "settings"
  | "notifications";

export type PortalNavItem = {
  id: PortalNavId;
  href: string;
  label: string;
  icon: string;
  requiresActiveAccount: boolean;
};

export function getPortalSidebarNavItems(strings: AppStrings): PortalNavItem[] {
  return [
    {
      id: "dashboard",
      href: Routes.vendor.dashboard,
      label: strings.nav.dashboard,
      icon: portalNavAssets.navDashboard,
      requiresActiveAccount: false,
    },
    {
      id: "products",
      href: Routes.vendor.products,
      label: strings.nav.products,
      icon: portalNavAssets.navProducts,
      requiresActiveAccount: true,
    },
    {
      id: "orders",
      href: Routes.vendor.orders,
      label: strings.nav.orders,
      icon: portalNavAssets.navOrders,
      requiresActiveAccount: true,
    },
    {
      id: "earnings",
      href: Routes.vendor.earnings,
      label: strings.nav.earnings,
      icon: portalNavAssets.navEarnings,
      requiresActiveAccount: true,
    },
    {
      id: "settings",
      href: Routes.vendor.settings,
      label: strings.nav.settings,
      icon: portalNavAssets.navSettings,
      requiresActiveAccount: false,
    },
  ];
}

export type PortalPageMeta = {
  title: string;
  subtitle: string;
};

export function getPortalPageMeta(strings: AppStrings): Record<PortalNavId, PortalPageMeta> {
  return {
    dashboard: strings.pages.dashboard,
    profile: strings.pages.profile,
    products: strings.pages.products,
    orders: strings.pages.orders,
    earnings: strings.pages.earnings,
    settings: strings.pages.settings,
    notifications: strings.pages.notifications,
  };
}

export function resolvePortalNavId(pathname: string): PortalNavId {
  if (pathname.startsWith(Routes.vendor.profile)) return "profile";
  if (pathname.startsWith(Routes.vendor.settings)) return "settings";
  if (pathname.startsWith(Routes.vendor.notifications)) return "notifications";
  if (pathname.startsWith(Routes.vendor.products)) return "products";
  if (pathname.startsWith(Routes.vendor.orders)) return "orders";
  if (pathname.startsWith(Routes.vendor.earnings)) return "earnings";
  return "dashboard";
}

const PRODUCT_EDIT_PATH = /^\/products\/[^/]+\/edit\/?$/;

export function resolvePortalPageMeta(pathname: string, strings: AppStrings): PortalPageMeta {
  const normalizedPath = pathname.replace(/\/$/, "") || "/";

  if (normalizedPath === Routes.vendor.productNew) {
    return {
      title: strings.pages.products.newTitle,
      subtitle: strings.pages.products.newSubtitle,
    };
  }

  if (PRODUCT_EDIT_PATH.test(normalizedPath)) {
    return {
      title: strings.pages.products.editTitle,
      subtitle: strings.pages.products.editSubtitle,
    };
  }

  const navId = resolvePortalNavId(pathname);
  return getPortalPageMeta(strings)[navId];
}
