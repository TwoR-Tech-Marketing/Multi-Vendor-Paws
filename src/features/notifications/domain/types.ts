export type VendorNotificationFilter = "all" | "unread";

export const VENDOR_NOTIFICATION_LINK_TARGETS = [
  "order",
  "products",
  "earnings",
  "profile",
  "documents",
  "accountStatus",
] as const;

export type VendorNotificationLinkTarget = (typeof VENDOR_NOTIFICATION_LINK_TARGETS)[number];

export type VendorNotificationLink = {
  target: VendorNotificationLinkTarget;
  id: string | null;
};

export type VendorNotificationParams = Record<string, string | number>;

export type VendorNotification = {
  notificationId: string;
  type: string;
  params: VendorNotificationParams;
  titleFallback: string | null;
  bodyFallback: string | null;
  link: VendorNotificationLink | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
};

export type VendorNotificationsPage = {
  items: VendorNotification[];
  nextCursor: string | null;
  unreadCount: number;
};

export type VendorNotificationsListRequest = {
  filter?: VendorNotificationFilter;
  pageSize?: number;
  cursor?: string | null;
};

export type VendorNotificationsMarkRequest =
  | { notificationIds: string[] }
  | { all: true };

export type VendorNotificationsMarkResult = {
  updatedCount: number;
  unreadCount: number;
};
