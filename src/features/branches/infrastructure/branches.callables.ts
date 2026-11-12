import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { invokeCallable } from "@/lib/callable";
import { ensureClientAuth } from "@/lib/client-auth";
import { firebaseStorage } from "@/lib/firebase";
import { StoragePaths } from "@/lib/storage-paths";

/** Callable names of the `vendor_branches` export group. */
export const BRANCH_CALLABLES = {
  list: "vendor_branches-listVendorBranches",
  get: "vendor_branches-getVendorBranch",
  create: "vendor_branches-createVendorBranch",
  update: "vendor_branches-updateVendorBranch",
  setStatus: "vendor_branches-setVendorBranchStatus",
  createService: "vendor_branches-createVendorBranchService",
  updateService: "vendor_branches-updateVendorBranchService",
  setServiceStatus: "vendor_branches-setVendorBranchServiceStatus",
  duplicateServices: "vendor_branches-duplicateVendorBranchServices",
  deals: "vendor_branches-getVendorBranchDeals",
} as const;

export type BranchCallableName = (typeof BRANCH_CALLABLES)[keyof typeof BRANCH_CALLABLES];

/** Calls one branches callable and returns its raw data. Errors propagate. */
export async function invokeBranchCallable(
  name: BranchCallableName,
  payload: Record<string, unknown>,
): Promise<unknown> {
  return invokeCallable(name, payload);
}

/** Uploads a service photo to the caller's branch folder; returns its download URL. */
export async function uploadServicePhotoFile(
  vendorId: string,
  branchId: string,
  serviceId: string,
  file: File,
): Promise<string> {
  await ensureClientAuth();
  const objectRef = ref(
    firebaseStorage,
    StoragePaths.vendorServicePhoto(vendorId, branchId, serviceId, file.name),
  );
  await uploadBytes(objectRef, file);
  return getDownloadURL(objectRef);
}
