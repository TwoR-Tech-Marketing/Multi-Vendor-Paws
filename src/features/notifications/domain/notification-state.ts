import type { VendorNotification } from "./types";

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
