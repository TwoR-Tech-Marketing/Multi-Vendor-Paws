import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ensureClientAuth: vi.fn(async () => undefined), callableFn: vi.fn(), httpsCallable: vi.fn() }));

vi.mock("firebase/functions", () => ({ httpsCallable: mocks.httpsCallable }));
vi.mock("@/lib/client-auth", () => ({ ensureClientAuth: mocks.ensureClientAuth }));
vi.mock("@/lib/firebase", () => ({ firebaseFunctions: {} }));

import {
  listMyVendorReviews,
  mapReviewPage,
  mapVendorReview,
  replyToReview,
} from "@/features/reviews/application/reviews.api";
import { reviewErrorMessage } from "@/features/reviews/presentation/reviews-copy";
import { RAW_REVIEW } from "@/features/reviews/presentation/test-fixtures";
import { getStrings } from "@/shared/i18n/get-strings";

beforeEach(() => {
  mocks.callableFn.mockReset();
  mocks.httpsCallable.mockReset();
  mocks.httpsCallable.mockImplementation(() => mocks.callableFn);
});

function lastCall() {
  return {
    name: mocks.httpsCallable.mock.calls.at(-1)?.[1],
    payload: mocks.callableFn.mock.calls.at(-1)?.[0],
  };
}

describe("review mapping", () => {
  it("maps a vendor review and keeps only the first name of the buyer", () => {
    const review = mapVendorReview({ ...RAW_REVIEW, buyerUid: "u1", phone: "010", deletedBy: "admin" });
    expect(review).toEqual({
      appointmentId: "appt1",
      branchId: "b1",
      firstName: "Mona",
      anonymous: false,
      ratings: [
        { id: "cleanliness", value: 5 },
        { id: "waiting_time", value: 3 },
        { id: "doctor_efficiency", value: 4 },
      ],
      overallTenths: 40,
      tags: ["friendly_doctor", "long_waiting_time"],
      comment: "Very kind staff.",
      serviceNames: [{ serviceId: "s1", nameEn: "Checkup", nameAr: "كشف" }],
      appointmentStartAtMs: RAW_REVIEW.appointmentStartAtMs,
      createdAtMs: RAW_REVIEW.createdAtMs,
      editedAtMs: null,
      reply: null,
      canReply: true,
    });
    expect(JSON.stringify(review)).not.toMatch(/u1|010|admin/);
  });

  it("shows anonymous buyers without a name and drops invalid ratings and tags", () => {
    const review = mapVendorReview({
      ...RAW_REVIEW,
      buyerDisplay: { firstName: "Mona", anonymous: true },
      ratings: { cleanliness: 6, waiting_time: 2.5, doctor_efficiency: 1 },
      tags: ["friendly_doctor", "unknown_tag", 3],
    });
    expect(review.firstName).toBeNull();
    expect(review.anonymous).toBe(true);
    expect(review.ratings).toEqual([{ id: "doctor_efficiency", value: 1 }]);
    expect(review.tags).toEqual(["friendly_doctor"]);
    expect(mapVendorReview({ ...RAW_REVIEW, buyerDisplay: { firstName: null } }).anonymous).toBe(true);
  });

  it("never offers a reply once one exists", () => {
    const review = mapVendorReview({
      ...RAW_REVIEW,
      reply: { text: "Thank you", createdAtMs: 5 },
      canReply: true,
    });
    expect(review.reply).toEqual({ text: "Thank you", createdAtMs: 5 });
    expect(review.canReply).toBe(false);
  });

  it("maps a page and drops rows without an id", () => {
    const page = mapReviewPage({ items: [RAW_REVIEW, { appointmentId: "" }], nextCursor: "c2" });
    expect(page.items).toHaveLength(1);
    expect(page.nextCursor).toBe("c2");
    expect(mapReviewPage(null)).toEqual({ items: [], nextCursor: null });
  });
});

describe("review callables", () => {
  it("lists with the filter, branch, page size and cursor only when set", async () => {
    mocks.callableFn.mockResolvedValue({ data: { ok: true, items: [RAW_REVIEW], nextCursor: null } });
    const page = await listMyVendorReviews({ filter: "low", branchId: "b1", pageSize: 20, cursor: "c1" });
    expect(lastCall()).toEqual({
      name: "appointment_reviews-listMyVendorReviews",
      payload: { filter: "low", branchId: "b1", pageSize: 20, cursor: "c1" },
    });
    expect(page.items[0].appointmentId).toBe("appt1");

    await listMyVendorReviews({ filter: "all" });
    expect(lastCall().payload).toEqual({ filter: "all" });
  });

  it("replies with trimmed text and maps the returned review", async () => {
    mocks.callableFn.mockResolvedValue({
      data: { ok: true, review: { ...RAW_REVIEW, reply: { text: "Thanks", createdAtMs: 9 }, canReply: false } },
    });
    const review = await replyToReview("appt1", "  Thanks  ");
    expect(lastCall()).toEqual({
      name: "appointment_reviews-replyToReview",
      payload: { appointmentId: "appt1", text: "Thanks" },
    });
    expect(review.reply?.text).toBe("Thanks");
    expect(review.canReply).toBe(false);
  });

  it("refuses empty or too long replies before calling the server", async () => {
    await expect(replyToReview("appt1", "   ")).rejects.toThrow();
    await expect(replyToReview("appt1", "x".repeat(501))).rejects.toThrow();
    expect(mocks.callableFn).not.toHaveBeenCalled();
  });
});

describe("review error copy", () => {
  const en = getStrings("en");
  const ar = getStrings("ar");

  it.each([
    [{ code: "functions/failed-precondition", details: { reason: "already_replied" } }, en.errors.reviews.alreadyReplied],
    [{ code: "functions/already-exists" }, en.errors.reviews.alreadyReplied],
    [{ code: "functions/failed-precondition", details: { reason: "deleted" } }, en.errors.reviews.notFound],
    [{ code: "functions/not-found" }, en.errors.reviews.notFound],
    [{ code: "functions/permission-denied" }, en.errors.reviews.notAllowed],
    [{ code: "functions/unauthenticated" }, en.errors.reviews.notAllowed],
    [{ code: "functions/internal", message: "stack trace" }, en.errors.generic],
    [new Error("boom"), en.errors.generic],
  ])("maps %j to localized copy", (error, expected) => {
    expect(reviewErrorMessage(error, en)).toBe(expected);
  });

  it("uses Arabic copy in Arabic", () => {
    expect(reviewErrorMessage({ code: "functions/not-found" }, ar)).toBe(ar.errors.reviews.notFound);
  });
});
