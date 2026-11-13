import type { VendorOrderStatusEvent } from "@/features/orders/domain/types";
import { OrderStatusBadge } from "@/features/orders/presentation/OrderStatusBadge";
import type { AppStrings } from "@/shared/i18n/types";

import styles from "./orders.module.css";

type OrderStatusTimelineProps = {
  events: VendorOrderStatusEvent[];
  strings: AppStrings;
  formatDate: (date: Date) => string;
};

export function OrderStatusTimeline({ events, strings, formatDate }: OrderStatusTimelineProps) {
  return (
    <ol className={styles.timeline}>
      {events.map((event) => (
        <li key={`${event.status}-${event.at.toISOString()}`} className={styles.timelineItem}>
          <span className={styles.timelineMain}>
            <OrderStatusBadge status={event.status} strings={strings} />
            <span className={styles.timelineRole}>
              {strings.orders.historyRoleLabels[event.byRole]}
            </span>
            {event.note ? <span className={styles.timelineNote}>{event.note}</span> : null}
          </span>
          <span className={styles.timelineDate}>{formatDate(event.at)}</span>
        </li>
      ))}
    </ol>
  );
}
