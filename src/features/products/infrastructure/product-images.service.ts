import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { ensureClientAuth } from "@/lib/client-auth";
import { firebaseStorage } from "@/lib/firebase";
import { StoragePaths } from "@/lib/storage-paths";

export async function uploadProductImage(
  vendorId: string,
  productId: string,
  file: File,
): Promise<string> {
  await ensureClientAuth();
  const objectRef = ref(
    firebaseStorage,
    StoragePaths.vendorProductImage(vendorId, productId, file.name),
  );
  await uploadBytes(objectRef, file);
  return getDownloadURL(objectRef);
}
