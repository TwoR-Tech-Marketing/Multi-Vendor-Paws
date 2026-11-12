/**
 * Maps a callable error (FirebaseError shaped: `code` like
 * "functions/already-exists", English `message`) to a key. Presentation turns
 * the key into localized copy; raw messages never reach the UI.
 */

export type CouponsErrorKey =
  | "codeTaken"
  | "codeInvalid"
  | "expiryInvalid"
  | "invalidField"
  | "locked"
  | "cannotResume"
  | "limit"
  | "notFound"
  | "notAllowed"
  | "generic";

function readString(error: unknown, key: "code" | "message"): string {
  if (!error || typeof error !== "object") return "";
  const value = (error as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
}

export function mapCouponsError(error: unknown): CouponsErrorKey {
  const code = readString(error, "code").replace(/^functions\//, "");
  const message = readString(error, "message").toLowerCase();

  switch (code) {
    case "already-exists":
      return "codeTaken";
    case "invalid-argument":
      if (message.startsWith("code")) return "codeInvalid";
      if (message.includes("expiresatms")) return "expiryInvalid";
      return "invalidField";
    case "failed-precondition":
      if (message.includes("resumed")) return "cannotResume";
      if (message.includes("at most")) return "limit";
      return "locked";
    case "not-found":
      return "notFound";
    case "permission-denied":
    case "unauthenticated":
      return "notAllowed";
    default:
      return "generic";
  }
}
