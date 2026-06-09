import { doc, getDoc } from "firebase/firestore";

import { firestore } from "@/lib/firebase";
import type { VendorAccountStatus, VendorProfile } from "@/features/auth/domain/types";

type UserDoc = {
  role?: string;
  accountStatus?: VendorAccountStatus;
  ownerName?: string;
  email?: string;
  vendorId?: string;
};

type VendorDoc = {
  storeName?: string;
  status?: VendorAccountStatus;
  approvalStatus?: string;
  ownerName?: string;
  email?: string;
};

export async function getVendorProfile(uid: string): Promise<VendorProfile | null> {
  const userSnap = await getDoc(doc(firestore, "users", uid));
  const vendorSnap = await getDoc(doc(firestore, "vendors", uid));

  const userData = userSnap.exists() ? (userSnap.data() as UserDoc) : null;
  const vendorData = vendorSnap.exists() ? (vendorSnap.data() as VendorDoc) : null;

  if (!userData && !vendorData) return null;

  const status =
    vendorData?.status ??
    userData?.accountStatus ??
    ("pending" as VendorAccountStatus);

  return {
    vendorId: userData?.vendorId ?? uid,
    ownerName: vendorData?.ownerName ?? userData?.ownerName ?? "Vendor",
    email: vendorData?.email ?? userData?.email ?? "",
    storeName: vendorData?.storeName ?? "Your store",
    status,
    approvalStatus: vendorData?.approvalStatus,
  };
}
