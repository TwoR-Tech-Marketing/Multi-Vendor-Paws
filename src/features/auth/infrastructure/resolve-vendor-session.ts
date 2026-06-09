import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import type { User } from "firebase/auth";

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

type SignupRequestDoc = {
  email?: string;
  contactEmail?: string;
  storeName?: string;
  ownerName?: string;
  status?: string;
  authUid?: string;
};

export type VendorSessionKind =
  | "active"
  | "pending"
  | "mobile_app_account"
  | "wrong_sign_in_email"
  | "not_vendor";

export type VendorSessionResolution = {
  kind: VendorSessionKind;
  profile: VendorProfile | null;
  message: string;
};

function buildProfile(
  uid: string,
  userData: UserDoc | null,
  vendorData: VendorDoc | null,
  signupData: SignupRequestDoc | null,
): VendorProfile {
  const status =
    vendorData?.status ??
    (userData?.accountStatus as VendorAccountStatus | undefined) ??
    (signupData?.status === "pending" ? "pending" : "pending");

  return {
    vendorId: userData?.vendorId ?? uid,
    ownerName:
      vendorData?.ownerName ??
      userData?.ownerName ??
      signupData?.ownerName ??
      "Vendor",
    email:
      vendorData?.email ??
      userData?.email ??
      signupData?.email ??
      "",
    storeName:
      vendorData?.storeName ??
      signupData?.storeName ??
      "Your store",
    status,
    approvalStatus: vendorData?.approvalStatus,
  };
}

async function getSignupRequestByAuthUid(
  uid: string,
): Promise<SignupRequestDoc | null> {
  const snap = await getDocs(
    query(
      collection(firestore, "vendor_signup_requests"),
      where("authUid", "==", uid),
      limit(1),
    ),
  );

  if (snap.empty) return null;
  return snap.docs[0].data() as SignupRequestDoc;
}

async function getPendingSignupByContactEmail(
  email: string,
): Promise<(SignupRequestDoc & { signInEmail: string }) | null> {
  const normalized = email.trim().toLowerCase();
  const snap = await getDocs(
    query(
      collection(firestore, "vendor_signup_requests"),
      where("contactEmail", "==", normalized),
      where("status", "==", "pending"),
      limit(1),
    ),
  );

  if (snap.empty) return null;

  const data = snap.docs[0].data() as SignupRequestDoc;
  return {
    ...data,
    signInEmail: data.email ?? "",
  };
}

function isVendorUser(userData: UserDoc | null, vendorData: VendorDoc | null) {
  return userData?.role === "vendor" || vendorData != null;
}

export async function resolveVendorSession(
  user: User,
): Promise<VendorSessionResolution> {
  const uid = user.uid;
  const loginEmail = user.email?.trim().toLowerCase() ?? "";

  const [userSnap, vendorSnap, signupByUid] = await Promise.all([
    getDoc(doc(firestore, "users", uid)),
    getDoc(doc(firestore, "vendors", uid)),
    getSignupRequestByAuthUid(uid),
  ]);

  const userData = userSnap.exists() ? (userSnap.data() as UserDoc) : null;
  const vendorData = vendorSnap.exists() ? (vendorSnap.data() as VendorDoc) : null;

  if (isVendorUser(userData, vendorData)) {
    const profile = buildProfile(uid, userData, vendorData, signupByUid);
    if (profile.status === "active") {
      return {
        kind: "active",
        profile,
        message: "",
      };
    }

    return {
      kind: "pending",
      profile,
      message:
        "Your vendor application is pending admin review. You will be notified once it is approved.",
    };
  }

  if (signupByUid?.status === "pending") {
    const profile = buildProfile(uid, userData, vendorData, signupByUid);
    return {
      kind: "pending",
      profile,
      message:
        "Your vendor application is pending admin review. You will be notified once it is approved.",
    };
  }

  if (userData && userData.role !== "vendor") {
    const wrongEmailSignup = loginEmail
      ? await getPendingSignupByContactEmail(loginEmail)
      : null;

    if (wrongEmailSignup?.signInEmail) {
      return {
        kind: "wrong_sign_in_email",
        profile: null,
        message: "",
      };
    }

    return {
      kind: "mobile_app_account",
      profile: null,
      message: "",
    };
  }

  if (loginEmail) {
    const wrongEmailSignup = await getPendingSignupByContactEmail(loginEmail);
    if (wrongEmailSignup?.signInEmail) {
      return {
        kind: "wrong_sign_in_email",
        profile: null,
        message: "",
      };
    }
  }

  return {
    kind: "not_vendor",
    profile: null,
    message: "",
  };
}
