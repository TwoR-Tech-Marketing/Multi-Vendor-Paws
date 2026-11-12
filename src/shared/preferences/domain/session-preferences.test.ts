import { describe, expect, it } from "vitest";

import {
  decideSessionPreferences,
  mapSessionPreferences,
} from "@/shared/preferences/domain/session-preferences";

describe("decideSessionPreferences", () => {
  it("keeps the device values without an account record", () => {
    expect(decideSessionPreferences({ preferencesScope: "local", preferencesSet: false })).toBe("keepDevice");
    expect(decideSessionPreferences({ preferencesScope: "local", preferencesSet: true })).toBe("keepDevice");
  });

  it("applies the account value when one is stored", () => {
    expect(decideSessionPreferences({ preferencesScope: "account", preferencesSet: true })).toBe("applyAccount");
  });

  it("saves the device values when the account has none yet", () => {
    expect(decideSessionPreferences({ preferencesScope: "account", preferencesSet: false })).toBe("saveDevice");
  });
});

describe("mapSessionPreferences", () => {
  it("reads the callable fields", () => {
    expect(
      mapSessionPreferences({
        preferences: { theme: "signal", mode: "light", language: "ar" },
        preferencesScope: "account",
        preferencesSet: true,
      }),
    ).toEqual({
      preferences: { theme: "signal", mode: "light", language: "ar" },
      preferencesScope: "account",
      preferencesSet: true,
    });
  });

  it("treats missing fields as local, defaults and not set", () => {
    expect(mapSessionPreferences(undefined)).toEqual({
      preferences: { theme: "tenderpaws", mode: "system", language: "en" },
      preferencesScope: "local",
      preferencesSet: false,
    });
    expect(mapSessionPreferences({ preferencesScope: "local", preferencesSet: true }).preferencesSet).toBe(false);
  });
});
