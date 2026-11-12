import { runInNewContext } from "node:vm";

import { describe, expect, it } from "vitest";

import { buildPreferencesBootstrapScript } from "@/shared/preferences/domain/bootstrap-script";
import { PREFERENCE_STORAGE_KEYS } from "@/shared/preferences/domain/types";

type RunOptions = {
  stored?: Record<string, string>;
  prefersDark?: boolean;
  storageThrows?: boolean;
};

function runBootstrap({ stored = {}, prefersDark = false, storageThrows = false }: RunOptions) {
  const attributes: Record<string, string> = {};
  const root = {
    lang: "en",
    dir: "ltr",
    setAttribute(name: string, value: string) {
      attributes[name] = value;
    },
  };
  const queries: string[] = [];
  const context = {
    localStorage: {
      getItem(key: string) {
        if (storageThrows) throw new Error("blocked");
        return key in stored ? stored[key] : null;
      },
    },
    window: {
      matchMedia(query: string) {
        queries.push(query);
        return { matches: prefersDark };
      },
    },
    document: { documentElement: root },
  };
  runInNewContext(buildPreferencesBootstrapScript(), context);
  return { attributes, lang: root.lang, dir: root.dir, queries };
}

describe("preferences bootstrap script", () => {
  it("applies the defaults when nothing is cached (TenderPaws, system, English)", () => {
    const result = runBootstrap({});
    expect(result.attributes["data-tp-theme"]).toBe("tenderpaws");
    expect(result.attributes["data-theme"]).toBe("light");
    expect(result.lang).toBe("en");
    expect(result.dir).toBe("ltr");
  });

  it("resolves system mode with prefers-color-scheme", () => {
    const result = runBootstrap({ prefersDark: true });
    expect(result.attributes["data-theme"]).toBe("dark");
    expect(result.queries).toEqual(["(prefers-color-scheme: dark)"]);
  });

  it("applies cached theme, mode and Arabic with RTL", () => {
    const result = runBootstrap({
      stored: {
        [PREFERENCE_STORAGE_KEYS.theme]: "cobalt",
        [PREFERENCE_STORAGE_KEYS.mode]: "dark",
        [PREFERENCE_STORAGE_KEYS.locale]: "ar",
      },
    });
    expect(result.attributes["data-tp-theme"]).toBe("cobalt");
    expect(result.attributes["data-theme"]).toBe("dark");
    expect(result.lang).toBe("ar");
    expect(result.dir).toBe("rtl");
  });

  it("keeps an explicit light mode on a dark device", () => {
    const result = runBootstrap({
      stored: { [PREFERENCE_STORAGE_KEYS.mode]: "light" },
      prefersDark: true,
    });
    expect(result.attributes["data-theme"]).toBe("light");
  });

  it("ignores unknown cached values", () => {
    const result = runBootstrap({
      stored: {
        [PREFERENCE_STORAGE_KEYS.theme]: "purple",
        [PREFERENCE_STORAGE_KEYS.mode]: "dim",
        [PREFERENCE_STORAGE_KEYS.locale]: "fr",
      },
    });
    expect(result.attributes["data-tp-theme"]).toBe("tenderpaws");
    expect(result.attributes["data-theme"]).toBe("light");
    expect(result.lang).toBe("en");
  });

  it("still sets every attribute when storage is blocked", () => {
    const result = runBootstrap({ storageThrows: true, prefersDark: true });
    expect(result.attributes["data-tp-theme"]).toBe("tenderpaws");
    expect(result.attributes["data-theme"]).toBe("dark");
  });
});
