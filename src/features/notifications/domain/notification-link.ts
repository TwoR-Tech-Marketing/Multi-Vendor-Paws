import { Routes } from "@/constants/routes";
import type { VendorNotificationLink } from "@/features/notifications/domain/types";
import { isScreenVisible } from "@/features/vendor/domain/vendor-type-config";

/**
 * Maps a notification link target to a portal route, or null for no tap action.
 * Order, product and appointment targets have no action for types without those screens.
 */
export function resolveNotificationHref(
  link: VendorNotificationLink | null,
  vendorType?: string,
): string | null {
  if (!link) return null;
  switch (link.target) {
    case "order":
      if (!isScreenVisible(vendorType, "orders")) return null;
      return link.id ? Routes.vendor.orderDetail(link.id) : Routes.vendor.orders;
    case "products":
      return isScreenVisible(vendorType, "products") ? Routes.vendor.products : null;
    case "appointment":
      if (!isScreenVisible(vendorType, "appointments")) return null;
      return link.id ? Routes.vendor.appointmentDetail(link.id) : Routes.vendor.appointments;
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
