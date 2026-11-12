import { invokeCallable } from "@/lib/callable";

/** Callable of the `vendor_dashboard` export group. */
export const PROVIDER_DASHBOARD_CALLABLE = "vendor_dashboard-getProviderDashboard";

/** Calls the provider dashboard callable and returns its raw data. Errors propagate. */
export async function invokeProviderDashboard(payload: Record<string, unknown>): Promise<unknown> {
  return invokeCallable(PROVIDER_DASHBOARD_CALLABLE, payload);
}
