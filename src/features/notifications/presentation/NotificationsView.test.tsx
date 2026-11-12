import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { VendorNotification } from "@/features/notifications/domain/types";
import { getStrings } from "@/shared/i18n/get-strings";

import { NotificationsView, type NotificationsViewProps } from "./NotificationsView";

const NOW = new Date("2026-11-12T12:00:00.000Z");
const en = getStrings("en");
const ar = getStrings("ar");

function item(overrides: Partial<VendorNotification> = {}): VendorNotification {
  return {
    notificationId: "n1",
    type: "order_new",
    params: { orderNumber: "TP-42" },
    titleFallback: null,
    bodyFallback: null,
    link: { target: "order", id: "vo1" },
    isRead: false,
    readAt: null,
    createdAt: new Date("2026-11-12T11:30:00.000Z"),
    ...overrides,
  };
}

function render(overrides: Partial<NotificationsViewProps> = {}): string {
  const noop = () => {};
  return renderToStaticMarkup(
    <NotificationsView
      strings={en}
      locale="en"
      now={NOW}
      tab="all"
      items={[]}
      unreadCount={0}
      isLoading={false}
      loadError={null}
      actionError={null}
      isMarkingAll={false}
      hasMore={false}
      isLoadingMore={false}
      onTabChange={noop}
      onMarkAll={noop}
      onOpen={noop}
      onLoadMore={noop}
      onRetry={noop}
      {...overrides}
    />,
  );
}

function markAllButton(html: string): string {
  const match = html.match(/<button[^>]*>[^<]*Mark all as read<\/button>/);
  return match ? match[0] : "";
}

describe("NotificationsView", () => {
  it("renders a shimmer skeleton on first load, not a spinner", () => {
    const html = render({ isLoading: true });
    expect(html).toContain('aria-busy="true"');
    expect(html).not.toContain(en.notifications.emptyAllTitle);
  });

  it("renders the list with localized copy, relative time and unread dot", () => {
    const html = render({
      items: [
        item(),
        item({ notificationId: "n2", type: "admin_message", isRead: true, titleFallback: "Hello", bodyFallback: "Note" }),
      ],
      unreadCount: 1,
    });
    expect(html).toContain("New order");
    expect(html).toContain("You received a new order TP-42.");
    expect(html).toContain("30 minutes ago");
    expect(html).toContain("Hello");
    expect(html.match(/aria-label="Unread"/g)).toHaveLength(1);
    expect(html).toContain(en.notifications.unreadSummaryOne);
  });

  it("renders the empty state for all and for unread", () => {
    expect(render()).toContain(en.notifications.emptyAllTitle);
    const unread = render({ tab: "unread" });
    expect(unread).toContain(en.notifications.emptyUnreadTitle);
    expect(unread).toMatch(/aria-selected="true"[^>]*>Unread</);
  });

  it("enables mark all only when there are unread items", () => {
    expect(markAllButton(render())).toContain("disabled");
    expect(markAllButton(render({ items: [item()], unreadCount: 1 }))).not.toContain("disabled");
    expect(render({ items: [item()], unreadCount: 1, isMarkingAll: true })).toContain(
      en.notifications.markAllBusy,
    );
  });

  it("shows load more only with a next cursor", () => {
    expect(render({ items: [item()], hasMore: false })).not.toContain(en.notifications.loadMore);
    expect(render({ items: [item()], hasMore: true })).toContain(en.notifications.loadMore);
  });

  it("shows a friendly load error with retry instead of the empty state", () => {
    const html = render({ loadError: en.notifications.loadError });
    expect(html).toContain(en.notifications.loadError.replace("'", "&#x27;"));
    expect(html).toContain(en.common.retry);
    expect(html).not.toContain(en.notifications.emptyAllTitle);
  });

  it("renders Arabic copy with Western digits", () => {
    const html = render({ strings: ar, locale: "ar", items: [item()], unreadCount: 1 });
    expect(html).toContain(ar.notifications.types.orderNew.title);
    expect(html).toContain("30");
    expect(html).not.toMatch(/[٠-٩]/);
  });
});
