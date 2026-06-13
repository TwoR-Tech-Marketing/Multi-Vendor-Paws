import "server-only";

import type { Timestamp } from "firebase-admin/firestore";

import type { VendorAccountStatus } from "@/features/auth/domain/types";
import type { VendorStoreProfile } from "@/features/vendor/domain/types";
import { getAdminFirestore } from "@/lib/firebase-admin";

type UserDoc = {
  role?: string;
  accountStatus?: VendorAccountStatus;
  ownerName?: string;
  email?: string;
  phone?: string;
  vendorId?: string;
  is_banned?: boolean;
  ban_reason?: string;
  ban_expires_at?: Timestamp;
  suspend_reason?: string;
  suspend_expires_at?: Timestamp;
};

type VendorDoc = {
  ownerName?: string;
  email?: string;
  phone?: string;
  storeName?: string;
  storeDescription?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  logoUrl?: string | null;
  status?: VendorAccountStatus;
  approvalStatus?: string;
  isBanned?: boolean;
  banReason?: string;
  banExpiresAt?: Timestamp;
  suspendReason?: string;
  suspendExpiresAt?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

type SignupRequestDoc = {
  ownerName?: string;
  email?: string;
  phone?: string;
  storeName?: string;
  storeDescription?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactAddress?: string;
  logoUrl?: string | null;
  status?: string;
  authUid?: string;
  createdAt?: Timestamp;
};

function toDate(value: Timestamp | undefined): Date | null {
  if (!value?.toDate) return null;
  return value.toDate();
}

function resolveRestriction(
  userData: UserDoc | null,
  vendorData: VendorDoc | null,
): Pick<
  VendorStoreProfile,
  | "restrictionType"
  | "restrictionReason"
  | "restrictionExpiresAt"
  | "isPermanentRestriction"
> {
  if (vendorData?.isBanned || userData?.is_banned) {
    const expiresAt = toDate(vendorData?.banExpiresAt ?? userData?.ban_expires_at);
    return {
      restrictionType: "ban",
      restrictionReason:
        vendorData?.banReason ?? userData?.ban_reason ?? "No reason provided.",
      restrictionExpiresAt: expiresAt,
      isPermanentRestriction: !expiresAt,
    };
  }

  const isSuspended =
    vendorData?.status === "suspended" || userData?.accountStatus === "suspended";

  if (isSuspended) {
    const expiresAt = toDate(
      vendorData?.suspendExpiresAt ?? userData?.suspend_expires_at,
    );
    return {
      restrictionType: "suspend",
      restrictionReason:
        vendorData?.suspendReason ??
        userData?.suspend_reason ??
        "No reason provided.",
      restrictionExpiresAt: expiresAt,
      isPermanentRestriction: !expiresAt,
    };
  }

  return {};
}

async function getSignupRequestByAuthUid(
  uid: string,
): Promise<SignupRequestDoc | null> {
  const snap = await getAdminFirestore()
    .collection("vendor_signup_requests")
    .where("authUid", "==", uid)
    .limit(1)
    .get();

  if (snap.empty) return null;
  return snap.docs[0].data() as SignupRequestDoc;
}

export async function getVendorStoreProfileAdmin(
  uid: string,
  loginEmail: string,
): Promise<VendorStoreProfile | null> {
  const [userSnap, vendorSnap, signupRequest] = await Promise.all([
    getAdminFirestore().collection("users").doc(uid).get(),
    getAdminFirestore().collection("vendors").doc(uid).get(),
    getSignupRequestByAuthUid(uid),
  ]);

  const userData = userSnap.exists ? (userSnap.data() as UserDoc) : null;
  const vendorData = vendorSnap.exists ? (vendorSnap.data() as VendorDoc) : null;

  const isVendor = userData?.role === "vendor" || vendorData != null || signupRequest != null;
  if (!isVendor) return null;

  const status =
    vendorData?.status ??
    (userData?.accountStatus as VendorAccountStatus | undefined) ??
    (signupRequest?.status === "pending" ? "pending" : "pending");

  return {
    vendorId: userData?.vendorId ?? uid,
    ownerName:
      vendorData?.ownerName ??
      userData?.ownerName ??
      signupRequest?.ownerName ??
      "Vendor",
    email:
      vendorData?.email ??
      userData?.email ??
      signupRequest?.email ??
      loginEmail,
    phone: vendorData?.phone ?? userData?.phone ?? signupRequest?.phone ?? "",
    storeName:
      vendorData?.storeName ?? signupRequest?.storeName ?? "Your store",
    storeDescription:
      vendorData?.storeDescription ?? signupRequest?.storeDescription ?? "",
    contactPhone:
      vendorData?.contactPhone ?? signupRequest?.contactPhone ?? "",
    contactEmail:
      vendorData?.contactEmail ?? signupRequest?.contactEmail ?? "",
    contactAddress:
      vendorData?.contactAddress ?? signupRequest?.contactAddress ?? "",
    logoUrl:
      vendorData?.logoUrl ?? signupRequest?.logoUrl ?? null,
    status,
    approvalStatus: vendorData?.approvalStatus,
    createdAt: toDate(vendorData?.createdAt ?? signupRequest?.createdAt),
    updatedAt: toDate(vendorData?.updatedAt),
    ...resolveRestriction(userData, vendorData),
  };
}
