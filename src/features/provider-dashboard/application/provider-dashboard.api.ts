import {
  DASHBOARD_PRESETS,
  DEFAULT_DASHBOARD_PRESET,
  type CategoryAverage,
  type DashboardPreset,
  type DashboardRating,
  type ProviderDashboard,
  type ServiceShare,
} from "@/features/provider-dashboard/domain/types";
import { invokeProviderDashboard } from "@/features/provider-dashboard/infrastructure/provider-dashboard.callables";
import {
  REVIEW_CATEGORY_IDS,
  REVIEW_CATEGORY_SETS,
  REVIEW_TAG_IDS,
  type ReviewTagId,
} from "@/features/reviews/domain/types";

/**
 * Provider dashboard through the shared `vendor_dashboard` callable. No BFF
 * and no Firestore reads; the vendor is the caller's auth uid on the server.
 */

type Raw = Record<string, unknown>;

function asObject(value: unknown): Raw {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Raw) : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function asCount(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : 0;
}

function asIntOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

function asPreset(value: unknown): DashboardPreset {
  return DASHBOARD_PRESETS.find((p) => p === value) ?? DEFAULT_DASHBOARD_PRESET;
}

function mapServices(value: unknown): ServiceShare[] {
  // Shares are the server values as given; each is rounded on its own, so
  // they may sum to slightly more or less than 100.
  return asArray(value)
    .map(asObject)
    .map((row) => ({
      serviceId: asString(row.serviceId),
      branchId: asString(row.branchId),
      nameEn: asNullableString(row.nameEn),
      nameAr: asNullableString(row.nameAr),
      count: asCount(row.count),
      sharePercent: Math.max(0, asIntOrNull(row.sharePercent) ?? 0),
    }))
    .filter((row) => row.serviceId && row.count > 0);
}

function mapRating(value: unknown): DashboardRating {
  const raw = asObject(value);
  const categories: CategoryAverage[] = asArray(raw.categories).flatMap((entry) => {
    const item = asObject(entry);
    const id = REVIEW_CATEGORY_IDS.find((c) => c === item.id);
    return id ? [{ id, averageTenths: asIntOrNull(item.averageTenths) }] : [];
  });
  const rawTags = asObject(raw.tagCounts);
  const tagCounts: Partial<Record<ReviewTagId, number>> = {};
  for (const tag of REVIEW_TAG_IDS) {
    const count = asCount(rawTags[tag]);
    if (count > 0) tagCounts[tag] = count;
  }
  return { count: asCount(raw.count), overallTenths: asIntOrNull(raw.overallTenths), categories, tagCounts };
}

export function mapProviderDashboard(value: unknown): ProviderDashboard {
  const raw = asObject(value);
  const range = asObject(raw.range);
  return {
    categorySet: REVIEW_CATEGORY_SETS.find((s) => s === raw.categorySet) ?? null,
    range: {
      preset: asPreset(range.preset),
      fromDate: asString(range.fromDate),
      toDate: asString(range.toDate),
    },
    visits: asCount(raw.visits),
    newPatients: asCount(raw.newPatients),
    services: mapServices(raw.services),
    rating: mapRating(raw.rating),
  };
}

export async function getProviderDashboard(request: {
  preset: DashboardPreset;
  branchId?: string;
}): Promise<ProviderDashboard> {
  const payload: Record<string, unknown> = { preset: request.preset };
  if (request.branchId) payload.branchId = request.branchId;
  return mapProviderDashboard(await invokeProviderDashboard(payload));
}
