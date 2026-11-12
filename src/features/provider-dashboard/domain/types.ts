import type {
  ReviewCategoryId,
  ReviewCategorySet,
  ReviewTagId,
} from "@/features/reviews/domain/types";

/**
 * Clinic and groomer dashboard. Visits, services and new patients use the
 * selected Cairo date range; the rating is all time. Counts and percents are
 * integers; averages are integer tenths.
 */

export const DASHBOARD_PRESETS = [7, 30, 90] as const;

export type DashboardPreset = (typeof DASHBOARD_PRESETS)[number];

export const DEFAULT_DASHBOARD_PRESET: DashboardPreset = 30;

/** `serviceId` "other" groups everything after the top services; its names are null. */
export type ServiceShare = {
  serviceId: string;
  branchId: string;
  nameEn: string | null;
  nameAr: string | null;
  count: number;
  sharePercent: number;
};

export type CategoryAverage = { id: ReviewCategoryId; averageTenths: number | null };

export type DashboardRating = {
  count: number;
  overallTenths: number | null;
  categories: CategoryAverage[];
  tagCounts: Partial<Record<ReviewTagId, number>>;
};

export type ProviderDashboard = {
  categorySet: ReviewCategorySet | null;
  range: { preset: DashboardPreset; fromDate: string; toDate: string };
  visits: number;
  newPatients: number;
  services: ServiceShare[];
  rating: DashboardRating;
};

export const OTHER_SERVICE_ID = "other";
