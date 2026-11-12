import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { VendorProfileChangeHistoryItem } from "@/features/vendor/domain/types";
import {
  ProfileHistoryContent,
  type ProfileHistoryLoadError,
} from "@/features/vendor/presentation/ProfileHistoryContent";
import { getStrings } from "@/shared/i18n/get-strings";

const en = getStrings("en");
const loadError = en.profile.historyLoadError.replace(/'/g, "&#x27;");

const item: VendorProfileChangeHistoryItem = {
  id: "r1",
  status: "approved",
  ownerName: "Owner",
  phone: "0100",
  storeName: "Happy Tails",
  storeDescription: "Pet food",
  contactPhone: "0100",
  contactEmail: "shop@example.com",
  contactAddress: "Cairo",
  logoUrl: null,
  createdAt: new Date(Date.UTC(2026, 10, 1, 8, 0, 0)),
  reviewedAt: null,
  reviewNotes: null,
};

function render(state: {
  items?: VendorProfileChangeHistoryItem[];
  isLoading?: boolean;
  loadError?: ProfileHistoryLoadError;
}) {
  return renderToStaticMarkup(
    <ProfileHistoryContent
      strings={en}
      locale="en"
      items={state.items ?? []}
      isLoading={state.isLoading ?? false}
      loadError={state.loadError ?? null}
      hasMore={false}
      isLoadingMore={false}
      onRetry={() => {}}
      onLoadMore={() => {}}
    />,
  );
}

describe("ProfileHistoryContent", () => {
  it("shows only the skeleton while loading", () => {
    const html = render({ isLoading: true });
    expect(html).toContain('aria-busy="true"');
    expect(html).not.toContain(en.profile.historyEmpty);
    expect(html).not.toContain(loadError);
  });

  it("shows only the error and retry on a first page error, never the empty state", () => {
    const html = render({ loadError: "first" });
    expect(html).toContain(loadError);
    expect(html).toContain(en.common.retry);
    expect(html).not.toContain(en.profile.historyEmpty);
    expect(html).not.toContain("<ul");
  });

  it("shows the empty state without an error when there are no requests", () => {
    const html = render({});
    expect(html).toContain(en.profile.historyEmpty);
    expect(html).not.toContain(loadError);
  });

  it("shows the rows without an error after a successful load", () => {
    const html = render({ items: [item] });
    expect(html).toContain("Happy Tails");
    expect(html).not.toContain(loadError);
  });

  it("keeps the loaded rows and adds the alert when a later page fails", () => {
    const html = render({ items: [item], loadError: "more" });
    expect(html).toContain("Happy Tails");
    expect(html).toContain(loadError);
    expect(html).not.toContain(en.profile.historyEmpty);
  });
});
