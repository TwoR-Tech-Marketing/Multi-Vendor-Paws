import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { makeReview } from "@/features/reviews/presentation/test-fixtures";
import { getStrings } from "@/shared/i18n/get-strings";

vi.mock("@/shared/preferences/PreferencesContext", async () => {
  const { getStrings: load } = await import("@/shared/i18n/get-strings");
  return { useStrings: () => load("en"), usePreferences: () => ({ locale: "en", dir: "ltr" }) };
});
vi.mock("@/features/reviews/application/reviews.api", () => ({
  listMyVendorReviews: vi.fn(() => new Promise(() => {})),
  replyToReview: vi.fn(),
}));
vi.mock("@/features/branches/application/branches.api", () => ({
  listBranches: vi.fn(() => new Promise(() => {})),
}));

import { ReplyDialog } from "@/features/reviews/presentation/ReplyDialog";
import { ReviewsFilters } from "@/features/reviews/presentation/ReviewsFilters";
import { ReviewsList } from "@/features/reviews/presentation/ReviewsList";
import { ReviewsSection } from "@/features/reviews/presentation/ReviewsSection";

const en = getStrings("en");
const ar = getStrings("ar");
const noop = () => {};

function renderList(props: Partial<Parameters<typeof ReviewsList>[0]> = {}) {
  return renderToStaticMarkup(
    <ReviewsList
      items={[makeReview()]}
      strings={en}
      locale="en"
      hasMore={false}
      isLoadingMore={false}
      onLoadMore={noop}
      onReply={noop}
      {...props}
    />,
  );
}

function renderDialog(props: Partial<Parameters<typeof ReplyDialog>[0]> = {}) {
  return renderToStaticMarkup(
    <ReplyDialog strings={en} isSubmitting={false} error={null} onConfirm={noop} onClose={noop} {...props} />,
  );
}

describe("ReviewsSection", () => {
  it("starts with the shimmer skeleton, not a spinner", () => {
    const html = renderToStaticMarkup(<ReviewsSection />);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain(`aria-label="${en.common.loading}"`);
  });
});

describe("ReviewsFilters", () => {
  it("shows all, not replied and low chips with the selected one pressed and the branch select", () => {
    const html = renderToStaticMarkup(
      <ReviewsFilters
        filter="unreplied"
        branchId=""
        branches={[{ branchId: "b1", name: "Zamalek" }]}
        strings={en}
        onFilterChange={noop}
        onBranchChange={noop}
      />,
    );
    for (const label of Object.values(en.reviews.filters)) expect(html).toContain(label);
    expect(html).toMatch(new RegExp(`aria-pressed="true"[^>]*>${en.reviews.filters.unreplied}<`));
    expect(html).toContain(en.reviews.allBranches);
  });

  it("renders Arabic labels", () => {
    const html = renderToStaticMarkup(
      <ReviewsFilters filter="all" branchId="" branches={[]} strings={ar} onFilterChange={noop} onBranchChange={noop} />,
    );
    expect(html).toContain(ar.reviews.filters.low);
    expect(html).toContain(ar.reviews.allBranches);
  });
});

describe("ReviewsList", () => {
  it("renders the first name, stars, three scores, tags, comment, services, visit date and reply action", () => {
    const html = renderList();
    expect(html).toContain("Mona");
    expect(html).toContain(en.reviews.stars.replace("{rating}", "4.0"));
    expect(html).toContain(en.reviews.categories.cleanliness);
    expect(html).toContain(en.reviews.categories.waiting_time);
    expect(html).toContain(en.reviews.categories.doctor_efficiency);
    expect(html).toContain("5/5");
    expect(html).toContain(en.reviews.tags.friendly_doctor);
    expect(html).toContain("Very kind staff.");
    expect(html).toContain("Checkup");
    expect(html).toContain("Nov 10, 2026");
    expect(html).toContain(`>${en.reviews.reply.action}<`);
  });

  it("shows the anonymous label and the saved reply without a reply action", () => {
    const html = renderList({
      items: [
        makeReview({
          firstName: null,
          anonymous: true,
          reply: { text: "Thank you!", createdAtMs: 1 },
          canReply: false,
          editedAtMs: 2,
        }),
      ],
    });
    expect(html).toContain(en.reviews.anonymous);
    expect(html).not.toContain("Mona");
    expect(html).toContain(en.reviews.reply.yourReply);
    expect(html).toContain("Thank you!");
    expect(html).toContain(en.reviews.edited);
    expect(html).not.toContain(`>${en.reviews.reply.action}<`);
  });

  it("shows the empty state and paging", () => {
    expect(renderList({ items: [] })).toContain(en.reviews.empty);
    expect(renderList({ hasMore: true })).toContain(en.reviews.loadMore);
    expect(renderList({ hasMore: true, isLoadingMore: true })).toContain(en.reviews.loadingMore);
  });

  it("renders Arabic copy with Western digits and Arabic service names", () => {
    const html = renderList({ strings: ar, locale: "ar" });
    expect(html).toContain(ar.reviews.categories.cleanliness);
    expect(html).toContain("كشف");
    expect(html).toContain("2026");
    expect(html).not.toMatch(/[٠-٩]/);
  });
});

describe("ReplyDialog", () => {
  it("is a labelled dialog with the one time notice, counter and a disabled submit while empty", () => {
    const html = renderDialog();
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain(en.reviews.reply.title);
    expect(html).toContain(en.reviews.reply.once.replace("'", "&#x27;"));
    expect(html).toContain('maxLength="500"');
    expect(html).toContain("0/500");
    expect(html).toMatch(new RegExp(`disabled=""[^>]*>${en.reviews.reply.submit}<`));
  });

  it("shows the submitting label and a mapped error", () => {
    const html = renderDialog({ isSubmitting: true, error: en.errors.reviews.alreadyReplied });
    expect(html).toContain(en.reviews.reply.submitting);
    expect(html).toContain('role="alert"');
    expect(html).toContain(en.errors.reviews.alreadyReplied);
  });

  it("renders Arabic copy", () => {
    const html = renderDialog({ strings: ar });
    expect(html).toContain(ar.reviews.reply.title);
    expect(html).toContain(ar.reviews.reply.once);
  });
});
