import { NextResponse } from "next/server";

import { getVendorSettingsSnapshot } from "@/features/settings/infrastructure/vendor-settings.admin.service";
import { apiGenericError, apiUnauthorized } from "@/lib/api/response";
import { getVendorApiContext } from "@/lib/auth/require-vendor-api";

export async function GET() {
  const context = await getVendorApiContext();
  if (!context) return apiUnauthorized();

  try {
    const snapshot = await getVendorSettingsSnapshot(context);
    return NextResponse.json(snapshot);
  } catch {
    return apiGenericError();
  }
}
