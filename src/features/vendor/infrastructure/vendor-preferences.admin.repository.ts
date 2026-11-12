import "server-only";

import {
  normalizeVendorPreferences,
  type VendorPreferences,
} from "@/shared/preferences/domain/types";
import { getAdminFirestore } from "@/lib/firebase-admin";

/**
 * Reads the preferences stored on the vendor account, defaults filled.
 * Returns null when the vendor has no account record yet (signup in progress),
 * in which case the portal keeps choices on the device only.
 */
export async function getVendorPreferencesAdmin(
  vendorId: string,
): Promise<VendorPreferences | null> {
  const snap = await getAdminFirestore().collection("vendors").doc(vendorId).get();
  if (!snap.exists) return null;
  const data = snap.data() as { preferences?: unknown } | undefined;
  return normalizeVendorPreferences(data?.preferences);
}
