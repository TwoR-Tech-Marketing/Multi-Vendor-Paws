import { NextResponse } from "next/server";

import { apiUnauthorized } from "@/lib/api/response";
import { getVendorSessionFromCookies } from "@/lib/auth/session.server";

export async function GET() {
  const session = await getVendorSessionFromCookies();

  if (!session) {
    return apiUnauthorized();
  }

  return NextResponse.json({ session });
}
