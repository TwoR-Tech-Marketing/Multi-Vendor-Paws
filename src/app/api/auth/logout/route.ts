import { NextResponse } from "next/server";

import {
  getSessionCookieClearOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/auth-cookies";
import { apiGenericError } from "@/lib/api/response";
import { getVerifiedSessionFromCookies } from "@/lib/auth/session.server";
import { getAdminAuth } from "@/lib/firebase-admin";

export async function POST() {
  try {
    const verified = await getVerifiedSessionFromCookies();

    if (verified) {
      await getAdminAuth().revokeRefreshTokens(verified.uid);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE_NAME, "", getSessionCookieClearOptions());
    return response;
  } catch {
    return apiGenericError();
  }
}
