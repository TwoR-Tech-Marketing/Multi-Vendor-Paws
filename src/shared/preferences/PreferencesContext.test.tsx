import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PREFERENCE_STORAGE_KEYS } from "@/shared/preferences/domain/types";
import { PreferencesProvider, usePreferences } from "@/shared/preferences/PreferencesContext";

function Probe() {
  const p = usePreferences();
  return (
    <output>
      {[p.theme, p.mode, p.resolvedMode, p.locale, p.dir, p.strings.settings.modeLabel].join("|")}
    </output>
  );
}

function render() {
  return renderToStaticMarkup(
    <PreferencesProvider>
      <Probe />
    </PreferencesProvider>,
  );
}

function stubCache(values: Record<string, string>) {
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => values[key] ?? null,
      setItem: () => undefined,
    },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PreferencesProvider", () => {
  it("starts from the defaults when nothing is cached", () => {
    expect(render()).toContain("tenderpaws|system|light|en|ltr|Mode");
  });

  it("starts from the device cache", () => {
    stubCache({
      [PREFERENCE_STORAGE_KEYS.theme]: "nile",
      [PREFERENCE_STORAGE_KEYS.mode]: "dark",
      [PREFERENCE_STORAGE_KEYS.locale]: "ar",
    });
    expect(render()).toContain("nile|dark|dark|ar|rtl|الوضع");
  });

  it("resolves system mode to light before the device is known", () => {
    stubCache({ [PREFERENCE_STORAGE_KEYS.mode]: "system" });
    expect(render()).toContain("tenderpaws|system|light|en|ltr");
  });

  it("throws outside the provider", () => {
    expect(() => renderToStaticMarkup(<Probe />)).toThrow(/PreferencesProvider/);
  });
});
