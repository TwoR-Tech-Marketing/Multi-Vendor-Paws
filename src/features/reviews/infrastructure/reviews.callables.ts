import { httpsCallable } from "firebase/functions";

import { firebaseFunctions } from "@/lib/firebase";

/** Provider callables of the `appointment_reviews` export group. */
export const REVIEW_CALLABLES = {
  list: "appointment_reviews-listMyVendorReviews",
  reply: "appointment_reviews-replyToReview",
} as const;

export type ReviewCallableName = (typeof REVIEW_CALLABLES)[keyof typeof REVIEW_CALLABLES];

/** Calls one review callable and returns its raw data. Errors propagate. */
export async function invokeReviewCallable(
  name: ReviewCallableName,
  payload: Record<string, unknown>,
): Promise<unknown> {
  const callable = httpsCallable(firebaseFunctions, name);
  const result = await callable(payload);
  return result.data;
}
