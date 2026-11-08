import { describe, expect, it } from "vitest";

import { Routes } from "@/constants/routes";
import {
  isAllowedPortalSessionKind,
  portalPostLoginDestination,
  portalPostLoginHref,
} from "@/features/auth/domain/portal-account-gate";

describe("portalPostLoginDestination", () => {
  it("sends active vendors to the dashboard", () => {
    expect(portalPostLoginDestination("active")).toBe("dashboard");
    expect(portalPostLoginHref("active")).toBe(Routes.vendor.dashboard);
  });

  it("sends status kinds to profile", () => {
    for (const kind of ["pending", "rejected", "suspended", "banned"] as const) {
      expect(portalPostLoginDestination(kind)).toBe("profile");
      expect(portalPostLoginHref(kind)).toBe(Routes.vendor.profile);
    }
  });

  it("rejects non-vendor kinds without inventing active", () => {
    for (const kind of [
      "mobile_app_account",
      "wrong_sign_in_email",
      "not_vendor",
      "unknown_future_kind",
      null,
      undefined,
    ]) {
      expect(portalPostLoginDestination(kind)).toBe("reject");
      expect(portalPostLoginHref(kind)).toBeNull();
    }
  });
});

describe("isAllowedPortalSessionKind", () => {
  it("allows status screens including rejected and banned", () => {
    expect(isAllowedPortalSessionKind("active")).toBe(true);
    expect(isAllowedPortalSessionKind("pending")).toBe(true);
    expect(isAllowedPortalSessionKind("rejected")).toBe(true);
    expect(isAllowedPortalSessionKind("suspended")).toBe(true);
    expect(isAllowedPortalSessionKind("banned")).toBe(true);
  });

  it("denies non-vendor kinds", () => {
    expect(isAllowedPortalSessionKind("mobile_app_account")).toBe(false);
    expect(isAllowedPortalSessionKind("wrong_sign_in_email")).toBe(false);
    expect(isAllowedPortalSessionKind("not_vendor")).toBe(false);
  });
});
