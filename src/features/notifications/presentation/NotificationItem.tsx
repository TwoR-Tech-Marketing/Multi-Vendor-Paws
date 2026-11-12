import type { VendorNotification } from "@/features/notifications/domain/types";

import styles from "./notifications.module.css";

type NotificationItemProps = {
  notification: VendorNotification;
  title: string;
  body: string;
  timeLabel: string;
  unreadLabel: string;
  onOpen: (notification: VendorNotification) => void;
};

export function NotificationItem({
  notification,
  title,
  body,
  timeLabel,
  unreadLabel,
  onOpen,
}: NotificationItemProps) {
  const unread = !notification.isRead;
  return (
    <li>
      <button
        type="button"
        className={`${styles.item} ${unread ? styles.itemUnread : ""}`}
        onClick={() => onOpen(notification)}
        data-notification-id={notification.notificationId}
      >
        <span className={styles.itemText}>
          <span className={styles.itemTitle}>{title}</span>
          <span className={styles.itemBody}>{body}</span>
        </span>
        <span className={styles.itemMeta}>
          <time className={styles.itemTime} dateTime={notification.createdAt.toISOString()}>
            {timeLabel}
          </time>
          {unread ? (
            <span className={styles.unreadDot} role="img" aria-label={unreadLabel} />
          ) : null}
        </span>
      </button>
    </li>
  );
}
