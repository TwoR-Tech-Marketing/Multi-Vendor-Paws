import { NextResponse } from "next/server";

import { getVendorEarningsPage } from "@/features/financials/infrastructure/vendor-earnings.admin.repository";
import { countOpenVendorOrders } from "@/features/orders/infrastructure/vendor-orders.admin.repository";
import { apiGenericError, apiUnauthorized } from "@/lib/api/response";
import { getActiveVendorApiContext } from "@/lib/auth/require-vendor-api";

export async function GET() {
  const context = await getActiveVendorApiContext();
  if (!context) return apiUnauthorized();

  try {
    const [earnings, openOrders] = await Promise.all([
      getVendorEarningsPage(context.vendorId),
      countOpenVendorOrders(context.vendorId),
    ]);

    return NextResponse.json({
      openOrders,
      totalSales: earnings.summary.totalSalesPiastres,
      commission: earnings.summary.totalCommissionPiastres,
      netEarnings: earnings.summary.netEarningsPiastres,
      currency: earnings.summary.currency,
    });
  } catch {
    return apiGenericError();
  }
}
