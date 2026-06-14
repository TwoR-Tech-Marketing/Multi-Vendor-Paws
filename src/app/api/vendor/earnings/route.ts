import { NextResponse } from "next/server";

import type {
  VendorEarningsEntry,
  VendorEarningsSummary,
} from "@/features/financials/domain/types";
import { getVendorEarningsPage } from "@/features/financials/infrastructure/vendor-earnings.admin.repository";
import { apiGenericError, apiUnauthorized } from "@/lib/api/response";
import { getActiveVendorApiContext } from "@/lib/auth/require-vendor-api";

function serializeSummary(summary: VendorEarningsSummary) {
  return {
    totalSales: summary.totalSalesPiastres,
    commission: summary.totalCommissionPiastres,
    netEarnings: summary.netEarningsPiastres,
    pendingPayout: summary.pendingPayoutPiastres,
    currency: summary.currency,
    updatedAt: summary.updatedAt.toISOString(),
  };
}

function serializeEntry(entry: VendorEarningsEntry) {
  return {
    ...entry,
    createdAt: entry.createdAt.toISOString(),
  };
}

export async function GET() {
  const context = await getActiveVendorApiContext();
  if (!context) return apiUnauthorized();

  try {
    const page = await getVendorEarningsPage(context.vendorId);

    return NextResponse.json({
      summary: serializeSummary(page.summary),
      entries: page.entries.map(serializeEntry),
    });
  } catch {
    return apiGenericError();
  }
}
