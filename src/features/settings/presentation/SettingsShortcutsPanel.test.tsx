import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SettingsShortcutsPanel } from "@/features/settings/presentation/SettingsShortcutsPanel";
import { getStrings } from "@/shared/i18n/get-strings";

const strings = getStrings("en");

function hrefs(vendorType?: string) {
  const html = renderToStaticMarkup(
    <SettingsShortcutsPanel strings={strings} vendorType={vendorType} />,
  );
  return [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
}

describe("SettingsShortcutsPanel", () => {
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
