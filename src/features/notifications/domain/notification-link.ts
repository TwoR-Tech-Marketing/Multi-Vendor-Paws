import { Routes } from "@/constants/routes";
import type { VendorNotificationLink } from "@/features/notifications/domain/types";

/** Maps a notification link target to a portal route, or null for no tap action. */
export function resolveNotificationHref(link: VendorNotificationLink | null): string | null {
  if (!link) return null;
  switch (link.target) {
    case "order":
      return link.id ? Routes.vendor.orderDetail(link.id) : Routes.vendor.orders;
    case "products":
      return Routes.vendor.products;
    case "earnings":
      return Routes.vendor.earnings;
    case "profile":
    case "documents":
    case "accountStatus":
      return Routes.vendor.profile;
    default:
      return null;
  }
}
