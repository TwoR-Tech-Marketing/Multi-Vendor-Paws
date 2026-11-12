import { describe, expect, it } from "vitest";

import {
  parseBranchForm,
  parseServiceForm,
  type BranchFormValues,
  type ServiceFormValues,
} from "@/features/branches/domain/schemas";

const BRANCH: BranchFormValues = {
  name: "  Nasr City ",
  address: "12 Abbas El Akkad",
  lat: "30.05",
  lng: "31.34",
  phone: "+20 100-000-0000",
  homeVisitEnabled: false,
  homeVisitFeeEgp: "",
  homeVisitRadiusMeters: "",
};

const SERVICE: ServiceFormValues = {
  nameEn: "Checkup",
  nameAr: "كشف",
  priceEgp: "250.50",
  durationMinutes: "30",
};

describe("parseBranchForm", () => {
  it("builds the payload with trimmed text and home visit off as zeros", () => {
    const result = parseBranchForm(BRANCH);
    expect(result).toEqual({
      ok: true,
      payload: {
        name: "Nasr City",
        address: "12 Abbas El Akkad",
        location: { lat: 30.05, lng: 31.34 },
        phone: "+20 100-000-0000",
        homeVisit: { enabled: false, feePiastres: 0, radiusMeters: 0 },
      },
    });
  });

  it("converts the home visit fee from EGP to integer piastres", () => {
    const result = parseBranchForm({
      ...BRANCH,
      homeVisitEnabled: true,
      homeVisitFeeEgp: "150.25",
      homeVisitRadiusMeters: "3000",
    });
    expect(result.ok && result.payload.homeVisit).toEqual({
      enabled: true,
      feePiastres: 15025,
      radiusMeters: 3000,
    });
  });

  it("accepts a free home visit and the radius bounds", () => {
    for (const radius of ["500", "50000"]) {
      const result = parseBranchForm({
        ...BRANCH,
        homeVisitEnabled: true,
        homeVisitFeeEgp: "0",
        homeVisitRadiusMeters: radius,
      });
      expect(result.ok).toBe(true);
    }
  });

  it.each([
    [{ name: "A" }, "name"],
    [{ name: "x".repeat(81) }, "name"],
    [{ address: "abc" }, "address"],
    [{ lat: "" }, "location"],
    [{ lat: "91" }, "location"],
    [{ lng: "abc" }, "location"],
    [{ phone: "12345" }, "phone"],
    [{ phone: "0100abc0000" }, "phone"],
  ] as const)("flags %o as %s", (patch, field) => {
    const result = parseBranchForm({ ...BRANCH, ...patch });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[field]).toBe(true);
  });

  it.each([
    [{ homeVisitFeeEgp: "" }, "homeVisitFee"],
    [{ homeVisitFeeEgp: "-1" }, "homeVisitFee"],
    [{ homeVisitFeeEgp: "100000.01" }, "homeVisitFee"],
    [{ homeVisitFeeEgp: "1.234" }, "homeVisitFee"],
    [{ homeVisitRadiusMeters: "499" }, "homeVisitRadius"],
    [{ homeVisitRadiusMeters: "50001" }, "homeVisitRadius"],
    [{ homeVisitRadiusMeters: "1000.5" }, "homeVisitRadius"],
  ] as const)("flags enabled home visit %o as %s", (patch, field) => {
    const result = parseBranchForm({
      ...BRANCH,
      homeVisitEnabled: true,
      homeVisitFeeEgp: "100",
      homeVisitRadiusMeters: "2000",
      ...patch,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[field]).toBe(true);
  });
});

describe("parseServiceForm", () => {
  it("converts the price to integer piastres", () => {
    expect(parseServiceForm(SERVICE)).toEqual({
      ok: true,
      payload: { nameEn: "Checkup", nameAr: "كشف", pricePiastres: 25050, durationMinutes: 30 },
    });
  });

  it("allows a free service and the duration bounds", () => {
    for (const durationMinutes of ["5", "480"]) {
      const result = parseServiceForm({ ...SERVICE, priceEgp: "0", durationMinutes });
      expect(result.ok).toBe(true);
    }
  });

  it.each([
    [{ nameEn: "A" }, "nameEn"],
    [{ nameAr: "" }, "nameAr"],
    [{ priceEgp: "" }, "price"],
    [{ priceEgp: "100000.01" }, "price"],
    [{ priceEgp: "-5" }, "price"],
    [{ durationMinutes: "4" }, "duration"],
    [{ durationMinutes: "485" }, "duration"],
    [{ durationMinutes: "32" }, "duration"],
    [{ durationMinutes: "" }, "duration"],
  ] as const)("flags %o as %s", (patch, field) => {
    const result = parseServiceForm({ ...SERVICE, ...patch });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[field]).toBe(true);
  });
});
