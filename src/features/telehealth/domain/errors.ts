/**
 * Maps a callable error (FirebaseError shaped: `code` like
 * "functions/failed-precondition", `details.reason`) to a key. Presentation
 * turns the key into localized copy; raw messages never reach the UI.
 */

export type TelehealthErrorKey =
  | "taken"
  | "expired"
  | "offline"
  | "limit"
  | "closed"
  | "notFound"
  | "notAllowed"
  | "invalidField"
  | "generic";

const REASONS = ["taken", "expired", "offline", "limit", "closed"] as const;

function readField(error: unknown, key: string): unknown {
  if (!error || typeof error !== "object") return undefined;
  return (error as Record<string, unknown>)[key];
}

export function mapTelehealthError(error: unknown): TelehealthErrorKey {
  const rawCode = readField(error, "code");
  const code = typeof rawCode === "string" ? rawCode.replace(/^functions\//, "") : "";
  switch (code) {
    case "failed-precondition": {
      const details = readField(error, "details");
      const reason = readField(details, "reason");
      return REASONS.find((r) => r === reason) ?? "closed";
    }
    case "not-found":
      return "notFound";
    case "permission-denied":
    case "unauthenticated":
      return "notAllowed";
    case "invalid-argument":
      return "invalidField";
    default:
      return "generic";
  }
}
