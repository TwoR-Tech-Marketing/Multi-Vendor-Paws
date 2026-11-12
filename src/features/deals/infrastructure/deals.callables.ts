import { httpsCallable } from "firebase/functions";

import { firebaseFunctions } from "@/lib/firebase";

/** Callable of the `vendor_deals` export group (vendor side, read only). */
export const DEAL_CALLABLE = "vendor_deals-getMyVendorDeal";

/** Calls the deal callable and returns its raw data. Errors propagate. */
export async function invokeGetMyVendorDeal(): Promise<unknown> {
  const callable = httpsCallable(firebaseFunctions, DEAL_CALLABLE);
  const result = await callable({});
  return result.data;
}
