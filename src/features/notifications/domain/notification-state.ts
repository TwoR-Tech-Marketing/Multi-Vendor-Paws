import type { VendorNotification, VendorNotificationFilter } from "./types";

/** Marks one item read locally (optimistic update after a tap). */
export function markItemRead(
  items: VendorNotification[],
  notificationId: string,
  now: Date,
): VendorNotification[] {
  return items.map((item) =>
    item.notificationId === notificationId && !item.isRead
      ? { ...item, isRead: true, readAt: now }
      : item,
  );
}

/**
 * Local update after a tap: on the Unread tab the item leaves the list (same as
 * the vendor app); on All it stays and shows as read.
 */
export function applyItemOpened(
  items: VendorNotification[],
  notificationId: string,
  tab: VendorNotificationFilter,
  now: Date,
): VendorNotification[] {
  if (tab === "unread") return items.filter((item) => item.notificationId !== notificationId);
  return markItemRead(items, notificationId, now);
}

/** Marks every loaded item read locally (after mark all). */
export function markAllItemsRead(
  items: VendorNotification[],
  now: Date,
): VendorNotification[] {
  return items.map((item) => (item.isRead ? item : { ...item, isRead: true, readAt: now }));
}

/** Appends a next page without duplicating ids already shown. */
export function appendPage(
  current: VendorNotification[],
  next: VendorNotification[],
): VendorNotification[] {
  const seen = new Set(current.map((item) => item.notificationId));
  return [...current, ...next.filter((item) => !seen.has(item.notificationId))];
}

export function formatUnreadBadge(count: number): string | null {
  if (!Number.isFinite(count) || count <= 0) return null;
  return count > 99 ? "99+" : String(Math.trunc(count));
}

/** Tracks the latest list request so a slow older response (another tab, a stale page) is ignored. */
export function createRequestTracker() {
  let latest = 0;
  return {
    next: (): number => ++latest,
    isLatest: (id: number): boolean => id === latest,
  };
}
