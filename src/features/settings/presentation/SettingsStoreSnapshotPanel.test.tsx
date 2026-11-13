import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SettingsStoreSnapshotPanel } from "@/features/settings/presentation/SettingsStoreSnapshotPanel";
import { getStrings } from "@/shared/i18n/get-strings";

const en = getStrings("en");

function render(vendorType: string | undefined, isActiveVendor = true) {
  return renderToStaticMarkup(
    <SettingsStoreSnapshotPanel
      strings={en}
      productCount={4}
      openOrders={2}
      netEarningsPiastres={1500}
      isActiveVendor={isActiveVendor}
      vendorType={vendorType}
    />,
  );
}

function hrefs(html: string) {
  return [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
}

describe("SettingsStoreSnapshotPanel", () => {
  it("keeps today's store cards", () => {
    expect(hrefs(render("store"))).toEqual(["/products", "/orders", "/earnings"]);
    expect(hrefs(render(undefined))).toEqual(["/products", "/orders", "/earnings"]);
    const inactive = render("store", false);
    expect(hrefs(inactive)).toEqual(["/products"]);
    expect(inactive).toContain(en.settings.snapshotOpenOrders);
  });

  it("shows only earnings for a clinic", () => {
    const html = render("clinic");
    expect(hrefs(html)).toEqual(["/earnings"]);
    expect(html).not.toContain(en.settings.snapshotProducts);
    expect(html).not.toContain(en.settings.snapshotOpenOrders);
  });

  it("shows negative net earnings with a sign instead of failing", () => {
    const html = renderToStaticMarkup(
      <SettingsStoreSnapshotPanel
        strings={en}
        productCount={0}
        openOrders={0}
        netEarningsPiastres={-199}
        isActiveVendor
        vendorType="store"
      />,
    );
    expect(html).toContain("-1.99 EGP");
  });
});
