import type { AppStrings } from "@/shared/i18n/types";

/** Largest signup logo the Storage rules accept (under 5 MB). */
export const SIGNUP_LOGO_MAX_BYTES = 5 * 1024 * 1024;

export type SignupErrorKey = keyof AppStrings["signup"]["errors"];

/**
 * A register page error kept as a key, so the alert follows the active locale.
 * Copy is resolved at render time by `resolveRegisterError`.
 */
export type RegisterError =
  | { source: "signup"; key: SignupErrorKey }
  | { source: "terms" }
  | { source: "vendorType"; key: string }
  | { source: "generic" }
  | { source: "network" };

type AccountStepInput = {
  ownerName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

type ContactStepInput = {
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signupError(key: SignupErrorKey): RegisterError {
  return { source: "signup", key };
}

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

export function accountStepError(input: AccountStepInput): RegisterError | null {
  if ([input.ownerName, input.email, input.phone].some(isBlank)) {
    return signupError("required");
  }
  if (!EMAIL_PATTERN.test(input.email.trim())) return signupError("emailInvalid");
  if (input.password.length < 8) return signupError("passwordShort");
  if (input.password !== input.confirmPassword) return signupError("passwordMismatch");
  return null;
}

export function contactStepError(input: ContactStepInput): RegisterError | null {
  if ([input.contactPhone, input.contactEmail, input.contactAddress].some(isBlank)) {
    return signupError("required");
  }
  if (!EMAIL_PATTERN.test(input.contactEmail.trim())) return signupError("emailInvalid");
  return null;
}

export function logoFileError(file: { size: number; type: string }): RegisterError | null {
  if (!file.type.startsWith("image/") || file.size >= SIGNUP_LOGO_MAX_BYTES) {
    return signupError("logoTooLarge");
  }
  return null;
}

function errorCode(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("code" in error)) return null;
  const { code } = error as { code: unknown };
  return typeof code === "string" ? code : null;
}

/** Maps a signup upload or callable failure to a localized error, never the raw message. */
export function signupSubmitError(error: unknown): RegisterError {
  const code = errorCode(error);
  if (code === "functions/already-exists" || code === "already-exists") {
    return signupError("emailInUse");
  }
  if (code === "functions/invalid-argument" || code === "invalid-argument") {
    return signupError("invalid");
  }
  if (code === "auth/network-request-failed" || code === "storage/retry-limit-exceeded") {
    return { source: "network" };
  }
  if (error instanceof TypeError) return { source: "network" };
  return { source: "generic" };
}

export function resolveRegisterError(error: RegisterError, strings: AppStrings): string {
  switch (error.source) {
    case "signup":
      return strings.signup.errors[error.key];
    case "terms":
      return strings.signup.termsRequired;
    case "vendorType": {
      const messages: Record<string, string> = strings.vendorTypes.errors;
      return messages[error.key] ?? strings.errors.generic;
    }
    case "network":
      return strings.errors.networkError;
    default:
      return strings.errors.generic;
  }
}
