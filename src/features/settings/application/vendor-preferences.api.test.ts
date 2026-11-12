import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ invokeCallable: vi.fn() }));

vi.mock("@/lib/callable", () => ({ invokeCallable: mocks.invokeCallable }));

import {
  CALLABLE_SET_PREFERENCES,
  changeAppearancePreference,
  mapSetPreferencesResponse,
  saveVendorPreferences,
  syncSessionPreferences,
} from "@/features/settings/application/vendor-preferences.api";

beforeEach(() => {
  mocks.invokeCallable.mockReset();
});

describe("saveVendorPreferences", () => {
  it("sends only the changed keys to the shared callable", async () => {
    mocks.invokeCallable.mockResolvedValue({
      success: true,
      data: { preferences: { theme: "nile", mode: "system", language: "en" } },
    });
    const saved = await saveVendorPreferences({ theme: "nile" });
    expect(CALLABLE_SET_PREFERENCES).toBe("vendor_preferences-setVendorPreferences");
    expect(mocks.invokeCallable).toHaveBeenCalledWith(CALLABLE_SET_PREFERENCES, { theme: "nile" });
    expect(saved).toEqual({ theme: "nile", mode: "system", language: "en" });
  });

  it("fills defaults in a partial response", () => {
    expect(mapSetPreferencesResponse({ success: true, data: { preferences: { mode: "dark" } } })).toEqual({
      theme: "tenderpaws",
      mode: "dark",
      language: "en",
    });
    expect(mapSetPreferencesResponse(null)).toEqual({ theme: "tenderpaws", mode: "system", language: "en" });
  });
});

describe("changeAppearancePreference", () => {
  it("applies at once, then saves on the account", async () => {
    const order: string[] = [];
    const apply = vi.fn(() => order.push("apply"));
    const save = vi.fn(async () => {
      order.push("save");
    });
    const result = await changeAppearancePreference({ mode: "dark" }, { apply, save, scope: "account" });
    expect(result).toBe("saved");
    expect(order).toEqual(["apply", "save"]);
    expect(save).toHaveBeenCalledWith({ mode: "dark" });
  });

  it("keeps the local value and reports failure when saving fails", async () => {
    const apply = vi.fn();
    const save = vi.fn(async () => {
      throw new Error("unavailable");
    });
    const result = await changeAppearancePreference({ language: "ar" }, { apply, save, scope: "account" });
    expect(result).toBe("failed");
    expect(apply).toHaveBeenCalledWith({ language: "ar" });
  });

  it("stays local without an account record", async () => {
    const apply = vi.fn();
    const save = vi.fn();
    const result = await changeAppearancePreference({ theme: "signal" }, { apply, save, scope: "local" });
    expect(result).toBe("local");
    expect(apply).toHaveBeenCalledWith({ theme: "signal" });
    expect(save).not.toHaveBeenCalled();
  });
});

describe("syncSessionPreferences", () => {
  const device = { theme: "cobalt", mode: "dark", language: "ar" } as const;
  const account = { theme: "nile", mode: "light", language: "en" } as const;

  function deps(save = vi.fn(async () => undefined)) {
    return { applyAccount: vi.fn(), readDevice: vi.fn(() => ({ ...device })), save };
  }

  it("keeps the device values and never saves for local scope", async () => {
    const d = deps();
    const stored = await syncSessionPreferences(
      { preferences: account, preferencesScope: "local", preferencesSet: false },
      d,
    );
    expect(stored).toBe(false);
    expect(d.applyAccount).not.toHaveBeenCalled();
    expect(d.save).not.toHaveBeenCalled();
  });

  it("applies the stored account value", async () => {
    const d = deps();
    const stored = await syncSessionPreferences(
      { preferences: account, preferencesScope: "account", preferencesSet: true },
      d,
    );
    expect(stored).toBe(true);
    expect(d.applyAccount).toHaveBeenCalledWith(account);
    expect(d.save).not.toHaveBeenCalled();
  });

  it("saves the device values once when the account has none", async () => {
    const d = deps();
    const stored = await syncSessionPreferences(
      { preferences: account, preferencesScope: "account", preferencesSet: false },
      d,
    );
    expect(stored).toBe(true);
    expect(d.save).toHaveBeenCalledTimes(1);
    expect(d.save).toHaveBeenCalledWith(device);
    expect(d.applyAccount).not.toHaveBeenCalled();
  });

  it("keeps the device values when that first save fails", async () => {
    const d = deps(
      vi.fn(async () => {
        throw new Error("unavailable");
      }),
    );
    const stored = await syncSessionPreferences(
      { preferences: account, preferencesScope: "account", preferencesSet: false },
      d,
    );
    expect(stored).toBe(false);
    expect(d.applyAccount).not.toHaveBeenCalled();
  });
});
