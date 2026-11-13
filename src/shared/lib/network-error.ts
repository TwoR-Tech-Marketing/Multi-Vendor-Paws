/** Error codes that mean the request never reached the server. */
const NETWORK_CODES = new Set([
  "unavailable",
  "functions/unavailable",
  "deadline-exceeded",
  "functions/deadline-exceeded",
  "auth/network-request-failed",
]);

function isBrowserOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

/**
 * True when a failed load looks like a lost connection rather than a server
 * error: the browser reports offline, fetch itself failed (TypeError), or the
 * error carries a network code. Lets list and detail screens show the offline
 * state with a retry instead of the generic error.
 */
export function isNetworkError(error: unknown, offline: boolean = isBrowserOffline()): boolean {
  if (offline) return true;
  if (error instanceof TypeError) return true;
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code: unknown }).code;
    return typeof code === "string" && NETWORK_CODES.has(code);
  }
  return false;
}
