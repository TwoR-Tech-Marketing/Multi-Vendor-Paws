import { NextResponse } from "next/server";

import { apiError, apiGenericError } from "@/lib/api/response";
import { isFirebaseAdminConfigured } from "@/lib/firebase-admin.env";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase-admin";
import { logger } from "@/shared/lib/logger";

export async function GET() {
  if (!isFirebaseAdminConfigured()) {
    return apiError("Firebase Admin env vars are missing.", 503);
  }

  try {
    await getAdminAuth().listUsers(1);
    await getAdminFirestore().collection("users").limit(1).get();

    return NextResponse.json({
      ok: true,
      auth: "ok",
      firestore: "ok",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("GET /api/health/firebase failed", { message });

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 503 },
    );
  }
}
