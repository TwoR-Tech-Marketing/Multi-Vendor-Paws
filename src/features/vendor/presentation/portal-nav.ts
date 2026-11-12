import { Routes } from "@/constants/routes";
import { portalNavAssets } from "@/features/vendor/presentation/portal-assets";
import {
  getProviderConfig,
  type VendorScreenKey,
} from "@/features/vendor/domain/vendor-type-config";
import type { AppStrings } from "@/shared/i18n/types";

export type PortalNavId =
  | "dashboard"
  | "profile"
  | "products"
  | "orders"
  | "earnings"
  | "settings"
  | "notifications"
  | "branches"
  | "coupons"
  | "telehealth";

export type PortalNavItem = {
  id: VendorScreenKey;
  /** null for comingSoon items: no route exists yet. */
  href: string | null;
  label: string;
  icon: string;
  requiresActiveAccount: boolean;
  comingSoon: boolean;
};

type NavTarget = { href: string | null; icon: string; label: (strings: AppStrings) => string };

const NAV_TARGETS: Partial<Record<VendorScreenKey, NavTarget>> = {
  dashboard: {
    href: Routes.vendor.dashboard,
    icon: portalNavAssets.navDashboard,
    label: (s) => s.nav.dashboard,
  },
  products: {
    href: Routes.vendor.products,
    icon: portalNavAssets.navProducts,
    label: (s) => s.nav.products,
  },
  orders: { href: Routes.vendor.orders, icon: portalNavAssets.navOrders, label: (s) => s.nav.orders },
  earnings: {
    href: Routes.vendor.earnings,
    icon: portalNavAssets.navEarnings,
    label: (s) => s.nav.earnings,
  },
  settings: {
    href: Routes.vendor.settings,
    icon: portalNavAssets.navSettings,
    label: (s) => s.nav.settings,
  },
  branches: {
    href: Routes.vendor.branches,
    icon: portalNavAssets.navBranches,
    label: (s) => s.nav.branches,
  },
  appointments: {
    href: null,
    icon: portalNavAssets.navAppointments,
    label: (s) => s.nav.appointments,
  },
  telehealth: {
    href: Routes.vendor.telehealth,
    icon: portalNavAssets.navTelehealth,
    label: (s) => s.nav.telehealth,
  },
  coupons: {
    href: Routes.vendor.coupons,
    icon: portalNavAssets.navCoupons,
    label: (s) => s.nav.coupons,
  },
};

/**
 * Portal only sidebar items. The shared `nav` list is also the vendor app tab
 * bar (five tabs at most), so these screens are added from `screens` instead,
 * placed before settings, and only when visible for the vendor type.
 */
const PORTAL_SIDEBAR_EXTRAS: VendorScreenKey[] = ["coupons"];

function sidebarIds(config: ReturnType<typeof getProviderConfig>): VendorScreenKey[] {
  const extras = PORTAL_SIDEBAR_EXTRAS.filter(
    (id) => !config.nav.includes(id) && config.screens[id] === "visible",
  );
  if (extras.length === 0) return config.nav;
  const settingsAt = config.nav.indexOf("settings");
  const at = settingsAt === -1 ? config.nav.length : settingsAt;
  return [...config.nav.slice(0, at), ...extras, ...config.nav.slice(at)];
}

/** Sidebar items from the vendor type config (missing type reads as store). */
export function getPortalSidebarNavItems(
  strings: AppStrings,
  vendorType?: string | null,
): PortalNavItem[] {
  const config = getProviderConfig(vendorType);
  return sidebarIds(config).flatMap((id) => {
    const target = NAV_TARGETS[id];
    const state = config.screens[id];
    if (!target || state === "hidden") return [];
    const comingSoon = state === "comingSoon";
    return [
      {
        id,
        href: comingSoon ? null : target.href,
        label: target.label(strings),
        icon: target.icon,
        requiresActiveAccount: config.requiresActive.includes(id),
        comingSoon,
      },
    ];
  });
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
    branches: strings.pages.branches,
    coupons: strings.pages.coupons,
    telehealth: strings.pages.telehealth,
  };
}

export function resolvePortalNavId(pathname: string): PortalNavId {
  if (pathname.startsWith(Routes.vendor.profile)) return "profile";
  if (pathname.startsWith(Routes.vendor.settings)) return "settings";
  if (pathname.startsWith(Routes.vendor.notifications)) return "notifications";
  if (pathname.startsWith(Routes.vendor.products)) return "products";
  if (pathname.startsWith(Routes.vendor.orders)) return "orders";
  if (pathname.startsWith(Routes.vendor.earnings)) return "earnings";
  if (pathname.startsWith(Routes.vendor.branches)) return "branches";
  if (pathname.startsWith(Routes.vendor.coupons)) return "coupons";
  if (pathname.startsWith(Routes.vendor.telehealth)) return "telehealth";
  return "dashboard";
}

const PRODUCT_EDIT_PATH = /^\/products\/[^/]+\/edit\/?$/;
const ORDER_DETAIL_PATH = /^\/orders\/[^/]+\/?$/;
const BRANCH_DETAIL_PATH = /^\/branches\/[^/]+\/?$/;
const BRANCH_AVAILABILITY_PATH = /^\/branches\/[^/]+\/availability\/?$/;
const COUPON_DETAIL_PATH = /^\/coupons\/[^/]+\/?$/;
const TELEHEALTH_CHAT_PATH = /^\/telehealth\/[^/]+\/?$/;

export function resolvePortalPageMeta(pathname: string, strings: AppStrings): PortalPageMeta {
  const normalizedPath = pathname.replace(/\/$/, "") || "/";

  if (normalizedPath === Routes.vendor.coverage) {
    return {
      title: strings.pages.coverage.title,
      subtitle: strings.pages.coverage.subtitle,
    };
  }

  if (normalizedPath === Routes.vendor.payouts) {
    return {
      title: strings.pages.statement.title,
      subtitle: strings.pages.statement.subtitle,
    };
  }

  if (normalizedPath === Routes.vendor.deal) {
    return {
      title: strings.pages.deal.title,
      subtitle: strings.pages.deal.subtitle,
    };
  }

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

  if (ORDER_DETAIL_PATH.test(normalizedPath) && normalizedPath !== Routes.vendor.orders) {
    return {
      title: strings.orders.detailTitle,
      subtitle: strings.orders.detailSubtitle,
    };
  }

  if (BRANCH_AVAILABILITY_PATH.test(normalizedPath)) {
    return {
      title: strings.pages.availability.title,
      subtitle: strings.pages.availability.subtitle,
    };
  }

  if (BRANCH_DETAIL_PATH.test(normalizedPath)) {
    return {
      title: strings.pages.branches.detailTitle,
      subtitle: strings.pages.branches.detailSubtitle,
    };
  }

  if (COUPON_DETAIL_PATH.test(normalizedPath)) {
    return {
      title: strings.pages.coupons.detailTitle,
      subtitle: strings.pages.coupons.detailSubtitle,
    };
  }

  if (TELEHEALTH_CHAT_PATH.test(normalizedPath)) {
    return {
      title: strings.pages.telehealth.chatTitle,
      subtitle: strings.pages.telehealth.chatSubtitle,
    };
  }

  const navId = resolvePortalNavId(pathname);
  return getPortalPageMeta(strings)[navId];
}
