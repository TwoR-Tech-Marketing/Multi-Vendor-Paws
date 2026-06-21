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

function mapSessionError(error: unknown): ReturnType<typeof apiGenericError> | null {
  if (!(error instanceof Error)) return null;

  const message = error.message.toLowerCase();

  if (
    message.includes("private key") ||
    message.includes("decoder") ||
    message.includes("secretorprivatekey")
  ) {
    return apiServerMisconfigured(
      "Firebase Admin private key is invalid. Re-check FIREBASE_PRIVATE_KEY in Vercel.",
    );
  }

  if (message.includes("insufficient permission") || message.includes("permission_denied")) {
    return apiServerMisconfigured(
      "Firebase service account cannot access Firestore. Check IAM roles for the service account.",
    );
  }

  if (message.includes("failed_precondition") || message.includes("index")) {
    return apiServerMisconfigured(
      "Firestore index required. Check Vercel function logs for the index creation link.",
    );
  }

  return null;
}

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
      logger.error("POST /api/auth/session: session DTO could not be built", {
        uid: decoded.uid,
        email,
        sessionKind: resolution.kind,
      });
      return apiForbidden();
    }

    const response = NextResponse.json({ session: sessionDto });
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, getSessionCookieOptions());
    return response;
  } catch (error) {
    const mapped = mapSessionError(error);
    if (mapped) return mapped;

    logger.error("POST /api/auth/session failed", {
      message: error instanceof Error ? error.message : String(error),
      code:
        error instanceof Error && "code" in error
          ? String((error as { code?: string }).code)
          : undefined,
    });
    return apiGenericError();
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", getSessionCookieClearOptions());
  return response;
}
