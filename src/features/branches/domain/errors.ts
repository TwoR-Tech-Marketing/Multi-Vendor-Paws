/**
 * Maps a callable error (FirebaseError shaped: `code` like
 * "functions/failed-precondition", English `message`) to a key under
 * `errors.branches`. Presentation turns the key into localized copy; raw
 * messages never reach the UI.
 */

export type BranchesErrorKey =
  | "outsideEgypt"
  | "invalidLocation"
  | "limit"
  | "archived"
  | "notFound"
  | "notAllowed"
  | "invalidField"
  | "generic";

function readString(error: unknown, key: "code" | "message"): string {
  if (!error || typeof error !== "object") return "";
  const value = (error as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
}

export function mapBranchesError(error: unknown): BranchesErrorKey {
  const code = readString(error, "code").replace(/^functions\//, "");
  const message = readString(error, "message").toLowerCase();

  switch (code) {
    case "invalid-argument":
      if (message.includes("outside egypt")) return "outsideEgypt";
      if (message.includes("location")) return "invalidLocation";
      return "invalidField";
    case "failed-precondition":
      if (message.includes("archived")) return "archived";
      return "limit";
    case "not-found":
      return "notFound";
    case "permission-denied":
    case "unauthenticated":
      return "notAllowed";
    default:
      return "generic";
  }
}
