import { mapAuthError, VENDOR_LOGIN_FAILED_MESSAGE } from "@/features/auth/domain/errors";
import type { AppStrings } from "@/shared/i18n/types";
import { isNetworkError } from "@/shared/lib/network-error";

function errorCode(error: unknown): string {
  return error && typeof error === "object" && "code" in error && typeof error.code === "string"
    ? error.code
    : "";
}

/**
 * Localized sign in and reset copy for a failure. Never shows a raw error
 * message: wrong credentials stay generic, a lost connection gets the offline
 * copy and everything else the generic error.
 */
export function authErrorMessage(error: unknown, strings: AppStrings): string {
  if (isNetworkError(error)) return strings.states.offlineDescription;
  if (errorCode(error) === "auth/too-many-requests") return strings.auth.tooManyAttempts;
  if (mapAuthError(error) === VENDOR_LOGIN_FAILED_MESSAGE) return strings.auth.loginFailed;
  return strings.errors.generic;
}
