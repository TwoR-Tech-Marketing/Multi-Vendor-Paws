import "server-only";

import { APP_CURRENCY } from "@/features/products/domain/currency";
import { resolveCommissionRatePercent } from "@/features/financials/infrastructure/commission.admin.repository";
import { getVendorEarningsSummary } from "@/features/financials/infrastructure/vendor-earnings.admin.repository";
import { countOpenVendorOrders } from "@/features/orders/infrastructure/vendor-orders.admin.repository";
import { countVendorProducts } from "@/features/products/infrastructure/products.admin.repository";
import type { VendorSettingsSnapshot } from "@/features/settings/domain/types";
import type { VendorApiContext } from "@/lib/auth/require-vendor-api";

export async function getVendorSettingsSnapshot(
  context: VendorApiContext,
): Promise<VendorSettingsSnapshot> {
  const { vendorId, session } = context;

  const [commissionRatePercent, productCount] = await Promise.all([
    resolveCommissionRatePercent(vendorId),
    countVendorProducts(vendorId),
  ]);

  let openOrders = 0;
  let netEarningsPiastres = 0;

  if (session.sessionKind === "active") {
    const [earnings, openOrderCount] = await Promise.all([
      getVendorEarningsSummary(vendorId),
      countOpenVendorOrders(vendorId),
    ]);
    openOrders = openOrderCount;
    netEarningsPiastres = earnings.netEarningsPiastres;
  }

  return {
    commissionRatePercent,
    productCount,
    openOrders,
    netEarningsPiastres,
    currency: APP_CURRENCY,
  };
}
