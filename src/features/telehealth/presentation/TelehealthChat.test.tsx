import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  makeMessage,
  makeSession,
} from "@/features/telehealth/presentation/test-fixtures";
import { getStrings } from "@/shared/i18n/get-strings";

const state = vi.hoisted(() => ({ locale: "en" as "en" | "ar" }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock("@/shared/preferences/PreferencesContext", async () => {
  const { getStrings: load } = await import("@/shared/i18n/get-strings");
  return {
    useStrings: () => load(state.locale),
    usePreferences: () => ({ locale: state.locale, dir: state.locale === "ar" ? "rtl" : "ltr" }),
  };
});
vi.mock("@/features/vendor/presentation/PortalSessionContext", () => ({
  usePortalSession: () => ({ sessionKind: "active", user: { uid: "doc1" } }),
}));
vi.mock("@/features/telehealth/application/telehealth.api", () => ({
  endTelehealthSession: vi.fn(),
  getTelehealthSession: vi.fn(),
  listTelehealthMessages: vi.fn(),
  newClientMessageId: vi.fn(),
  sendTelehealthMessage: vi.fn(),
  uploadTelehealthPhoto: vi.fn(),
}));

import { TelehealthChatSection } from "@/features/telehealth/presentation/TelehealthChatSection";
import { TelehealthChatView } from "@/features/telehealth/presentation/TelehealthChatView";
import { TelehealthComposer } from "@/features/telehealth/presentation/TelehealthComposer";
import { TelehealthMessageList } from "@/features/telehealth/presentation/TelehealthMessageList";
import { TelehealthChatSkeleton } from "@/features/telehealth/presentation/TelehealthSkeletons";

const en = getStrings("en");
const ar = getStrings("ar");
const noop = () => {};

function renderChat(status: Parameters<typeof makeSession>[0] = {}, strings = en) {
  return renderToStaticMarkup(
    <TelehealthChatView
      session={makeSession(status)}
      strings={strings}
      isEnding={false}
      messageList={<div data-testid="messages" />}
      composer={<div data-testid="composer" />}
      onEnd={noop}
    />,
  );
}

function renderComposer(props: Partial<Parameters<typeof TelehealthComposer>[0]> = {}) {
  return renderToStaticMarkup(
    <TelehealthComposer
      draft=""
      strings={en}
      isSending={false}
      isUploading={false}
      onDraftChange={noop}
      onSend={noop}
      onPhoto={noop}
      {...props}
    />,
  );
}

beforeEach(() => {
  state.locale = "en";
});

describe("TelehealthChatSection", () => {
  it("starts with the chat skeleton", () => {
    const html = renderToStaticMarkup(<TelehealthChatSection sessionId="s1" />);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain(`aria-label="${en.common.loading}"`);
  });

  it("renders the chat skeleton in Arabic", () => {
    state.locale = "ar";
    expect(renderToStaticMarkup(<TelehealthChatSkeleton />)).toContain(
      `aria-label="${ar.common.loading}"`,
    );
  });
});

describe("TelehealthChatView", () => {
  it("shows the buyer, pet, intake, composer and end button while active", () => {
    const html = renderChat();
    expect(html).toContain("Mona");
    expect(html).toContain(`${en.telehealth.chat.petLabel}: Max (dog)`);
    expect(html).toContain(en.telehealth.chat.intake);
    expect(html).toContain("Max is not eating since yesterday");
    expect(html).toContain(en.telehealth.chat.end);
    expect(html).toContain('data-testid="composer"');
    expect(html).toContain('href="/telehealth"');
  });

  it("is read only once ended", () => {
    const html = renderChat({ status: "ended" });
    expect(html).toContain(en.telehealth.chat.readOnlyEnded);
    expect(html).not.toContain('data-testid="composer"');
    expect(html).not.toContain(en.telehealth.chat.end);
    expect(html).toContain('data-testid="messages"');
  });

  it("is read only when refund flagged or unknown", () => {
    for (const status of ["refund_flagged", "unknown"] as const) {
      const html = renderChat({ status });
      expect(html).toContain(en.telehealth.chat.readOnlyClosed);
      expect(html).not.toContain('data-testid="composer"');
    }
  });

  it("shows the ending state", () => {
    const html = renderToStaticMarkup(
      <TelehealthChatView
        session={makeSession()}
        strings={ar}
        isEnding
        messageList={null}
        composer={null}
        onEnd={noop}
      />,
    );
    expect(html).toContain(ar.telehealth.chat.ending);
  });
});

describe("TelehealthMessageList", () => {
  const messages = [
    makeMessage(),
    makeMessage({ messageId: "m2", senderRole: "doctor", text: "Please share a photo" }),
    makeMessage({ messageId: "m3", type: "photo", text: null, photoUrl: "https://storage.example/p.jpg" }),
  ];

  it("renders own and buyer bubbles, photos and times", () => {
    const html = renderToStaticMarkup(
      <TelehealthMessageList
        messages={messages}
        strings={en}
        locale="en"
        hasOlder={false}
        isLoadingOlder={false}
        onLoadOlder={noop}
      />,
    );
    expect(html).toContain("Hello doctor");
    expect(html).toContain("Please share a photo");
    expect(html).toContain(`${en.telehealth.chat.you} · `);
    expect(html).toContain(`${en.telehealth.chat.owner} · `);
    expect(html).toContain(`alt="${en.telehealth.chat.photoAlt}"`);
    expect(html).toContain("https://storage.example/p.jpg");
    expect(html).toMatch(/12:00\sPM/);
    expect(html.match(/bubbleOwn/g)).toHaveLength(1);
    expect(html).toContain('role="log"');
  });

  it("offers older messages and the empty state", () => {
    const html = renderToStaticMarkup(
      <TelehealthMessageList
        messages={[]}
        strings={ar}
        locale="ar"
        hasOlder
        isLoadingOlder={false}
        onLoadOlder={noop}
      />,
    );
    expect(html).toContain(ar.telehealth.chat.loadEarlier);
    expect(html).toContain(ar.telehealth.chat.empty);
  });

  it("uses Arabic labels with Western digits", () => {
    const html = renderToStaticMarkup(
      <TelehealthMessageList
        messages={messages}
        strings={ar}
        locale="ar"
        hasOlder={false}
        isLoadingOlder={false}
        onLoadOlder={noop}
      />,
    );
    expect(html).toContain(ar.telehealth.chat.you);
    expect(html).toMatch(/12:00/);
  });
});

describe("TelehealthComposer", () => {
  it("disables send for an empty draft and offers the photo picker", () => {
    const html = renderComposer();
    expect(html).toMatch(/<button type="submit"[^>]*disabled/);
    expect(html).toContain('accept="image/jpeg,image/png,image/webp,image/heic"');
    expect(html).toContain(en.telehealth.chat.attachPhoto);
    expect(html).toContain(`aria-label="${en.telehealth.chat.inputLabel}"`);
  });

  it("enables send for text and blocks text over 2000 characters", () => {
    expect(renderComposer({ draft: "Hi" })).not.toMatch(/<button type="submit"[^>]*disabled/);
    const html = renderComposer({ draft: "x".repeat(2001) });
    expect(html).toContain(en.telehealth.chat.textTooLong);
    expect(html).toMatch(/<button type="submit"[^>]*disabled/);
  });

  it("shows sending and uploading states", () => {
    expect(renderComposer({ draft: "Hi", isSending: true })).toContain(en.telehealth.chat.sending);
    expect(renderComposer({ isUploading: true })).toContain(en.telehealth.chat.uploadingPhoto);
  });
});
