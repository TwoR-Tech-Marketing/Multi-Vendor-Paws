import { describe, expect, it } from "vitest";

import {
  firstSignupBusinessError,
  signupBusinessSchema,
} from "@/features/auth/domain/signup-schema";

const base = { storeName: "Happy Tails", storeDescription: "Pet care" };

describe("signupBusinessSchema", () => {
  it("accepts a store with no provider fields", () => {
    expect(signupBusinessSchema.parse({ ...base, vendorType: "store" })).toEqual({
      ...base,
      vendorType: "store",
    });
    expect(firstSignupBusinessError({ ...base, vendorType: "store", providerProfile: {} })).toBe(
      null,
    );
  });

  it("refuses provider fields for a store", () => {
    expect(
      firstSignupBusinessError({
        ...base,
        vendorType: "store",
        providerProfile: { specialty: "Surgery" },
      }),
    ).toBe("fieldNotAllowed");
  });

  it("requires a doctor specialty of 2 to 80 characters", () => {
    expect(firstSignupBusinessError({ ...base, vendorType: "doctor" })).toBe("specialtyRequired");
    expect(
      firstSignupBusinessError({ ...base, vendorType: "doctor", providerProfile: {} }),
    ).toBe("specialtyRequired");
    expect(
      firstSignupBusinessError({ ...base, vendorType: "doctor", providerProfile: { specialty: " a " } }),
    ).toBe("specialtyLength");
    expect(
      firstSignupBusinessError({
        ...base,
        vendorType: "doctor",
        providerProfile: { specialty: "x".repeat(81) },
      }),
    ).toBe("specialtyLength");
    expect(
      signupBusinessSchema.parse({
        ...base,
        vendorType: "doctor",
        providerProfile: { specialty: " Surgery " },
      }).providerProfile,
    ).toEqual({ specialty: "Surgery" });
  });

  it("limits the doctor short bio to 500 characters", () => {
    expect(
      firstSignupBusinessError({
        vendorType: "doctor",
        storeName: "Dr. A",
        storeDescription: "x".repeat(501),
        providerProfile: { specialty: "Surgery" },
      }),
    ).toBe("descriptionTooLong");
    expect(
      firstSignupBusinessError({
        vendorType: "clinic",
        storeName: "Clinic",
        storeDescription: "x".repeat(501),
      }),
    ).toBe(null);
  });

  it("accepts clinic education and experience, empty becomes null", () => {
    expect(
      signupBusinessSchema.parse({
        ...base,
        vendorType: "clinic",
        providerProfile: { education: " DVM ", experience: "" },
      }).providerProfile,
    ).toEqual({ education: "DVM", experience: null });
    expect(
      firstSignupBusinessError({
        ...base,
        vendorType: "clinic",
        providerProfile: { education: "x".repeat(1001) },
      }),
    ).toBe("textTooLong");
  });

  it("refuses groomer education and photoUrls at signup", () => {
    expect(
      firstSignupBusinessError({
        ...base,
        vendorType: "groomer",
        providerProfile: { education: "DVM" },
      }),
    ).toBe("fieldNotAllowed");
    expect(
      firstSignupBusinessError({
        ...base,
        vendorType: "clinic",
        providerProfile: { photoUrls: ["https://example.com/a.jpg"] },
      }),
    ).toBe("fieldNotAllowed");
  });

  it("refuses unknown types and missing names", () => {
    expect(firstSignupBusinessError({ ...base, vendorType: "hotel" })).not.toBe(null);
    expect(firstSignupBusinessError({ ...base, vendorType: "store", storeName: " " })).toBe(
      "nameRequired",
    );
  });
});
