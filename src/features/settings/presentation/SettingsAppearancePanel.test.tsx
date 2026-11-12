import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { getStrings } from "@/shared/i18n/get-strings";

import { SettingsAppearancePanel } from "./SettingsAppearancePanel";
import { SettingsSkeleton } from "./SettingsSkeleton";

const noop = () => undefined;

function render(locale: "en" | "ar" = "en", overrides: Partial<Parameters<typeof SettingsAppearancePanel>[0]> = {}) {
  return renderToStaticMarkup(
    <SettingsAppearancePanel
      strings={getStrings(locale)}
      theme="tenderpaws"
      mode="system"
      resolvedMode="light"
      locale={locale}
      scope="account"
      onThemeChange={noop}
      onModeChange={noop}
      onLocaleChange={noop}
      {...overrides}
    />,
  );
}

describe("SettingsAppearancePanel", () => {
  const en = getStrings("en");

  it("shows one section with Theme, Mode and Language in that order", () => {
    const html = render();
    expect(html).toContain(en.settings.appearanceTitle);
    const theme = html.indexOf(en.settings.themeLabel);
    const mode = html.indexOf(en.settings.modeLabel);
    const language = html.indexOf(`>${en.settings.languageLabel}<`);
    expect(theme).toBeGreaterThan(-1);
    expect(mode).toBeGreaterThan(theme);
    expect(language).toBeGreaterThan(mode);
  });

  it("lists four themes with TenderPaws first and marked as the default", () => {
    const html = render();
    const ids = [...html.matchAll(/data-theme-id="([a-z]+)"/g)].map((m) => m[1]);
    expect(ids).toEqual(["tenderpaws", "nile", "cobalt", "signal"]);
    const marker = `>${en.settings.themeDefault}<`;
    expect(html.split(marker)).toHaveLength(2);
    expect(html.indexOf(marker)).toBeGreaterThan(html.indexOf(`>${en.settings.themeNames.tenderpaws}<`));
    expect(html.indexOf(marker)).toBeLessThan(html.indexOf(`>${en.settings.themeNames.nile}<`));
  });

  it("marks the selected theme and mode", () => {
    const html = render("en", { theme: "cobalt", mode: "dark" });
    expect(html).toMatch(/aria-checked="true"[^>]*data-theme-id="cobalt"/);
    expect(html.match(/aria-checked="true"/g)).toHaveLength(1);
    expect(html).toMatch(/data-mode="dark"[^>]*aria-pressed="true"/);
    expect(html).toMatch(/data-mode="system"[^>]*aria-pressed="false"/);
  });

  it("offers Light, Dark and System modes", () => {
    const html = render();
    const modes = [...html.matchAll(/data-mode="([a-z]+)"/g)].map((m) => m[1]);
    expect(modes).toEqual(["light", "dark", "system"]);
  });

  it("explains where choices are saved", () => {
    expect(render("en", { scope: "account" })).toContain(en.settings.savedHintAccount);
    expect(render("en", { scope: "local" })).toContain(en.settings.savedHint);
  });

  it("renders in Arabic", () => {
    const ar = getStrings("ar");
    const html = render("ar");
    expect(html).toContain(ar.settings.appearanceTitle);
    expect(html).toContain(ar.settings.modeSystem);
    expect(html).toContain(ar.settings.themeNames.nile);
  });
});

describe("SettingsSkeleton", () => {
  it("has a shimmer placeholder for the appearance section", () => {
    const html = renderToStaticMarkup(<SettingsSkeleton />);
    expect(html).toContain('role="status"');
    expect(html).toContain('data-skeleton="appearance"');
  });
});
