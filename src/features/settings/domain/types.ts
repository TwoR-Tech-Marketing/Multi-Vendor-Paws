import type { AppCurrency } from "@/features/products/domain/currency";

export type VendorSettingsSnapshot = {
  commissionRatePercent: number;
  productCount: number;
  openOrders: number;
  netEarningsPiastres: number;
  currency: AppCurrency;
};
