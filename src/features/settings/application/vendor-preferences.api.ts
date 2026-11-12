import { invokeCallable } from "@/lib/callable";
import {
  decideSessionPreferences,
  type SessionPreferences,
} from "@/shared/preferences/domain/session-preferences";
import {
  normalizeVendorPreferences,
  type PreferencesScope,
  type VendorPreferences,
} from "@/shared/preferences/domain/types";

export const CALLABLE_SET_PREFERENCES = "vendor_preferences-setVendorPreferences";

export type VendorPreferencesPatch = Partial<VendorPreferences>;

/** Maps `{success, data: {preferences}}` to preferences with defaults filled. */
export function mapSetPreferencesResponse(raw: unknown): VendorPreferences {
  const body = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const data = body.data && typeof body.data === "object" ? (body.data as Record<string, unknown>) : {};
  return normalizeVendorPreferences(data.preferences);
}

/** Saves only the given keys on the vendor account. */
export async function saveVendorPreferences(
  patch: VendorPreferencesPatch,
): Promise<VendorPreferences> {
  const raw = await invokeCallable(CALLABLE_SET_PREFERENCES, patch);
  return mapSetPreferencesResponse(raw);
}

export type PreferenceChangeResult = "saved" | "local" | "failed";

type PreferenceChangeDeps = {
  apply: (patch: VendorPreferencesPatch) => void;
  save: (patch: VendorPreferencesPatch) => Promise<unknown>;
  scope: PreferencesScope;
};

/**
 * Applies a change at once, then saves it on the account. When saving fails
 * the change stays applied on this device and "failed" is returned so the
 * caller can tell the vendor. Without an account record it stays local.
 */
export async function changeAppearancePreference(
  patch: VendorPreferencesPatch,
  { apply, save, scope }: PreferenceChangeDeps,
): Promise<PreferenceChangeResult> {
  apply(patch);
  if (scope !== "account") return "local";
  try {
    await save(patch);
    return "saved";
  } catch {
    return "failed";
  }
}

type SessionSyncDeps = {
  applyAccount: (prefs: VendorPreferences) => void;
  readDevice: () => VendorPreferences;
  save: (patch: VendorPreferencesPatch) => Promise<unknown>;
};

/**
 * Runs the session-load rule once: keep the device values without an account
 * record, apply the account value when one is stored, otherwise save the
 * device values to the account (they stay on screen either way).
 * Resolves true when the account holds preferences afterwards.
 */
export async function syncSessionPreferences(
  session: SessionPreferences,
  { applyAccount, readDevice, save }: SessionSyncDeps,
): Promise<boolean> {
  const action = decideSessionPreferences(session);
  if (action === "keepDevice") return false;
  if (action === "applyAccount") {
    applyAccount(session.preferences);
    return true;
  }
  try {
    await save(readDevice());
    return true;
  } catch {
    return false;
  }
}
