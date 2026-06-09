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

  if (!snap.empty) {
    return snap.docs[0].data() as SignupRequestDoc;
  }

  return null;
}

async function getSignupRequestForUser(
  uid: string,
  email: string,
): Promise<SignupRequestDoc | null> {
  const byUid = await getSignupRequestByAuthUid(uid);
  if (byUid) return byUid;

  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const snap = await getDocs(
    query(
      collection(firestore, "vendor_signup_requests"),
      where("email", "==", normalized),
      limit(5),
    ),
  );

  for (const docSnap of snap.docs) {
    const data = docSnap.data() as SignupRequestDoc;
    if (data.authUid === uid) return data;
  }

  return null;
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

  const [userSnap, vendorSnap, signupRequest] = await Promise.all([
    getDoc(doc(firestore, "users", uid)),
    getDoc(doc(firestore, "vendors", uid)),
    getSignupRequestForUser(uid, loginEmail),
  ]);

  const userData = userSnap.exists() ? (userSnap.data() as UserDoc) : null;
  const vendorData = vendorSnap.exists() ? (vendorSnap.data() as VendorDoc) : null;

  const isPendingSignup = signupRequest?.status === "pending";

  if (isVendorUser(userData, vendorData)) {
    const profile = buildProfile(uid, userData, vendorData, signupRequest);
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
      message: "Your vendor application is pending admin review.",
    };
  }

  if (signupRequest && isPendingSignup) {
    const profile = buildProfile(uid, userData, vendorData, signupRequest);
    return {
      kind: "pending",
      profile,
      message: "Your vendor application is pending admin review.",
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
