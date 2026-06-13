import { Routes } from "@/constants/routes";
import { Strings } from "@/constants/strings";
import { portalNavAssets } from "@/features/vendor/presentation/portal-assets";

export type PortalNavId =
  | "dashboard"
  | "profile"
  | "products"
  | "orders"
  | "earnings";

export type PortalNavItem = {
  id: PortalNavId;
  href: string;
  label: string;
  icon: string;
  requiresActiveAccount: boolean;
};

export const PORTAL_SIDEBAR_NAV_ITEMS: PortalNavItem[] = [
  {
    id: "dashboard",
    href: Routes.vendor.dashboard,
    label: Strings.nav.dashboard,
    icon: portalNavAssets.navDashboard,
    requiresActiveAccount: false,
  },
  {
    id: "products",
    href: Routes.vendor.products,
    label: Strings.nav.products,
    icon: portalNavAssets.navProducts,
    requiresActiveAccount: true,
  },
  {
    id: "orders",
    href: Routes.vendor.orders,
    label: Strings.nav.orders,
    icon: portalNavAssets.navOrders,
    requiresActiveAccount: true,
  },
  {
    id: "earnings",
    href: Routes.vendor.earnings,
    label: Strings.nav.earnings,
    icon: portalNavAssets.navEarnings,
    requiresActiveAccount: true,
  },
];

export type PortalPageMeta = {
  title: string;
  subtitle: string;
};

export const PORTAL_PAGE_META: Record<PortalNavId, PortalPageMeta> = {
  dashboard: Strings.pages.dashboard,
  profile: Strings.pages.profile,
  products: Strings.pages.products,
  orders: Strings.pages.orders,
  earnings: Strings.pages.earnings,
};

export function resolvePortalNavId(pathname: string): PortalNavId {
  if (pathname.startsWith(Routes.vendor.profile)) return "profile";
  if (pathname.startsWith(Routes.vendor.products)) return "products";
  if (pathname.startsWith(Routes.vendor.orders)) return "orders";
  if (pathname.startsWith(Routes.vendor.earnings)) return "earnings";
  return "dashboard";
}
