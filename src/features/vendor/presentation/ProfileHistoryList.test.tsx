import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { VendorProfileChangeHistoryItem } from "@/features/vendor/domain/types";
import {
  formatHistoryDate,
  ProfileHistoryList,
} from "@/features/vendor/presentation/ProfileHistoryList";
import { ProfileHistorySkeleton } from "@/features/vendor/presentation/ProfileHistorySkeleton";
import { getStrings } from "@/shared/i18n/get-strings";
import type { AppLocale } from "@/shared/preferences/domain/types";

const en = getStrings("en");
const ar = getStrings("ar");

const base: VendorProfileChangeHistoryItem = {
  id: "r1",
  status: "rejected",
  ownerName: "Owner",
  phone: "0100",
  storeName: "Happy Tails",
  storeDescription: "Pet food",
  contactPhone: "0100",
  contactEmail: "shop@example.com",
  contactAddress: "Cairo",
  logoUrl: null,
  createdAt: new Date(Date.UTC(2026, 10, 1, 8, 0, 0)),
  reviewedAt: new Date(Date.UTC(2026, 10, 3, 9, 0, 0)),
  reviewNotes: "Logo is blurry",
};

function render(
  items: VendorProfileChangeHistoryItem[],
  options: { locale?: AppLocale; hasMore?: boolean; isLoadingMore?: boolean } = {},
) {
  const locale = options.locale ?? "en";
  return renderToStaticMarkup(
    <ProfileHistoryList
      strings={locale === "ar" ? ar : en}
      locale={locale}
      items={items}
      hasMore={options.hasMore ?? false}
      isLoadingMore={options.isLoadingMore ?? false}
      onLoadMore={() => {}}
    />,
  );
}

describe("ProfileHistoryList", () => {
  it("shows the empty state", () => {
    expect(render([])).toContain(en.profile.historyEmpty);
  });

  it("shows status labels, dates and the review note per request", () => {
    const html = render([
      base,
      { ...base, id: "r2", status: "approved", reviewNotes: null },
      { ...base, id: "r3", status: "pending", reviewedAt: null, reviewNotes: null },
    ]);
    expect(html).toContain(en.profile.status.rejected);
    expect(html).toContain(en.profile.status.approved);
    expect(html).toContain(en.profile.status.pending);
    expect(html).toContain("Review note: Logo is blurry");
    expect(html).toContain("Submitted 1 Nov 2026");
    expect(html).toContain("Reviewed 3 Nov 2026");
    expect(html.match(/<li/g)).toHaveLength(3);
  });

  it("shows load more only when another page exists", () => {
    expect(render([base])).not.toContain(en.profile.historyLoadMore);
    expect(render([base], { hasMore: true })).toContain(en.profile.historyLoadMore);
    expect(render([base], { hasMore: true, isLoadingMore: true })).toContain(
      en.profile.historyLoadingMore,
    );
  });

  it("renders Arabic copy with Western digits", () => {
    const html = render([base], { locale: "ar" });
    expect(html).toContain(ar.profile.status.rejected);
    expect(html).toContain("2026");
    expect(html).not.toMatch(/[٠-٩]/);
  });

  it("formats dates in Cairo time", () => {
    // 23:30 UTC on 1 Nov is already 2 Nov in Cairo.
    expect(formatHistoryDate(new Date(Date.UTC(2026, 10, 1, 23, 30)), "en")).toBe("2 Nov 2026");
  });
});

describe("ProfileHistorySkeleton", () => {
  it("renders a busy status with one shimmer per shape", () => {
    const html = renderToStaticMarkup(<ProfileHistorySkeleton strings={en} />);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('role="status"');
    expect(html.match(/shimmer/g)?.length ?? 0).toBeGreaterThanOrEqual(9);
  });

  it("shows the photos a request asked for, or that it cleared them", () => {
    const withPhotos = render([
      { ...base, providerProfile: { photoUrls: ["https://example.com/h1.jpg"] } },
      { ...base, id: "r2", providerProfile: { photoUrls: [] } },
    ]);
    expect(withPhotos).toContain(en.profile.photos.proposedTitle);
    expect(withPhotos).toContain("https://example.com/h1.jpg");
    expect(withPhotos).toContain(en.profile.photos.cleared);
    expect(render([base])).not.toContain(en.profile.photos.proposedTitle);
  });
});
