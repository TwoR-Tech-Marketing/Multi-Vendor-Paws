import { invokeCallable } from "@/lib/callable";

/** Callable of the `vendor_deals` export group (vendor side, read only). */
export const DEAL_CALLABLE = "vendor_deals-getMyVendorDeal";

/** Calls the deal callable and returns its raw data. Errors propagate. */
export async function invokeGetMyVendorDeal(): Promise<unknown> {
  return invokeCallable(DEAL_CALLABLE, {});
}
