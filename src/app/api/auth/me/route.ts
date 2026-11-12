import { NextResponse } from "next/server";

import { apiGenericError, apiUnauthorized } from "@/lib/api/response";
import {
  getSessionCookieClearOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/auth-cookies";
import { getVendorSessionFromCookies } from "@/lib/auth/session.server";
import { isFirebaseAdminConfigured } from "@/lib/firebase-admin.env";
import { logger } from "@/shared/lib/logger";

export async function GET() {
  if (!isFirebaseAdminConfigured()) {
    return apiUnauthorized();
  }

  try {
    const session = await getVendorSessionFromCookies();

    if (!session) {
      // An expired or revoked cookie must be cleared, or the middleware keeps
      // sending the browser back to the portal and the login page never shows.
      const response = apiUnauthorized();
      response.cookies.set(SESSION_COOKIE_NAME, "", getSessionCookieClearOptions());
      return response;
    }

    // preferences is also top level, the same shape the session callable returns.
    return NextResponse.json({ session, preferences: session.preferences });
  } catch (error) {
    logger.error("GET /api/auth/me failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return apiGenericError();
  }
}
