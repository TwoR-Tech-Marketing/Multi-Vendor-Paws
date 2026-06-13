import type { ComponentType, SVGProps } from "react";

import { Routes } from "@/constants/routes";
import { Strings } from "@/constants/strings";

import {
  IconDashboard,
  IconEarnings,
  IconOrders,
  IconProducts,
} from "./PortalNavIcons";

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
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  requiresActiveAccount: boolean;
};

export const PORTAL_SIDEBAR_NAV_ITEMS: PortalNavItem[] = [
  {
    id: "dashboard",
    href: Routes.vendor.dashboard,
    label: Strings.nav.dashboard,
    Icon: IconDashboard,
    requiresActiveAccount: false,
  },
  {
    id: "products",
    href: Routes.vendor.products,
    label: Strings.nav.products,
    Icon: IconProducts,
    requiresActiveAccount: true,
  },
  {
    id: "orders",
    href: Routes.vendor.orders,
    label: Strings.nav.orders,
    Icon: IconOrders,
    requiresActiveAccount: true,
  },
  {
    id: "earnings",
    href: Routes.vendor.earnings,
    label: Strings.nav.earnings,
    Icon: IconEarnings,
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
