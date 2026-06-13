import "server-only";

import { cookies } from "next/headers";

import type { VendorSessionDto } from "@/features/auth/domain/session-dto";
import {
  isAllowedPortalSessionKind,
  resolveVendorSessionServer,
} from "@/features/auth/infrastructure/resolve-vendor-session.server";
import { getVendorStoreProfileAdmin } from "@/features/vendor/infrastructure/vendor-store-profile.admin.repository";
import { SESSION_COOKIE_NAME } from "@/lib/auth-cookies";
import { getAdminAuth } from "@/lib/firebase-admin";

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
  const [resolution, authUser, storeProfile] = await Promise.all([
    resolveVendorSessionServer(verified.uid, verified.email),
    getAdminAuth().getUser(verified.uid),
    getVendorStoreProfileAdmin(verified.uid, verified.email),
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
      logoUrl: storeProfile?.logoUrl ?? null,
    },
  };
}

export async function getVendorSessionFromCookies(): Promise<VendorSessionDto | null> {
  const verified = await getVerifiedSessionFromCookies();
  if (!verified) return null;
  return buildVendorSessionDto(verified);
}
