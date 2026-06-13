import { NextResponse } from "next/server";

import { apiUnauthorized } from "@/lib/api/response";
import { getVendorApiContext } from "@/lib/auth/require-vendor-api";

export async function GET() {
  const context = await getVendorApiContext();
  if (!context) return apiUnauthorized();

  return NextResponse.json({
    items: [],
    unreadCount: 0,
    total: 0,
  });
}
