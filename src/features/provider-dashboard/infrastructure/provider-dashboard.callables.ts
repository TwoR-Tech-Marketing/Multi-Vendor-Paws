import { httpsCallable } from "firebase/functions";

import { firebaseFunctions } from "@/lib/firebase";

/** Callable of the `vendor_dashboard` export group. */
export const PROVIDER_DASHBOARD_CALLABLE = "vendor_dashboard-getProviderDashboard";

/** Calls the provider dashboard callable and returns its raw data. Errors propagate. */
export async function invokeProviderDashboard(payload: Record<string, unknown>): Promise<unknown> {
  const callable = httpsCallable(firebaseFunctions, PROVIDER_DASHBOARD_CALLABLE);
  const result = await callable(payload);
  return result.data;
}
