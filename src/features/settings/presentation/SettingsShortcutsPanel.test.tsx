import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Routes } from "@/constants/routes";
import { getStrings } from "@/shared/i18n/get-strings";

import { SettingsShortcutsPanel } from "./SettingsShortcutsPanel";

const en = getStrings("en");

describe("SettingsShortcutsPanel", () => {
  it("shows quick links for active vendors", () => {
    const html = renderToStaticMarkup(<SettingsShortcutsPanel strings={en} isActiveVendor />);
    expect(html).toContain(en.settings.shortcutsTitle);
    expect(html).toContain(`href="${Routes.vendor.orders}"`);
  });

  it("renders nothing for pending, rejected or suspended vendors", () => {
    const html = renderToStaticMarkup(
      <SettingsShortcutsPanel strings={en} isActiveVendor={false} />,
    );
    expect(html).toBe("");
  });
});
