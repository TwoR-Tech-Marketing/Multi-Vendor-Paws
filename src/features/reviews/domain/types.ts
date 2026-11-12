/**
 * Appointment reviews as the provider sees them. Category and tag ids are
 * stable; display labels come from `reviews.categories.<id>` and
 * `reviews.tags.<id>`. Buyer identity is a first name or anonymous only.
 */

export const REVIEW_CATEGORY_SETS = ["clinic", "groomer"] as const;

export type ReviewCategorySet = (typeof REVIEW_CATEGORY_SETS)[number];

export const REVIEW_CATEGORY_IDS = [
  "cleanliness",
  "waiting_time",
  "doctor_efficiency",
  "grooming_quality",
  "pet_handling",
  "punctuality",
] as const;

export type ReviewCategoryId = (typeof REVIEW_CATEGORY_IDS)[number];

export const REVIEW_TAG_IDS = [
  "friendly_doctor",
  "clean_clinic",
  "long_waiting_time",
  "clear_explanation",
  "good_with_nervous_pets",
  "great_result",
  "gentle_handling",
  "clean_and_tidy",
] as const;

export type ReviewTagId = (typeof REVIEW_TAG_IDS)[number];

/** The three categories of each set, in display order. */
export const CATEGORIES_BY_SET: Record<ReviewCategorySet, readonly ReviewCategoryId[]> = {
  clinic: ["cleanliness", "waiting_time", "doctor_efficiency"],
  groomer: ["grooming_quality", "pet_handling", "punctuality"],
};

export const REVIEW_FILTERS = ["all", "unreplied", "low"] as const;

export type ReviewFilter = (typeof REVIEW_FILTERS)[number];

export const REVIEW_LIMITS = {
  replyMin: 1,
  replyMax: 500,
  pageSize: 20,
} as const;

export type LocalizedServiceName = { serviceId: string; nameEn: string; nameAr: string };

export type ReviewRating = { id: ReviewCategoryId; value: number };

export type ReviewReply = { text: string; createdAtMs: number | null };

export type VendorReview = {
  appointmentId: string;
  branchId: string;
  firstName: string | null;
  anonymous: boolean;
  /** The three category ratings, integers 1 to 5, in the order the server sent. */
  ratings: ReviewRating[];
  /** Overall rating in tenths (43 means 4.3), or null when missing. */
  overallTenths: number | null;
  tags: ReviewTagId[];
  comment: string | null;
  serviceNames: LocalizedServiceName[];
  appointmentStartAtMs: number | null;
  createdAtMs: number | null;
  editedAtMs: number | null;
  reply: ReviewReply | null;
  canReply: boolean;
};

export type ReviewPage = { items: VendorReview[]; nextCursor: string | null };

export type ReviewListRequest = {
  filter: ReviewFilter;
  branchId?: string;
  pageSize?: number;
  cursor?: string;
};
