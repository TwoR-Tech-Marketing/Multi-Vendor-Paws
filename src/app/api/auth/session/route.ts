import { NextResponse } from "next/server";
import { z } from "zod";

import {
  isAllowedPortalSessionKind,
  resolveVendorSessionServer,
} from "@/features/auth/infrastructure/resolve-vendor-session.server";
import {
  getSessionCookieClearOptions,
  getSessionCookieOptions,
  SESSION_COOKIE_MAX_AGE_MS,
  SESSION_COOKIE_NAME,
} from "@/lib/auth-cookies";
import { apiForbidden, apiGenericError, apiServerMisconfigured } from "@/lib/api/response";
import { buildVendorSessionDto } from "@/lib/auth/session.server";
import {
  getFirebaseAdminSetupMessage,
  isFirebaseAdminConfigured,
} from "@/lib/firebase-admin.env";
import { getAdminAuth } from "@/lib/firebase-admin";
import { logger } from "@/shared/lib/logger";

const bodySchema = z.object({
  idToken: z.string().min(1),
});

export async function POST(request: Request) {
  if (!isFirebaseAdminConfigured()) {
    const setupMessage = getFirebaseAdminSetupMessage();
    logger.error("POST /api/auth/session: Firebase Admin not configured", {
      setupMessage,
    });
    return apiServerMisconfigured(setupMessage);
  }

  try {
    const body = bodySchema.parse(await request.json());
    const decoded = await getAdminAuth().verifyIdToken(body.idToken);
    const email = decoded.email?.trim().toLowerCase() ?? "";

    if (!email) {
      return apiForbidden();
    }

    const resolution = await resolveVendorSessionServer(decoded.uid, email);

    if (!isAllowedPortalSessionKind(resolution.kind)) {
      return apiForbidden();
    }

    const sessionCookie = await getAdminAuth().createSessionCookie(body.idToken, {
      expiresIn: SESSION_COOKIE_MAX_AGE_MS,
    });

    const sessionDto = await buildVendorSessionDto({
      uid: decoded.uid,
      email,
    });

    if (!sessionDto) {
      return apiGenericError();
    }

    const response = NextResponse.json({ session: sessionDto });
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, getSessionCookieOptions());
    return response;
  } catch (error) {
    logger.error("POST /api/auth/session failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return apiGenericError();
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", getSessionCookieClearOptions());
  return response;
}
