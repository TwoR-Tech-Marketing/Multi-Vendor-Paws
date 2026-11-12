import { httpsCallable } from "firebase/functions";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { firebaseFunctions } from "@/lib/firebase";
import { firebaseStorage } from "@/lib/firebase";
import { StoragePaths } from "@/lib/storage-paths";
import type { VendorSignupPayload } from "@/features/auth/domain/types";

type SubmitSignupResponse = {
  success: boolean;
  message: string;
  data?: {
    requestId: string;
    status: string;
    vendorType?: string;
  };
};

export async function uploadVendorLogo(file: File): Promise<string> {
  const safeName = file.name.replace(/[^\w.-]/g, "_");
  const objectRef = ref(
    firebaseStorage,
    `vendor_signup_logos/${Date.now()}_${safeName}`,
  );
  await uploadBytes(objectRef, file);
  return getDownloadURL(objectRef);
}

/**
 * Uploads the optional logo before the signup request exists. The Storage
 * rules allow unauthenticated images only under `vendor_signup_requests/`.
 */
export async function uploadSignupLogo(file: File): Promise<string> {
  const objectRef = ref(
    firebaseStorage,
    StoragePaths.signupRequestLogo(crypto.randomUUID(), file.name),
  );
  await uploadBytes(objectRef, file, { contentType: file.type });
  return getDownloadURL(objectRef);
}

export async function submitVendorSignupRequest(
  payload: VendorSignupPayload,
): Promise<SubmitSignupResponse> {
  const callable = httpsCallable<VendorSignupPayload, SubmitSignupResponse>(
    firebaseFunctions,
    "vendor_signup-submitVendorSignupRequest",
  );

  const result = await callable(payload);
  return result.data;
}
