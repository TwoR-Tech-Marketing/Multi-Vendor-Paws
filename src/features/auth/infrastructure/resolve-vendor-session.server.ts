import "server-only";

import type { Timestamp } from "firebase-admin/firestore";

import type { VendorAccountStatus, VendorProfile } from "@/features/auth/domain/types";
import type {
  VendorSessionKind,
  VendorSessionResolution,
} from "@/features/auth/infrastructure/resolve-vendor-session";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase-admin";

type UserDoc = {
  role?: string;
  accountStatus?: VendorAccountStatus;
  ownerName?: string;
  email?: string;
  vendorId?: string;
  is_banned?: boolean;
  ban_reason?: string;
  ban_expires_at?: Timestamp;
  suspend_reason?: string;
  suspend_expires_at?: Timestamp;
};

type VendorDoc = {
  storeName?: string;
  status?: VendorAccountStatus;
  approvalStatus?: string;
  ownerName?: string;
  email?: string;
  logoUrl?: string | null;
  isBanned?: boolean;
  banReason?: string;
  banExpiresAt?: Timestamp;
  suspendReason?: string;
  suspendExpiresAt?: Timestamp;
};

type SignupRequestDoc = {
  email?: string;
  contactEmail?: string;
  storeName?: string;
  ownerName?: string;
  status?: string;
  authUid?: string;
};

function toDate(value: Timestamp | undefined): Date | null {
  if (!value?.toDate) return null;
  return value.toDate();
}

function isExpired(expiresAt: Date | null | undefined): boolean {
  if (!expiresAt) return false;
  return expiresAt.getTime() <= Date.now();
}

function resolveRestriction(
  userData: UserDoc | null,
  vendorData: VendorDoc | null,
): Pick<
  VendorProfile,
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
    vendorData?.status === "suspended" ||
    userData?.accountStatus === "suspended";

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
    ...resolveRestriction(userData, vendorData),
  };
}

function buildSuspendedMessage(profile: VendorProfile): string {
  const reason = profile.restrictionReason ?? "policy violation";
  const expiresAt = profile.restrictionExpiresAt;

  if (profile.isPermanentRestriction) {
    return `This account is suspended for ${reason}. Contact support if you believe this is a mistake.`;
  }

  const expiryLabel = expiresAt
    ? expiresAt.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "the scheduled date";

  return `This account is suspended for ${reason}. Access will be restored on ${expiryLabel}.`;
}

async function getSignupRequestByAuthUid(
  uid: string,
): Promise<SignupRequestDoc | null> {
  const snap = await getAdminFirestore()
    .collection("vendor_signup_requests")
    .where("authUid", "==", uid)
    .limit(1)
    .get();

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

  const snap = await getAdminFirestore()
    .collection("vendor_signup_requests")
    .where("email", "==", normalized)
    .limit(5)
    .get();

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
  const snap = await getAdminFirestore()
    .collection("vendor_signup_requests")
    .where("contactEmail", "==", normalized)
    .where("status", "==", "pending")
    .limit(1)
    .get();

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

function isRestricted(
  userData: UserDoc | null,
  vendorData: VendorDoc | null,
): boolean {
  if (vendorData?.isBanned || userData?.is_banned) {
    const expiresAt = toDate(vendorData?.banExpiresAt ?? userData?.ban_expires_at);
    return !isExpired(expiresAt);
  }

  const suspended =
    vendorData?.status === "suspended" ||
    userData?.accountStatus === "suspended";

  if (!suspended) return false;

  const expiresAt = toDate(
    vendorData?.suspendExpiresAt ?? userData?.suspend_expires_at,
  );
  return !isExpired(expiresAt);
}

async function loadVendorSessionDocs(uid: string, loginEmail: string) {
  const [userSnap, vendorSnap, signupRequest] = await Promise.all([
    getAdminFirestore().collection("users").doc(uid).get(),
    getAdminFirestore().collection("vendors").doc(uid).get(),
    getSignupRequestForUser(uid, loginEmail),
  ]);

  return {
    userData: userSnap.exists ? (userSnap.data() as UserDoc) : null,
    vendorData: vendorSnap.exists ? (vendorSnap.data() as VendorDoc) : null,
    signupRequest,
  };
}

export async function resolveVendorSessionServer(
  uid: string,
  loginEmail: string,
): Promise<VendorSessionResolution> {
  const { userData, vendorData, signupRequest } = await loadVendorSessionDocs(
    uid,
    loginEmail,
  );

  const isPendingSignup = signupRequest?.status === "pending";

  if (isVendorUser(userData, vendorData)) {
    const profile = buildProfile(uid, userData, vendorData, signupRequest);

    if (isRestricted(userData, vendorData)) {
      return {
        kind: "suspended",
        profile,
        message: buildSuspendedMessage(profile),
      };
    }

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

export function isAllowedPortalSessionKind(kind: VendorSessionKind): boolean {
  return kind === "active" || kind === "pending" || kind === "suspended";
}
