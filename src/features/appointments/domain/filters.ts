import { addDays, daysBetween, isIsoDate } from "@/features/availability/domain/time";
import {
  APPOINTMENT_LIMITS,
  type AppointmentStatus,
} from "@/features/appointments/domain/types";
import { cairoDayNumber } from "@/features/orders/lib/cairoDates";

/** Status chips of the inbox. Each maps to the statuses sent to the server. */
export const STATUS_GROUPS = [
  "upcoming",
  "completed",
  "cancelled",
  "noShow",
  "refunds",
  "all",
] as const;

export type StatusGroup = (typeof STATUS_GROUPS)[number];

const GROUP_STATUSES: Record<StatusGroup, AppointmentStatus[] | null> = {
  upcoming: ["paid", "rescheduled"],
  completed: ["completed"],
  cancelled: ["cancelled_by_user", "cancelled_by_clinic"],
  noShow: ["no_show"],
  refunds: ["refund_pending", "refunded"],
  all: null,
};

/** Server presets plus "any" (no date filter) and "custom" (from and to). */
export const DATE_PRESETS = [
  "any",
  "today",
  "tomorrow",
  "next7",
  "last7",
  "last30",
  "custom",
] as const;

export type DatePreset = (typeof DATE_PRESETS)[number];

export type ServerDatePreset = Exclude<DatePreset, "any" | "custom">;

export type AppointmentFilters = {
  group: StatusGroup;
  branchId: string;
  datePreset: DatePreset;
  dateFrom: string;
  dateTo: string;
};

export const DEFAULT_APPOINTMENT_FILTERS: AppointmentFilters = {
  group: "upcoming",
  branchId: "",
  datePreset: "any",
  dateFrom: "",
  dateTo: "",
};

export type AppointmentListRequest = {
  statuses?: AppointmentStatus[];
  branchId?: string;
  datePreset?: ServerDatePreset;
  dateFrom?: string;
  dateTo?: string;
  order: "asc" | "desc";
  pageSize: number;
  cursor?: string;
};

export type RangeError = "rangeIncomplete" | "rangeOrder" | "rangeTooLong";

export function statusesForGroup(group: StatusGroup): AppointmentStatus[] | null {
  return GROUP_STATUSES[group];
}

/** The chip a status belongs to, for highlighting and counts. */
export function groupOfStatus(status: AppointmentStatus): StatusGroup {
  const found = STATUS_GROUPS.find((g) => g !== "all" && GROUP_STATUSES[g]?.includes(status));
  return found ?? "all";
}

function isoFromDayNumber(dayNum: number): string {
  return new Date(dayNum * 86_400_000).toISOString().slice(0, 10);
}

/** Today's Africa/Cairo calendar date as "YYYY-MM-DD". */
export function cairoTodayIso(nowMs: number): string {
  return isoFromDayNumber(cairoDayNumber(nowMs));
}

/**
 * Cairo calendar dates a preset covers, the same bounds the server applies.
 * Used to prefill the custom range. Null for "any" and "custom".
 */
export function cairoPresetRange(
  preset: DatePreset,
  nowMs: number,
): { from: string; to: string } | null {
  const today = cairoTodayIso(nowMs);
  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "tomorrow": {
      const tomorrow = addDays(today, 1);
      return { from: tomorrow, to: tomorrow };
    }
    case "next7":
      return { from: today, to: addDays(today, 6) };
    case "last7":
      return { from: addDays(today, -6), to: today };
    case "last30":
      return { from: addDays(today, -29), to: today };
    default:
      return null;
  }
}

/** Custom range check: both dates, from before to, at most 92 days. */
export function validateCustomRange(from: string, to: string): RangeError | null {
  if (!isIsoDate(from) || !isIsoDate(to)) return "rangeIncomplete";
  const span = daysBetween(from, to);
  if (span < 0) return "rangeOrder";
  if (span + 1 > APPOINTMENT_LIMITS.maxRangeDays) return "rangeTooLong";
  return null;
}

/** Past looking views read newest first; upcoming reads soonest first. */
export function orderForFilters(filters: AppointmentFilters): "asc" | "desc" {
  if (filters.datePreset === "last7" || filters.datePreset === "last30") return "desc";
  return filters.group === "upcoming" ? "asc" : "desc";
}

/**
 * Request for `listVendorAppointments`. Returns null while a custom range is
 * invalid, so no request is sent.
 */
export function buildListRequest(
  filters: AppointmentFilters,
  cursor?: string | null,
): AppointmentListRequest | null {
  const request: AppointmentListRequest = {
    order: orderForFilters(filters),
    pageSize: APPOINTMENT_LIMITS.pageSize,
  };
  const statuses = statusesForGroup(filters.group);
  if (statuses) request.statuses = statuses;
  if (filters.branchId) request.branchId = filters.branchId;
  if (filters.datePreset === "custom") {
    if (validateCustomRange(filters.dateFrom, filters.dateTo)) return null;
    request.dateFrom = filters.dateFrom;
    request.dateTo = filters.dateTo;
  } else if (filters.datePreset !== "any") {
    request.datePreset = filters.datePreset;
  }
  if (cursor) request.cursor = cursor;
  return request;
}
