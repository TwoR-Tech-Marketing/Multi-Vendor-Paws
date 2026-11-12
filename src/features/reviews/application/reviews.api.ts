import { replySchema } from "@/features/reviews/domain/schemas";
import {
  REVIEW_CATEGORY_IDS,
  REVIEW_TAG_IDS,
  type LocalizedServiceName,
  type ReviewListRequest,
  type ReviewPage,
  type ReviewRating,
  type ReviewReply,
  type ReviewTagId,
  type VendorReview,
} from "@/features/reviews/domain/types";
import {
  REVIEW_CALLABLES,
  invokeReviewCallable,
} from "@/features/reviews/infrastructure/reviews.callables";

/**
 * Provider reviews through the shared `appointment_reviews` callables. No BFF
 * and no Firestore reads. The vendor id is the caller's auth uid on the
 * server; nothing here sends one. Buyer identity arrives as a first name or
 * anonymous only.
 */

type Raw = Record<string, unknown>;

function asObject(value: unknown): Raw {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Raw) : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function asMillis(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asIntOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

function mapRatings(value: unknown): ReviewRating[] {
  const raw = asObject(value);
  return REVIEW_CATEGORY_IDS.flatMap((id) => {
    const rating = asIntOrNull(raw[id]);
    return rating !== null && rating >= 1 && rating <= 5 ? [{ id, value: rating }] : [];
  });
}

function mapTags(value: unknown): ReviewTagId[] {
  return asArray(value).filter((tag): tag is ReviewTagId =>
    (REVIEW_TAG_IDS as readonly unknown[]).includes(tag),
  );
}

function mapServiceName(value: unknown): LocalizedServiceName {
  const raw = asObject(value);
  const nameEn = asString(raw.nameEn);
  return { serviceId: asString(raw.serviceId), nameEn, nameAr: asString(raw.nameAr) || nameEn };
}

function mapReply(value: unknown): ReviewReply | null {
  const raw = asObject(value);
  const text = asNullableString(raw.text);
  return text ? { text, createdAtMs: asMillis(raw.createdAtMs) } : null;
}

export function mapVendorReview(value: unknown): VendorReview {
  const raw = asObject(value);
  const buyer = asObject(raw.buyerDisplay);
  const anonymous = buyer.anonymous === true;
  const firstName = anonymous ? null : asNullableString(buyer.firstName);
  const reply = mapReply(raw.reply);
  return {
    appointmentId: asString(raw.appointmentId),
    branchId: asString(raw.branchId),
    firstName,
    anonymous: firstName === null,
    ratings: mapRatings(raw.ratings),
    overallTenths: asIntOrNull(raw.overallTenths),
    tags: mapTags(raw.tags),
    comment: asNullableString(raw.comment),
    serviceNames: asArray(raw.serviceNames).map(mapServiceName),
    appointmentStartAtMs: asMillis(raw.appointmentStartAtMs),
    createdAtMs: asMillis(raw.createdAtMs),
    editedAtMs: asMillis(raw.editedAtMs),
    reply,
    canReply: raw.canReply === true && reply === null,
  };
}

export function mapReviewPage(value: unknown): ReviewPage {
  const raw = asObject(value);
  return {
    items: asArray(raw.items)
      .map(mapVendorReview)
      .filter((review) => review.appointmentId),
    nextCursor: asNullableString(raw.nextCursor),
  };
}

export async function listMyVendorReviews(request: ReviewListRequest): Promise<ReviewPage> {
  const payload: Record<string, unknown> = { filter: request.filter };
  if (request.branchId) payload.branchId = request.branchId;
  if (request.pageSize) payload.pageSize = request.pageSize;
  if (request.cursor) payload.cursor = request.cursor;
  return mapReviewPage(await invokeReviewCallable(REVIEW_CALLABLES.list, payload));
}

/** Posts the one allowed reply. Throws on invalid text before calling the server. */
export async function replyToReview(appointmentId: string, text: string): Promise<VendorReview> {
  const input = replySchema.parse({ appointmentId, text });
  const data = asObject(await invokeReviewCallable(REVIEW_CALLABLES.reply, input));
  return mapVendorReview(data.review);
}
