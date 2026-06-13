import { NextResponse } from "next/server";

import { apiUnauthorized } from "@/lib/api/response";
import { getActiveVendorApiContext } from "@/lib/auth/require-vendor-api";

export async function GET() {
  const context = await getActiveVendorApiContext();
  if (!context) return apiUnauthorized();

  return NextResponse.json({
    summary: {
      totalSales: 0,
      commission: 0,
      netEarnings: 0,
      currency: "EGP",
    },
    entries: [],
  });
}
