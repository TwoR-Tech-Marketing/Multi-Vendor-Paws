import {
  normalizeVendorPreferences,
  type PreferencesScope,
  type VendorPreferences,
} from "@/shared/preferences/domain/types";

/** Appearance and language as the session reports them. */
export type SessionPreferences = {
  preferences: VendorPreferences;
  preferencesScope: PreferencesScope;
  /** True only when the account record already stores preferences. */
  preferencesSet: boolean;
};

/**
 * Reads the preferences fields of a session resolution. Absent or unknown
 * values mean local scope, defaults filled and nothing stored yet.
 */
export function mapSessionPreferences(raw: unknown): SessionPreferences {
  const data = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const preferencesScope: PreferencesScope = data.preferencesScope === "account" ? "account" : "local";
  return {
    preferences: normalizeVendorPreferences(data.preferences),
    preferencesScope,
    preferencesSet: preferencesScope === "account" && data.preferencesSet === true,
  };
}

/**
 * What to do with preferences once the session loads:
 * - "keepDevice": no account record, keep the device values, never save.
 * - "applyAccount": the account value replaces the device values.
 * - "saveDevice": the account has none yet, save the device values once.
 */
export type SessionPreferencesAction = "keepDevice" | "applyAccount" | "saveDevice";

export function decideSessionPreferences(
  session: Pick<SessionPreferences, "preferencesScope" | "preferencesSet">,
): SessionPreferencesAction {
  if (session.preferencesScope !== "account") return "keepDevice";
  return session.preferencesSet ? "applyAccount" : "saveDevice";
}
