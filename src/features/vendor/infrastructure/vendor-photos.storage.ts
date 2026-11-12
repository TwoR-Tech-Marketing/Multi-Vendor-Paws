import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { firebaseStorage } from "@/lib/firebase";
import { StoragePaths } from "@/lib/storage-paths";

/**
 * Uploads a clinic or groomer photo for the profile change form to the
 * vendor's own Storage folder (`vendors/{vendorId}/photos/...`) and returns
 * its download URL.
 */
export async function uploadVendorProviderPhoto(vendorId: string, file: File): Promise<string> {
  const objectRef = ref(firebaseStorage, StoragePaths.vendorProviderPhoto(vendorId, file.name));
  await uploadBytes(objectRef, file, { contentType: file.type || undefined });
  return getDownloadURL(objectRef);
}
