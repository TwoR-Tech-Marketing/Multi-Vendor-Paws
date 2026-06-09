import { httpsCallable } from "firebase/functions";

import { firebaseFunctions } from "@/lib/firebase";

type SyncVendorAccessResponse = {
  success: boolean;
  data?: { lifted: boolean };
};

export async function syncVendorAccess(): Promise<boolean> {
  try {
    const callable = httpsCallable<void, SyncVendorAccessResponse>(
      firebaseFunctions,
      "vendors-syncVendorAccess",
    );
    const result = await callable();
    return result.data?.data?.lifted === true;
  } catch {
    return false;
  }
}
