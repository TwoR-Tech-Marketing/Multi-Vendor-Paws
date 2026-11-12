import { invokeCallable } from "@/lib/callable";
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
