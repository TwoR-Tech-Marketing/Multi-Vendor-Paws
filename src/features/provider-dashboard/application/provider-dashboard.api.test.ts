import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ callableFn: vi.fn(), httpsCallable: vi.fn() }));

vi.mock("firebase/functions", () => ({ httpsCallable: mocks.httpsCallable }));
vi.mock("@/lib/firebase", () => ({ firebaseFunctions: {} }));

import {
  getProviderDashboard,
  mapProviderDashboard,
} from "@/features/provider-dashboard/application/provider-dashboard.api";
import { formatPercent, halfUpPercent, topTags } from "@/features/provider-dashboard/domain/stats";

const RAW_DASHBOARD = {
  ok: true,
  categorySet: "clinic",
  range: { preset: 7, fromDate: "2026-11-06", toDate: "2026-11-12", timeZone: "Africa/Cairo" },
  visits: 12,
  newPatients: 4,
  services: [
    { serviceId: "s1", branchId: "b1", nameEn: "Checkup", nameAr: "كشف", count: 9, sharePercent: 75 },
    { serviceId: "other", branchId: "", nameEn: null, nameAr: null, count: 3, sharePercent: 25 },
  ],
  rating: {
    count: 3,
    overallTenths: 43,
    categories: [
      { id: "cleanliness", averageTenths: 47 },
      { id: "waiting_time", averageTenths: 37 },
      { id: "doctor_efficiency", averageTenths: 43 },
    ],
    tagCounts: { friendly_doctor: 2, clean_clinic: 1, unknown: 5 },
  },
};

beforeEach(() => {
  mocks.callableFn.mockReset();
  mocks.httpsCallable.mockReset();
  mocks.httpsCallable.mockImplementation(() => mocks.callableFn);
});

describe("provider dashboard mapping", () => {
  it("maps the callable response", () => {
    const data = mapProviderDashboard(RAW_DASHBOARD);
    expect(data.categorySet).toBe("clinic");
    expect(data.range).toEqual({ preset: 7, fromDate: "2026-11-06", toDate: "2026-11-12" });
    expect(data.visits).toBe(12);
    expect(data.newPatients).toBe(4);
    expect(data.services).toEqual([
      { serviceId: "s1", branchId: "b1", nameEn: "Checkup", nameAr: "كشف", count: 9, sharePercent: 75 },
      { serviceId: "other", branchId: "", nameEn: null, nameAr: null, count: 3, sharePercent: 25 },
    ]);
    expect(data.rating.overallTenths).toBe(43);
    expect(data.rating.categories).toHaveLength(3);
    expect(data.rating.tagCounts).toEqual({ friendly_doctor: 2, clean_clinic: 1 });
  });

  it("uses safe defaults and computes a missing share half up", () => {
    const data = mapProviderDashboard({
      services: [
        { serviceId: "a", count: 1 },
        { serviceId: "b", count: 2 },
        { serviceId: "c", count: 0 },
      ],
    });
    expect(data.range.preset).toBe(30);
    expect(data.visits).toBe(0);
    expect(data.categorySet).toBeNull();
    expect(data.services.map((s) => s.sharePercent)).toEqual([33, 67]);
    expect(data.rating).toEqual({ count: 0, overallTenths: null, categories: [], tagCounts: {} });
  });
});

describe("provider dashboard callable", () => {
  it("sends the preset and the branch only when set", async () => {
    mocks.callableFn.mockResolvedValue({ data: RAW_DASHBOARD });
    await getProviderDashboard({ preset: 90 });
    expect(mocks.httpsCallable.mock.calls.at(-1)?.[1]).toBe("vendor_dashboard-getProviderDashboard");
    expect(mocks.callableFn.mock.calls.at(-1)?.[0]).toEqual({ preset: 90 });
    await getProviderDashboard({ preset: 7, branchId: "b1" });
    expect(mocks.callableFn.mock.calls.at(-1)?.[0]).toEqual({ preset: 7, branchId: "b1" });
  });
});

describe("dashboard stats helpers", () => {
  it("rounds percents half up with Western digits", () => {
    expect(halfUpPercent(1, 8)).toBe(13);
    expect(halfUpPercent(1, 3)).toBe(33);
    expect(halfUpPercent(1, 200)).toBe(1);
    expect(halfUpPercent(0, 5)).toBe(0);
    expect(halfUpPercent(3, 0)).toBe(0);
    expect(formatPercent(45)).toBe("45%");
  });

  it("orders top tags by count then id and drops zeros", () => {
    expect(
      topTags({ clean_clinic: 2, friendly_doctor: 2, clear_explanation: 5, long_waiting_time: 0, great_result: 1 }),
    ).toEqual([
      { id: "clear_explanation", count: 5 },
      { id: "clean_clinic", count: 2 },
      { id: "friendly_doctor", count: 2 },
    ]);
  });
});
