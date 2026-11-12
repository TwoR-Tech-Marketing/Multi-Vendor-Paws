import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { ensureClientAuth } from "@/lib/client-auth";
import { firebaseStorage } from "@/lib/firebase";
import { StoragePaths } from "@/lib/storage-paths";

/** Storage rule limit for `vendors/{vendorId}/**` uploads. */
export const VENDOR_LOGO_MAX_BYTES = 5 * 1024 * 1024;

/**
 * Uploads a store logo for the profile change form to the vendor's own
 * Storage folder (`vendors/{vendorId}/logo/...`) and returns its download URL.
 */
export async function uploadVendorProfileLogo(vendorId: string, file: File): Promise<string> {
  await ensureClientAuth();
  const objectRef = ref(firebaseStorage, StoragePaths.vendorLogo(vendorId, file.name));
  await uploadBytes(objectRef, file, { contentType: file.type || undefined });
  return getDownloadURL(objectRef);
}
