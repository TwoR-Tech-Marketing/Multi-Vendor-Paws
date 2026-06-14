import type {
  VendorEarningsEntry,
  VendorEarningsSummary,
} from "@/features/financials/domain/types";
import { vendorApiGet } from "@/lib/auth-client";

type EarningsSummaryResponse = {
  totalSales: number;
  commission: number;
  netEarnings: number;
  pendingPayout: number;
  currency: "EGP";
  updatedAt: string;
};

type EarningsEntryResponse = Omit<VendorEarningsEntry, "createdAt"> & {
  createdAt: string;
};

type EarningsPageResponse = {
  summary: EarningsSummaryResponse;
  entries: EarningsEntryResponse[];
};

type DashboardStatsResponse = {
  openOrders: number;
  totalSales: number;
  commission: number;
  netEarnings: number;
  currency: "EGP";
};

function deserializeSummary(summary: EarningsSummaryResponse): VendorEarningsSummary {
  return {
    vendorId: "",
    totalSalesPiastres: summary.totalSales,
    totalCommissionPiastres: summary.commission,
    netEarningsPiastres: summary.netEarnings,
    pendingPayoutPiastres: summary.pendingPayout,
    currency: summary.currency,
    updatedAt: new Date(summary.updatedAt),
  };
}

function deserializeEntry(entry: EarningsEntryResponse): VendorEarningsEntry {
  return {
    ...entry,
    createdAt: new Date(entry.createdAt),
  };
}

export async function fetchVendorEarningsFromApi(): Promise<{
  summary: VendorEarningsSummary;
  entries: VendorEarningsEntry[];
}> {
  const data = await vendorApiGet<EarningsPageResponse>("/api/vendor/earnings");
  return {
    summary: deserializeSummary(data.summary),
    entries: data.entries.map(deserializeEntry),
  };
}

export async function fetchDashboardStatsFromApi(): Promise<DashboardStatsResponse> {
  return vendorApiGet<DashboardStatsResponse>("/api/vendor/dashboard");
}
