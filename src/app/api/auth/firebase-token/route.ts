import { NextResponse } from "next/server";

import { apiForbidden, apiGenericError, apiUnauthorized } from "@/lib/api/response";
import { getVerifiedSessionFromCookies } from "@/lib/auth/session.server";
import { isFirebaseAdminConfigured } from "@/lib/firebase-admin.env";
import { getAdminAuth } from "@/lib/firebase-admin";
import { logger } from "@/shared/lib/logger";

/**
 * Mints a Firebase custom token for the httpOnly session user so the browser
 * can call shared callables. The uid comes only from the verified session
 * cookie; the request body is never read.
 */
export async function POST(request: Request) {
  // Browsers send Sec-Fetch-Site; refuse anything not from this origin.
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    return apiForbidden();
  }

  if (!isFirebaseAdminConfigured()) {
    return apiUnauthorized();
  }

  try {
    const session = await getVerifiedSessionFromCookies();
    if (!session) {
      return apiUnauthorized();
    }

    const token = await getAdminAuth().createCustomToken(session.uid);
    return NextResponse.json(
      { token, uid: session.uid },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    logger.error("POST /api/auth/firebase-token failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return apiGenericError();
  }
}
