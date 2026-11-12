/**
 * Maps a review callable error (FirebaseError shaped: `code` like
 * "functions/failed-precondition", optional `details.reason`) to a key under
 * `errors.reviews`, or "generic". Raw messages never reach the UI.
 */

export type ReviewErrorKey = "alreadyReplied" | "notFound" | "notAllowed" | "generic";

const REASON_KEYS: Record<string, ReviewErrorKey> = {
  already_replied: "alreadyReplied",
  deleted: "notFound",
};

function read(value: unknown, key: string): unknown {
  return value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined;
}

export function mapReviewError(error: unknown): ReviewErrorKey {
  const reason = read(read(error, "details"), "reason");
  if (typeof reason === "string" && Object.hasOwn(REASON_KEYS, reason)) return REASON_KEYS[reason];
  const rawCode = read(error, "code");
  const code = typeof rawCode === "string" ? rawCode.replace(/^functions\//, "") : "";
  switch (code) {
    case "already-exists":
      return "alreadyReplied";
    case "not-found":
      return "notFound";
    case "permission-denied":
    case "unauthenticated":
      return "notAllowed";
    default:
      return "generic";
  }
}
