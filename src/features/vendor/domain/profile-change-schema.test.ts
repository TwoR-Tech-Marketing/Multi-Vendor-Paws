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

  it("refuses duplicate photo URLs", () => {
    expect(
      profileChangeSchema("groomer").safeParse({
        ...base,
        providerProfile: { photoUrls: ["https://example.com/a.jpg", "https://example.com/a.jpg"] },
      }).success,
    ).toBe(false);
  });

  it("limits photos to the vendor photos folder or the stored list", () => {
    const own = (path: string, bucket = "b1") =>
      `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media`;
    const owner = { vendorId: "v1", storedUrls: ["https://example.com/old.jpg"], bucket: "b1" };
    const parse = (photoUrls: string[]) =>
      profileChangeSchema("clinic", owner).safeParse({ ...base, providerProfile: { photoUrls } })
        .success;
    expect(parse([own("vendors/v1/photos/1_a.jpg"), "https://example.com/old.jpg"])).toBe(true);
    expect(parse([])).toBe(true);
    expect(parse([own("vendors/v2/photos/1_a.jpg")])).toBe(false);
    expect(parse([own("vendors/v1/photos/1_a.jpg", "b2")])).toBe(false);
    expect(parse(["https://example.com/new.jpg"])).toBe(false);
    expect(
      profileChangeSchema("clinic", owner).safeParse({
        ...base,
        providerProfile: { education: "Vet school" },
      }).success,
    ).toBe(true);
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

  it("sends the full text map of a provider type, empty fields included", () => {
    expect(
      buildReapplyProviderProfile("clinic", { ...empty, education: "DVM" }),
    ).toEqual({ education: "DVM", experience: "" });
    expect(buildReapplyProviderProfile("clinic", empty)).toEqual({
      education: "",
      experience: "",
    });
    expect(buildReapplyProviderProfile("doctor", { ...empty, specialty: "Surgery" })).toEqual({
      specialty: "Surgery",
    });
  });

  it("clears a prefilled field after validation", async () => {
    const { providerProfileSchema } = await import(
      "@/features/vendor/domain/provider-profile-schema"
    );
    const payload = buildReapplyProviderProfile("clinic", { ...empty, education: "" });
    expect(providerProfileSchema("clinic", "signup").parse(payload)).toEqual({
      education: null,
      experience: null,
    });
  });

  it("sends nothing for types without text fields", () => {
    expect(buildReapplyProviderProfile("store", empty)).toBe(undefined);
    expect(buildReapplyProviderProfile("groomer", empty)).toBe(undefined);
  });
});
