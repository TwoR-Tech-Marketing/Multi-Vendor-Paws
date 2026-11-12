import { httpsCallable } from "firebase/functions";

import {
  EARNINGS_ENTRY_TYPES,
  type EarningsEntryFilter,
  type VendorEarningsEntriesPage,
  type VendorEarningsEntry,
  type VendorEarningsOverview,
  type VendorEarningsSummary,
} from "@/features/financials/domain/types";
import { vendorApiGet } from "@/lib/auth-client";
import { firebaseFunctions } from "@/lib/firebase";
import { getEarningsDataSource } from "@/lib/vendor-data-source";

const CALLABLE_SUMMARY = "vendor_earnings-getMyVendorEarningsSummary";
const CALLABLE_ENTRIES = "vendor_earnings-listMyVendorEarningsEntries";
export const EARNINGS_PAGE_SIZE = 20;

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

function toInt(value: unknown): number {
  const n = Math.trunc(Number(value));
  return Number.isFinite(n) ? n : 0;
}

function toText(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

function toDateFromMillis(value: unknown): Date {
  const ms = Number(value);
  return Number.isFinite(ms) && ms > 0 ? new Date(ms) : new Date(0);
}

/** Maps the callable summary (millis) to the portal summary type. */
export function mapCallableEarningsSummary(raw: unknown): VendorEarningsSummary {
  const data = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const summary = (
    data.summary && typeof data.summary === "object" ? data.summary : {}
  ) as Record<string, unknown>;
  return {
    vendorId: "",
    totalSalesPiastres: toInt(summary.totalSalesPiastres),
    totalCommissionPiastres: toInt(summary.totalCommissionPiastres),
    netEarningsPiastres: toInt(summary.netEarningsPiastres),
    pendingPayoutPiastres: toInt(summary.pendingPayoutPiastres),
    currency: "EGP",
    updatedAt: toDateFromMillis(summary.updatedAtMs),
  };
}

function mapCallableEntry(raw: unknown): VendorEarningsEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const entryId = toText(item.entryId);
  const type = EARNINGS_ENTRY_TYPES.find((t) => t === item.type);
  if (!entryId || !type) return null;
  return {
    entryId,
    vendorId: "",
    type,
    amountPiastres: toInt(item.amountPiastres),
    commissionPiastres: toInt(item.commissionPiastres),
    netPiastres: toInt(item.netPiastres),
    vendorOrderId: toText(item.vendorOrderId),
    orderId: toText(item.orderId),
    description: toText(item.description),
    currency: "EGP",
    createdAt: toDateFromMillis(item.createdAtMs),
  };
}

/** Maps the callable entries page; unusable rows are dropped. */
export function mapCallableEarningsEntries(raw: unknown): VendorEarningsEntriesPage {
  const data = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const entries = Array.isArray(data.items)
    ? data.items
        .map(mapCallableEntry)
        .filter((entry): entry is VendorEarningsEntry => entry !== null)
    : [];
  return { entries, nextCursor: toText(data.nextCursor) };
}

/** Type tabs and load more exist only on the callable source. */
export function isEarningsLedgerPaged(): boolean {
  return getEarningsDataSource() === "callable";
}

export async function fetchVendorEarningsEntries(
  type: EarningsEntryFilter,
  cursor: string | null = null,
): Promise<VendorEarningsEntriesPage> {
  const callable = httpsCallable(firebaseFunctions, CALLABLE_ENTRIES);
  const result = await callable({ type, pageSize: EARNINGS_PAGE_SIZE, cursor });
  return mapCallableEarningsEntries(result.data);
}

/** Summary plus the first page of entries. The bff source is unchanged and never pages. */
export async function fetchVendorEarningsOverview(
  type: EarningsEntryFilter = "all",
): Promise<VendorEarningsOverview> {
  if (getEarningsDataSource() !== "callable") {
    const page = await fetchVendorEarningsFromApi();
    return { ...page, nextCursor: null };
  }
  const summaryCallable = httpsCallable(firebaseFunctions, CALLABLE_SUMMARY);
  const [summaryResult, page] = await Promise.all([
    summaryCallable({}),
    fetchVendorEarningsEntries(type),
  ]);
  return { summary: mapCallableEarningsSummary(summaryResult.data), ...page };
}

export async function fetchDashboardStatsFromApi(): Promise<DashboardStatsResponse> {
  return vendorApiGet<DashboardStatsResponse>("/api/vendor/dashboard");
}
