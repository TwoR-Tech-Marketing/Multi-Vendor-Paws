import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Routes } from "@/constants/routes";
import { getStrings } from "@/shared/i18n/get-strings";

import { SettingsShortcutsPanel } from "./SettingsShortcutsPanel";

const en = getStrings("en");

function hrefs(vendorType?: string) {
  const html = renderToStaticMarkup(
    <SettingsShortcutsPanel strings={en} isActiveVendor vendorType={vendorType} />,
  );
  return [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
}

describe("SettingsShortcutsPanel", () => {
  it("shows quick links for active vendors", () => {
    const html = renderToStaticMarkup(<SettingsShortcutsPanel strings={en} isActiveVendor />);
    expect(html).toContain(en.settings.shortcutsTitle);
    expect(html).toContain(`href="${Routes.vendor.orders}"`);
  });

  it("renders nothing for pending, rejected or suspended vendors", () => {
    const html = renderToStaticMarkup(
      <SettingsShortcutsPanel strings={en} isActiveVendor={false} vendorType="clinic" />,
    );
    expect(html).toBe("");
  });

  it("keeps every shortcut for store vendors", () => {
    const expected = ["/settings/coverage", "/products", "/orders", "/earnings", "/profile"];
    expect(hrefs("store")).toEqual(expected);
    expect(hrefs(undefined)).toEqual(expected);
  });

  it("hides store shortcuts for providers", () => {
    expect(hrefs("clinic")).toEqual(["/earnings", "/profile"]);
    expect(hrefs("doctor")).toEqual(["/earnings", "/profile"]);
  });
});
