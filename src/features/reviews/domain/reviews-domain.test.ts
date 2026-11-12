import { describe, expect, it } from "vitest";

import { applyReply } from "@/features/reviews/domain/list-state";
import { filledStars, formatTenths, ratingBarPercent } from "@/features/reviews/domain/rating";
import { isValidReplyText, replySchema } from "@/features/reviews/domain/schemas";
import { CATEGORIES_BY_SET, type VendorReview } from "@/features/reviews/domain/types";
import { getStrings } from "@/shared/i18n/get-strings";

function review(overrides: Partial<VendorReview> = {}): VendorReview {
  return {
    appointmentId: "appt1",
    branchId: "b1",
    firstName: "Mona",
    anonymous: false,
    ratings: [],
    overallTenths: 40,
    tags: [],
    comment: null,
    serviceNames: [],
    appointmentStartAtMs: null,
    createdAtMs: null,
    editedAtMs: null,
    reply: null,
    canReply: true,
    ...overrides,
  };
}

describe("reply schema", () => {
  it("accepts 1 to 500 characters after trimming", () => {
    expect(isValidReplyText("a")).toBe(true);
    expect(isValidReplyText(`  ${"a".repeat(500)}  `)).toBe(true);
    expect(isValidReplyText("")).toBe(false);
    expect(isValidReplyText("   ")).toBe(false);
    expect(isValidReplyText("a".repeat(501))).toBe(false);
  });

  it("returns the trimmed payload and needs an appointment id", () => {
    expect(replySchema.parse({ appointmentId: "a1", text: " hi " })).toEqual({
      appointmentId: "a1",
      text: "hi",
    });
    expect(replySchema.safeParse({ appointmentId: "", text: "hi" }).success).toBe(false);
  });
});

describe("rating helpers", () => {
  it("formats tenths with one decimal and Western digits", () => {
    expect(formatTenths(43)).toBe("4.3");
    expect(formatTenths(50)).toBe("5.0");
    expect(formatTenths(10)).toBe("1.0");
    expect(formatTenths(null)).toBe("");
  });

  it("fills stars half up and sizes bars on the 5 point scale", () => {
    expect(filledStars(44)).toBe(4);
    expect(filledStars(45)).toBe(5);
    expect(filledStars(null)).toBe(0);
    expect(ratingBarPercent(40)).toBe(80);
    expect(ratingBarPercent(50)).toBe(100);
    expect(ratingBarPercent(null)).toBe(0);
  });
});

describe("applyReply", () => {
  it("uses the server copy when present and blocks a second reply", () => {
    const items = [review(), review({ appointmentId: "appt2" })];
    const server = review({ reply: { text: "Thanks", createdAtMs: 9 }, canReply: true });
    const next = applyReply(items, "appt1", server, "ignored");
    expect(next[0].reply).toEqual({ text: "Thanks", createdAtMs: 9 });
    expect(next[0].canReply).toBe(false);
    expect(next[1]).toBe(items[1]);
  });

  it("falls back to the typed text when the server copy is missing", () => {
    const next = applyReply([review()], "appt1", null, "  Thank you ");
    expect(next[0].reply).toEqual({ text: "Thank you", createdAtMs: null });
    expect(next[0].canReply).toBe(false);
  });
});

describe("category and tag labels", () => {
  it("has English and Arabic labels for every category and tag", () => {
    for (const locale of ["en", "ar"] as const) {
      const t = getStrings(locale).reviews;
      for (const ids of Object.values(CATEGORIES_BY_SET)) {
        for (const id of ids) expect(t.categories[id]).toBeTruthy();
      }
      expect(Object.keys(t.tags)).toHaveLength(8);
    }
    expect(getStrings("ar").reviews.anonymous).toBe("صاحب حيوان أليف");
    expect(getStrings("en").reviews.anonymous).toBe("Pet owner");
    expect(getStrings("ar").reviews.categories.doctor_efficiency).toBe("كفاءة الطبيب");
    expect(getStrings("ar").reviews.tags.clean_and_tidy).toBe("مكان نظيف ومرتب");
  });
});
