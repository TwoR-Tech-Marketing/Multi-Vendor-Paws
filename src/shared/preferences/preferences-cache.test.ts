import { describe, expect, it, vi } from "vitest";

import {
  DEFAULT_VENDOR_PREFERENCES,
  PREFERENCE_STORAGE_KEYS,
  normalizeVendorPreferences,
  resolveThemeMode,
} from "@/shared/preferences/domain/types";
import {
  applyDocumentPreferences,
  readCachedPreferences,
  readPrefersDark,
  subscribePrefersDark,
  writeCachedPreferences,
} from "@/shared/preferences/preferences-cache";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (key: string) => (key in data ? data[key] : null),
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
  };
}

describe("normalizeVendorPreferences", () => {
  it("fills defaults for absent or unknown values", () => {
    expect(normalizeVendorPreferences(undefined)).toEqual(DEFAULT_VENDOR_PREFERENCES);
    expect(normalizeVendorPreferences({ theme: "signal", mode: "bogus" })).toEqual({
      theme: "signal",
      mode: "system",
      language: "en",
    });
  });

  it("defaults to TenderPaws, system and English", () => {
    expect(DEFAULT_VENDOR_PREFERENCES).toEqual({ theme: "tenderpaws", mode: "system", language: "en" });
  });
});

describe("resolveThemeMode", () => {
  it("follows the device only in system mode", () => {
    expect(resolveThemeMode("system", true)).toBe("dark");
    expect(resolveThemeMode("system", false)).toBe("light");
    expect(resolveThemeMode("light", true)).toBe("light");
    expect(resolveThemeMode("dark", false)).toBe("dark");
  });
});

describe("device cache", () => {
  it("reads defaults from an empty cache and without storage", () => {
    expect(readCachedPreferences(memoryStorage())).toEqual(DEFAULT_VENDOR_PREFERENCES);
    expect(readCachedPreferences(null)).toEqual(DEFAULT_VENDOR_PREFERENCES);
  });

  it("keeps the original key for the mode so earlier light and dark choices still apply", () => {
    const storage = memoryStorage({ "tp-vendor-theme": "dark" });
    expect(readCachedPreferences(storage).mode).toBe("dark");
  });

  it("writes only the given keys", () => {
    const storage = memoryStorage();
    writeCachedPreferences({ theme: "nile" }, storage);
    expect(storage.data).toEqual({ [PREFERENCE_STORAGE_KEYS.theme]: "nile" });
    writeCachedPreferences({ mode: "system", language: "ar" }, storage);
    expect(readCachedPreferences(storage)).toEqual({ theme: "nile", mode: "system", language: "ar" });
  });

  it("does not throw when storage is blocked", () => {
    const blocked = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(readCachedPreferences(blocked)).toEqual(DEFAULT_VENDOR_PREFERENCES);
    expect(() => writeCachedPreferences({ theme: "nile" }, blocked)).not.toThrow();
  });
});

describe("system mode follows the device live", () => {
  it("reads prefers-color-scheme and notifies on change", () => {
    const listeners = new Set<() => void>();
    const list = {
      matches: false,
      addEventListener: vi.fn((_: string, cb: () => void) => listeners.add(cb)),
      removeEventListener: vi.fn((_: string, cb: () => void) => listeners.delete(cb)),
    };
    const matchMedia = vi.fn(() => list as unknown as MediaQueryList);

    expect(readPrefersDark(matchMedia)).toBe(false);

    const onChange = vi.fn();
    const unsubscribe = subscribePrefersDark(onChange, matchMedia);
    expect(matchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");

    list.matches = true;
    listeners.forEach((cb) => cb());
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(readPrefersDark(matchMedia)).toBe(true);
    expect(resolveThemeMode("system", readPrefersDark(matchMedia))).toBe("dark");

    unsubscribe();
    expect(listeners.size).toBe(0);
  });

  it("treats an unknown device setting as light", () => {
    expect(readPrefersDark(null)).toBe(false);
    expect(subscribePrefersDark(() => {}, null)).toBeTypeOf("function");
  });
});

describe("applyDocumentPreferences", () => {
  it("sets theme, resolved mode, lang and dir on the root", () => {
    const attrs: Record<string, string> = {};
    const root = { lang: "en", dir: "ltr", setAttribute: (n: string, v: string) => (attrs[n] = v) };
    applyDocumentPreferences(root, { theme: "signal", mode: "system", language: "ar" }, "dark");
    expect(attrs).toEqual({ "data-tp-theme": "signal", "data-theme": "dark" });
    expect(root.lang).toBe("ar");
    expect(root.dir).toBe("rtl");
  });
});
