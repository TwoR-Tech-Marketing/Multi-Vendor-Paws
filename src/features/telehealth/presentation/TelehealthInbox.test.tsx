import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  makeQueueItem,
  makeSession,
  makeStatus,
} from "@/features/telehealth/presentation/test-fixtures";
import { getStrings } from "@/shared/i18n/get-strings";

const state = vi.hoisted(() => ({ locale: "en" as "en" | "ar", kind: "active" }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock("@/shared/preferences/PreferencesContext", async () => {
  const { getStrings: load } = await import("@/shared/i18n/get-strings");
  return {
    useStrings: () => load(state.locale),
    usePreferences: () => ({ locale: state.locale, dir: state.locale === "ar" ? "rtl" : "ltr" }),
  };
});
vi.mock("@/features/vendor/presentation/PortalSessionContext", () => ({
  usePortalSession: () => ({ sessionKind: state.kind, user: { uid: "doc1" } }),
}));
vi.mock("@/features/vendor/presentation/PortalHeaderActionsContext", () => ({
  usePortalHeaderActions: () => ({ actions: null, setActions: vi.fn() }),
}));
vi.mock("@/features/telehealth/application/telehealth.api", () => ({
  acceptTelehealthSession: vi.fn(),
  getMyTelehealthStatus: vi.fn(),
  listMyTelehealthSessions: vi.fn(),
  listTelehealthQueue: vi.fn(),
  setMyTelehealthAvailability: vi.fn(),
}));

import { TelehealthAvailabilityToggle } from "@/features/telehealth/presentation/TelehealthAvailabilityToggle";
import {
  TelehealthInboxSection,
  tabsForKind,
} from "@/features/telehealth/presentation/TelehealthInboxSection";
import { TelehealthInboxView } from "@/features/telehealth/presentation/TelehealthInboxView";
import { TelehealthQueueList } from "@/features/telehealth/presentation/TelehealthQueueList";
import { TelehealthInboxSkeleton } from "@/features/telehealth/presentation/TelehealthSkeletons";

const en = getStrings("en");
const ar = getStrings("ar");
const noop = () => {};
const EMPTY = { items: [], nextCursor: null };

function renderView(props: Partial<Parameters<typeof TelehealthInboxView>[0]> = {}) {
  return renderToStaticMarkup(
    <TelehealthInboxView
      strings={en}
      locale="en"
      tab="queue"
      tabs={tabsForKind("active")}
      status={makeStatus()}
      isActiveAccount
      queue={[]}
      lists={{ active: EMPTY, ended: EMPTY }}
      isListLoading={false}
      isLoadingMore={false}
      acceptingId={null}
      onTabChange={noop}
      onAccept={noop}
      onLoadMore={noop}
      {...props}
    />,
  );
}

beforeEach(() => {
  state.locale = "en";
  state.kind = "active";
});

describe("TelehealthInboxSection", () => {
  it("starts with the shimmer skeleton, not a spinner", () => {
    const html = renderToStaticMarkup(<TelehealthInboxSection />);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain(`aria-label="${en.common.loading}"`);
  });

  it("opens only the tabs the session kind may use", () => {
    expect(tabsForKind("active")).toEqual(["queue", "active", "ended"]);
    expect(tabsForKind("suspended")).toEqual(["active", "ended"]);
    expect(tabsForKind("pending")).toEqual([]);
    expect(tabsForKind("rejected")).toEqual([]);
  });

  it("renders the skeleton in Arabic", () => {
    state.locale = "ar";
    expect(renderToStaticMarkup(<TelehealthInboxSkeleton />)).toContain(
      `aria-label="${ar.common.loading}"`,
    );
  });
});

describe("TelehealthAvailabilityToggle", () => {
  it("shows the online status and a go offline switch", () => {
    const html = renderToStaticMarkup(
      <TelehealthAvailabilityToggle online canGoOnline isBusy={false} strings={en} onToggle={noop} />,
    );
    expect(html).toContain(en.telehealth.online);
    expect(html).toContain(en.telehealth.goOffline);
    expect(html).toContain('role="switch"');
    expect(html).toContain('aria-checked="true"');
    expect(html).not.toContain("disabled");
  });

  it("disables going online for accounts that are not active", () => {
    const html = renderToStaticMarkup(
      <TelehealthAvailabilityToggle
        online={false}
        canGoOnline={false}
        isBusy={false}
        strings={ar}
        onToggle={noop}
      />,
    );
    expect(html).toContain(ar.telehealth.offline);
    expect(html).toContain(ar.telehealth.goOnline);
    expect(html).toContain("disabled");
  });

  it("still lets an inactive doctor go offline", () => {
    const html = renderToStaticMarkup(
      <TelehealthAvailabilityToggle online canGoOnline={false} isBusy={false} strings={en} onToggle={noop} />,
    );
    expect(html).not.toContain("disabled");
  });
});

describe("TelehealthQueueList", () => {
  it("lists waiting consultations with buyer, pet, intake, times and accept", () => {
    const html = renderToStaticMarkup(
      <TelehealthQueueList
        items={[makeQueueItem(), makeQueueItem({ sessionId: "q2", buyer: { displayName: "Omar", petName: null, petType: null } })]}
        strings={en}
        locale="en"
        acceptingId={null}
        onAccept={noop}
      />,
    );
    expect(html).toContain("Mona · Max (dog)");
    expect(html).toContain("Omar");
    expect(html).toContain("Max is not eating since yesterday");
    expect(html).toMatch(/Waiting since 12:00\sPM/);
    expect(html).toMatch(/Expires at 12:15\sPM/);
    expect(html.match(new RegExp(`>${en.telehealth.accept}<`, "g"))).toHaveLength(2);
  });

  it("shows the accepting state and blocks other accepts", () => {
    const html = renderToStaticMarkup(
      <TelehealthQueueList
        items={[makeQueueItem(), makeQueueItem({ sessionId: "q2" })]}
        strings={en}
        locale="en"
        acceptingId="q1"
        onAccept={noop}
      />,
    );
    expect(html).toContain(en.telehealth.accepting);
    expect(html.match(/disabled=""/g)).toHaveLength(2);
  });

  it("shows the empty queue", () => {
    const html = renderToStaticMarkup(
      <TelehealthQueueList items={[]} strings={en} locale="en" acceptingId={null} onAccept={noop} />,
    );
    expect(html).toContain(en.telehealth.queueEmpty);
  });
});

describe("TelehealthInboxView", () => {
  it("shows tabs, counts and the online hint", () => {
    const html = renderView({ queue: [makeQueueItem()] });
    expect(html).toContain('role="tablist"');
    for (const id of ["queue", "active", "ended"] as const) expect(html).toContain(en.telehealth.tabs[id]);
    expect(html).toContain(en.telehealth.onlineHint);
    expect(html).toContain("2 waiting");
    expect(html).toContain("1 active");
    expect(html).toMatch(/Consultation price: EGP\s?200/);
    expect(html).toContain(en.telehealth.accept);
  });

  it("hides the price when none is set and shows it in Arabic", () => {
    expect(renderView({ status: makeStatus({ pricePiastres: null }) })).not.toContain("Consultation price");
    const html = renderView({ strings: ar, locale: "ar" });
    expect(html).toContain("سعر الاستشارة: ");
  });

  it("asks an offline doctor to go online instead of showing the queue", () => {
    const html = renderView({ status: makeStatus({ online: false }), queue: [makeQueueItem()] });
    expect(html).toContain(en.telehealth.offlineHint);
    expect(html).toContain(en.telehealth.queueOffline);
    expect(html).not.toContain(en.telehealth.accept);
  });

  it("shows the inactive hint and no tabs for a pending doctor", () => {
    const html = renderView({
      tabs: tabsForKind("pending"),
      tab: "active",
      isActiveAccount: false,
      status: makeStatus({ online: false, canGoOnline: false, activeCount: 0 }),
    });
    expect(html).toContain(en.telehealth.inactiveHint);
    expect(html).not.toContain('role="tablist"');
    expect(html).not.toContain(en.telehealth.activeEmpty);
  });

  it("lets a suspended doctor see active and ended consultations only", () => {
    const html = renderView({
      tabs: tabsForKind("suspended"),
      tab: "active",
      isActiveAccount: false,
      status: makeStatus({ online: false, canGoOnline: false }),
      lists: { active: { items: [makeSession()], nextCursor: null }, ended: EMPTY },
    });
    expect(html).toContain(en.telehealth.inactiveHint);
    expect(html).not.toContain(`>${en.telehealth.tabs.queue}<`);
    expect(html).toContain('href="/telehealth/s1"');
    expect(html).toContain("Thank you");
  });

  it("lists ended sessions with a photo preview, status and load more", () => {
    const html = renderView({
      tab: "ended",
      lists: {
        active: EMPTY,
        ended: {
          items: [
            makeSession({ status: "ended", endedAtMs: 1_800_000_000_000, lastMessagePreview: "[photo]" }),
            makeSession({ sessionId: "s2", status: "refund_flagged" }),
          ],
          nextCursor: "s2",
        },
      },
    });
    expect(html).toContain(en.telehealth.photoPreview);
    expect(html).not.toContain("[photo]");
    expect(html).toContain(en.telehealth.statusLabels.ended);
    expect(html).toContain(en.telehealth.statusLabels.refund_flagged);
    expect(html).toContain(en.telehealth.loadMore);
  });

  it("shows per row skeletons while a tab loads", () => {
    const html = renderView({ isListLoading: true });
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain(en.telehealth.queueEmpty);
  });

  it("renders Arabic copy", () => {
    const html = renderView({ strings: ar, locale: "ar", tab: "active" });
    expect(html).toContain(ar.telehealth.tabs.queue);
    expect(html).toContain(ar.telehealth.activeEmpty);
  });
});
