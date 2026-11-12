import { describe, expect, it } from "vitest";

import {
  mapProfile,
  type CallableSessionProfile,
} from "@/features/auth/infrastructure/session-profile.mapper";

const legacy: CallableSessionProfile = {
  vendorId: "v1",
  ownerName: "Owner",
  email: "a@b.co",
  storeName: "Store",
  status: "active",
};

describe("mapProfile", () => {
  it("returns null without a profile", () => {
    expect(mapProfile(null)).toBe(null);
  });

  it("defaults vendorType to store when the callable omits it", () => {
    expect(mapProfile(legacy)?.vendorType).toBe("store");
    expect(mapProfile({ ...legacy, vendorType: null })?.vendorType).toBe("store");
    expect(mapProfile({ ...legacy, vendorType: "" })?.vendorType).toBe("store");
  });

  it("maps the session vendorType", () => {
    expect(mapProfile({ ...legacy, vendorType: "clinic" })?.vendorType).toBe("clinic");
    expect(mapProfile({ ...legacy, vendorType: "doctor" })?.vendorType).toBe("doctor");
    expect(mapProfile({ ...legacy, vendorType: "hotel" })?.vendorType).toBe("hotel");
  });

  it("keeps the existing fields", () => {
    const mapped = mapProfile({
      ...legacy,
      restrictionExpiresAt: "2026-01-01T00:00:00.000Z",
      suspensionMode: "view_only",
    });
    expect(mapped?.restrictionExpiresAt?.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(mapped?.suspensionMode).toBe("view_only");
    expect(mapped?.logoUrl).toBe(null);
  });
});
