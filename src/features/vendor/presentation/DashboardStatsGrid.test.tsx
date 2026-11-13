import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  DashboardStats,
  DashboardStatsGrid,
} from "@/features/vendor/presentation/DashboardStatsGrid";
import { getStrings } from "@/shared/i18n/get-strings";

const en = getStrings("en");

function hrefs(vendorType?: string) {
  const html = renderToStaticMarkup(
    <DashboardStatsGrid
      strings={en}
      vendorType={vendorType}
      openOrders={3}
      netEarnings={1000}
      totalSales={2000}
    />,
  );
  return [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
}

describe("DashboardStatsGrid", () => {
  it("keeps today's three cards for store vendors", () => {
    expect(hrefs("store")).toEqual(["/earnings", "/orders", "/earnings"]);
    expect(hrefs(undefined)).toEqual(["/earnings", "/orders", "/earnings"]);
  });

  it("drops the open orders card for providers", () => {
    expect(hrefs("clinic")).toEqual(["/earnings", "/earnings"]);
    expect(hrefs("doctor")).toEqual(["/earnings", "/earnings"]);
  });

  it("shows a negative net balance with a sign instead of failing", () => {
    const html = renderToStaticMarkup(
      <DashboardStatsGrid strings={en} vendorType="store" openOrders={0} netEarnings={-2500} totalSales={0} />,
    );
    expect(html).toContain("-25.00 EGP");
  });
});

describe("DashboardStatsGrid in Arabic", () => {
  it("puts the hero first and formats money with the unit after isolated figures", () => {
    const html = renderToStaticMarkup(
      <DashboardStatsGrid
        strings={getStrings("ar")}
        vendorType="store"
        openOrders={1284}
        netEarnings={99999999999}
        totalSales={0}
        locale="ar"
      />,
    );
    expect(html.indexOf(getStrings("ar").dashboard.netEarnings)).toBeLessThan(
      html.indexOf(getStrings("ar").dashboard.openOrders),
    );
    expect(html).toContain("⁦999,999,999.99⁩ ج.م");
    expect(html).toContain("1,284");
  });
});

describe("DashboardStats", () => {
  const base = { strings: en, vendorType: "store", openOrders: 0, netEarnings: 0, totalSales: 0 };

  it("shows a one sentence error with retry instead of zero cards", () => {
    const html = renderToStaticMarkup(
      <DashboardStats
        {...base}
        error={{ kind: "error", title: en.dashboard.loadError }}
        onRetry={() => {}}
      />,
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain(en.common.retry);
    expect(html).not.toContain(en.dashboard.netEarnings);
  });

  it("shows the offline copy when the connection dropped", () => {
    const html = renderToStaticMarkup(
      <DashboardStats
        {...base}
        error={{
          kind: "offline",
          title: en.states.offlineTitle,
          description: en.states.offlineDescription,
        }}
        onRetry={() => {}}
      />,
    );
    expect(html).toContain('data-kind="offline"');
  });

  it("shows the cards when loaded", () => {
    const html = renderToStaticMarkup(<DashboardStats {...base} error={null} onRetry={() => {}} />);
    expect(html).toContain(en.dashboard.netEarnings);
  });
});
