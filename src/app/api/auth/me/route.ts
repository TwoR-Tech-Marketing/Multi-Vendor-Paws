import { NextResponse } from "next/server";

import { apiGenericError, apiUnauthorized } from "@/lib/api/response";
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
      return apiUnauthorized();
    }

    return NextResponse.json({ session });
  } catch (error) {
    logger.error("GET /api/auth/me failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return apiGenericError();
  }
}
