import { describe, expect, it } from "vitest";

import { profileChangeSchema } from "@/features/vendor/domain/profile-change-schema";
import {
  buildProviderProfilePayload,
  buildReapplyProviderProfile,
} from "@/features/vendor/domain/provider-profile-schema";

const base = {
  ownerName: "Owner",
  phone: "0100",
  storeName: "Name",
  storeDescription: "About",
  contactPhone: "0100",
  contactEmail: "a@b.co",
  contactAddress: "Cairo",
};

describe("profileChangeSchema", () => {
  it("keeps today's store payload valid", () => {
    expect(profileChangeSchema("store").safeParse(base).success).toBe(true);
    expect(profileChangeSchema(undefined).safeParse({ ...base, logoUrl: null }).success).toBe(true);
    expect(profileChangeSchema("store").safeParse({ ...base, providerProfile: {} }).success).toBe(
      true,
    );
  });

  it("accepts provider fields allowed for the session type", () => {
    const clinic = profileChangeSchema("clinic").parse({
      ...base,
      providerProfile: {
        education: " Vet school ",
        experience: "",
        photoUrls: ["https://example.com/a.jpg"],
      },
    });
    expect(clinic.providerProfile).toEqual({
      education: "Vet school",
      experience: null,
      photoUrls: ["https://example.com/a.jpg"],
    });
    expect(
      profileChangeSchema("doctor").safeParse({ ...base, providerProfile: { specialty: "Surgery" } })
        .success,
    ).toBe(true);
    expect(
      profileChangeSchema("groomer").safeParse({
        ...base,
        providerProfile: { photoUrls: ["https://example.com/a.jpg"] },
      }).success,
    ).toBe(true);
  });

  it("refuses provider fields outside the session type and bad values", () => {
    expect(
      profileChangeSchema("store").safeParse({ ...base, providerProfile: { specialty: "Surgery" } })
        .success,
    ).toBe(false);
    expect(
      profileChangeSchema("groomer").safeParse({ ...base, providerProfile: { education: "x" } })
        .success,
    ).toBe(false);
    expect(
      profileChangeSchema("doctor").safeParse({ ...base, providerProfile: { specialty: "x" } })
        .success,
    ).toBe(false);
    expect(
      profileChangeSchema("clinic").safeParse({
        ...base,
        providerProfile: { photoUrls: ["http://example.com/a.jpg"] },
      }).success,
    ).toBe(false);
    expect(
      profileChangeSchema("clinic").safeParse({
        ...base,
        providerProfile: { photoUrls: Array(7).fill("https://example.com/a.jpg") },
      }).success,
    ).toBe(false);
  });

  it("refuses vendorType", () => {
    expect(profileChangeSchema("store").safeParse({ ...base, vendorType: "store" }).success).toBe(
      false,
    );
    expect(profileChangeSchema("clinic").safeParse({ ...base, vendorType: "doctor" }).success).toBe(
      false,
    );
  });
});

describe("buildProviderProfilePayload", () => {
  const text = { specialty: "Surgery", education: "", experience: " 5 years " };

  it("keeps only the type's text fields", () => {
    expect(buildProviderProfilePayload("store", text)).toBe(undefined);
    expect(buildProviderProfilePayload("groomer", text)).toBe(undefined);
    expect(buildProviderProfilePayload("doctor", text)).toEqual({ specialty: "Surgery" });
    expect(buildProviderProfilePayload("clinic", text)).toEqual({ experience: " 5 years " });
    expect(buildProviderProfilePayload("clinic", text, true)).toEqual({
      education: "",
      experience: " 5 years ",
    });
  });
});

describe("buildReapplyProviderProfile", () => {
  const empty = { specialty: "", education: "", experience: "" };

  it("omits provider fields when the type is kept and nothing was typed", () => {
    expect(buildReapplyProviderProfile("doctor", "doctor", empty)).toBe(undefined);
    expect(buildReapplyProviderProfile("store", "store", empty)).toBe(undefined);
  });

  it("sends provider fields when the type changes or the applicant typed", () => {
    expect(buildReapplyProviderProfile("store", "doctor", empty)).toEqual({ specialty: "" });
    expect(
      buildReapplyProviderProfile("clinic", "clinic", { ...empty, education: "DVM" }),
    ).toEqual({ education: "DVM" });
    expect(buildReapplyProviderProfile("doctor", "store", empty)).toBe(undefined);
  });
});
