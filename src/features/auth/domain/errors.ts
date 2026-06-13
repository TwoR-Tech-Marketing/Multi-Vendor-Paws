import { FirebaseError } from "firebase/app";

import { Strings } from "@/constants/strings";
import { ApiClientError } from "@/lib/auth-client";

/** Generic message — do not reveal whether email exists or which email to use. */
export const VENDOR_LOGIN_FAILED_MESSAGE = "Invalid email or password.";

export function mapAuthError(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.status === 401 || error.status === 403) {
      return VENDOR_LOGIN_FAILED_MESSAGE;
    }
    return error.message || Strings.errors.generic;
  }

  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/user-not-found":
      case "auth/wrong-password":
        return VENDOR_LOGIN_FAILED_MESSAGE;
      case "auth/user-disabled":
        return VENDOR_LOGIN_FAILED_MESSAGE;
      case "auth/too-many-requests":
        return "Too many attempts. Please try again later.";
      case "functions/already-exists":
        return "An account or pending request already exists for this email.";
      case "functions/invalid-argument":
        return error.message || "Please check your information and try again.";
      default:
        return error.message;
    }
  }

  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
