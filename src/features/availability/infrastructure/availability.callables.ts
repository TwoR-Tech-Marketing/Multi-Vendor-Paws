import { httpsCallable } from "firebase/functions";

import { firebaseFunctions } from "@/lib/firebase";

/** Callable names of the `vendor_availability` export group. */
export const AVAILABILITY_CALLABLES = {
  get: "vendor_availability-getBranchAvailability",
  save: "vendor_availability-saveBranchAvailability",
  setException: "vendor_availability-setBranchAvailabilityException",
  listSlots: "vendor_availability-listBranchSlots",
} as const;

export type AvailabilityCallableName =
  (typeof AVAILABILITY_CALLABLES)[keyof typeof AVAILABILITY_CALLABLES];

/** Calls one availability callable and returns its raw data. Errors propagate. */
export async function invokeAvailabilityCallable(
  name: AvailabilityCallableName,
  payload: Record<string, unknown>,
): Promise<unknown> {
  const callable = httpsCallable(firebaseFunctions, name);
  const result = await callable(payload);
  return result.data;
}
