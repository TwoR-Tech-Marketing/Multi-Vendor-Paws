export type CoverageMode = "zone" | "governorates";

export type DeliveryCoverage = {
  mode: CoverageMode;
  zone: { lat: number; lng: number; radiusMeters: number } | null;
  governorateIds: string[];
};

export type GovernorateOption = {
  id: string;
  nameEn: string;
  nameAr: string;
};

export const MIN_RADIUS_METERS = 500;
export const MAX_RADIUS_METERS = 100_000;
