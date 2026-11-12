import "server-only";

import { cookies } from "next/headers";

import { isAllowedPortalSessionKind } from "@/features/auth/domain/portal-account-gate";
import type { VendorSessionDto } from "@/features/auth/domain/session-dto";
import { resolveVendorSessionViaCallableForUid } from "@/features/auth/infrastructure/resolve-vendor-session.callable";
import { getVendorPreferencesAdmin } from "@/features/vendor/infrastructure/vendor-preferences.admin.repository";
import { getVendorStoreProfileAdmin } from "@/features/vendor/infrastructure/vendor-store-profile.admin.repository";
import { SESSION_COOKIE_NAME } from "@/lib/auth-cookies";
import { getAdminAuth } from "@/lib/firebase-admin";
import { DEFAULT_VENDOR_PREFERENCES } from "@/shared/preferences/domain/types";

export type VerifiedSession = {
  uid: string;
  email: string;
};

export async function verifySessionCookie(
  sessionCookie: string,
): Promise<VerifiedSession> {
  const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
  const email = decoded.email?.trim().toLowerCase() ?? "";

  if (!email) {
    throw new Error("INVALID_SESSION");
  }

  return {
    uid: decoded.uid,
    email,
  };
}

export async function getVerifiedSessionFromCookies(): Promise<VerifiedSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  try {
    return await verifySessionCookie(sessionCookie);
  } catch {
    return null;
  }
}

export async function requireVerifiedSession(): Promise<VerifiedSession> {
  const session = await getVerifiedSessionFromCookies();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function buildVendorSessionDto(
  verified: VerifiedSession,
): Promise<VendorSessionDto | null> {
  // Kind and profile come from the shared callable, not the local Admin mirror.
  const [resolution, authUser, storeProfile, accountPreferences] = await Promise.all([
    resolveVendorSessionViaCallableForUid(verified.uid),
    getAdminAuth().getUser(verified.uid),
    getVendorStoreProfileAdmin(verified.uid, verified.email),
    getVendorPreferencesAdmin(verified.uid).catch(() => null),
  ]);

  if (!isAllowedPortalSessionKind(resolution.kind) || !resolution.profile) {
    return null;
  }

  return {
    user: {
      uid: verified.uid,
      email: verified.email,
      metadata: {
        lastSignInTime: authUser.metadata.lastSignInTime ?? null,
        creationTime: authUser.metadata.creationTime ?? null,
      },
    },
    sessionKind: resolution.kind,
    profile: resolution.profile,
    storeBranding: {
      storeName: storeProfile?.storeName ?? resolution.profile.storeName,
      logoUrl: storeProfile?.logoUrl ?? resolution.profile.logoUrl ?? null,
    },
    preferences: accountPreferences ?? { ...DEFAULT_VENDOR_PREFERENCES },
    preferencesScope: accountPreferences ? "account" : "local",
  };
}

export async function getVendorSessionFromCookies(): Promise<VendorSessionDto | null> {
  const verified = await getVerifiedSessionFromCookies();
  if (!verified) return null;
  return buildVendorSessionDto(verified);
}
