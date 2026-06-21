import { NextResponse } from "next/server";

import {
  getMissingFirebaseAdminEnvKeys,
  isFirebaseAdminConfigured,
} from "@/lib/firebase-admin.env";

export async function GET() {
  const missing = getMissingFirebaseAdminEnvKeys();

  return NextResponse.json({
    ok: true,
    firebaseAdminConfigured: isFirebaseAdminConfigured(),
    missingEnvKeys: missing,
    vercel: Boolean(process.env.VERCEL),
  });
}
