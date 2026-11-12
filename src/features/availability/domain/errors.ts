/**
 * Maps a callable error (FirebaseError shaped: `code` like
 * "functions/aborted", English `message`, optional `details`) to a key under
 * `errors.availability`. Raw messages never reach the UI.
 */

export type AvailabilityErrorKey =
  | "invalidInterval"
  | "overlap"
  | "limit"
  | "versionChanged"
  | "conflicts"
  | "notAllowed"
  | "notFound"
  | "archived"
  | "generic";

function read(error: unknown, key: string): unknown {
  if (!error || typeof error !== "object") return undefined;
  return (error as Record<string, unknown>)[key];
}

function readString(error: unknown, key: string): string {
  const value = read(error, key);
  return typeof value === "string" ? value : "";
}

/** `details.conflicts` of a conflicts refusal, unmapped; null otherwise. */
export function conflictDetails(error: unknown): unknown[] | null {
  const details = read(error, "details");
  if (!details || typeof details !== "object") return null;
  const raw = details as Record<string, unknown>;
  return raw.reason === "conflicts" && Array.isArray(raw.conflicts) ? raw.conflicts : null;
}

export function mapAvailabilityError(error: unknown): AvailabilityErrorKey {
  const code = readString(error, "code").replace(/^functions\//, "");
  const message = readString(error, "message").toLowerCase();

  switch (code) {
    case "aborted":
      return "versionChanged";
    case "failed-precondition":
      if (conflictDetails(error)) return "conflicts";
      if (message.includes("limit")) return "limit";
      if (message.includes("archived")) return "archived";
      return "notAllowed";
    case "invalid-argument":
      if (message.includes("overlap")) return "overlap";
      if (message.includes("intervals allowed")) return "limit";
      return "invalidInterval";
    case "not-found":
      return "notFound";
    case "permission-denied":
    case "unauthenticated":
      return "notAllowed";
    default:
      return "generic";
  }
}
