import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { Routes } from "@/constants/routes";
import type { ProviderDashboard } from "@/features/provider-dashboard/domain/types";
import { getStrings } from "@/shared/i18n/get-strings";

vi.mock("@/shared/preferences/PreferencesContext", async () => {
  const { getStrings: load } = await import("@/shared/i18n/get-strings");
  return { useStrings: () => load("en"), usePreferences: () => ({ locale: "en", dir: "ltr" }) };
});
vi.mock("@/features/provider-dashboard/application/provider-dashboard.api", () => ({
  getProviderDashboard: vi.fn(() => new Promise(() => {})),
}));

import { ProviderDashboardSection } from "@/features/provider-dashboard/presentation/ProviderDashboardSection";
import { ProviderDashboardView } from "@/features/provider-dashboard/presentation/ProviderDashboardView";
import { RatingCard } from "@/features/provider-dashboard/presentation/RatingCard";
import { ServiceShareChart } from "@/features/provider-dashboard/presentation/ServiceShareChart";

const en = getStrings("en");
const ar = getStrings("ar");
const noop = () => {};

const DATA: ProviderDashboard = {
  categorySet: "groomer",
  range: { preset: 30, fromDate: "2026-10-14", toDate: "2026-11-12" },
  visits: 27,
  newPatients: 8,
  services: [
    { serviceId: "s1", branchId: "b1", nameEn: "Bath", nameAr: "استحمام", count: 18, sharePercent: 67 },
    { serviceId: "other", branchId: "", nameEn: null, nameAr: null, count: 9, sharePercent: 33 },
  ],
  rating: {
    count: 5,
    overallTenths: 46,
    categories: [
      { id: "grooming_quality", averageTenths: 48 },
      { id: "pet_handling", averageTenths: 45 },
      { id: "punctuality", averageTenths: 44 },
    ],
    tagCounts: { great_result: 4, gentle_handling: 2, long_waiting_time: 1, clean_and_tidy: 1 },
  },
};

function renderView(locale: "en" | "ar" = "en", data = DATA) {
  return renderToStaticMarkup(
    <ProviderDashboardView
      data={data}
      preset={30}
      strings={getStrings(locale)}
      locale={locale}
      onPresetChange={noop}
    />,
  );
}

describe("ProviderDashboardSection", () => {
  it("starts with the shimmer skeleton", () => {
    const html = renderToStaticMarkup(<ProviderDashboardSection />);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain(`aria-label="${en.common.loading}"`);
  });
});

describe("ProviderDashboardView", () => {
  it("shows presets with 30 days pressed, visits, new patients and the hint", () => {
    const html = renderView();
    for (const label of Object.values(en.dashboard.provider.presets)) expect(html).toContain(label);
    expect(html).toMatch(new RegExp(`aria-pressed="true"[^>]*>${en.dashboard.provider.presets.d30}<`));
    expect(html).toContain(en.dashboard.provider.visits);
    expect(html).toContain(">27<");
    expect(html).toContain(en.dashboard.provider.newPatients);
    expect(html).toContain(">8<");
    expect(html).toContain(en.dashboard.provider.newPatientsHint);
  });

  it("renders Arabic copy with Western digits", () => {
    const html = renderView("ar");
    expect(html).toContain(ar.dashboard.provider.visits);
    expect(html).toContain("استحمام");
    expect(html).toContain("67%");
    expect(html).not.toMatch(/[٠-٩]/);
  });
});

describe("ServiceShareChart", () => {
  it("lists every service with its name, percent and a bar sized by logical inline size", () => {
    const html = renderToStaticMarkup(<ServiceShareChart services={DATA.services} strings={en} locale="en" />);
    expect(html).toContain("<ol");
    expect(html).toContain("Bath");
    expect(html).toContain(en.dashboard.provider.other);
    expect(html).toContain("67%");
    expect(html).toContain("inline-size:67%");
    expect(html).toContain("33%");
    expect(html).toContain(en.dashboard.provider.serviceVisits.replace("{count}", "18"));
    expect(html).not.toContain("width:");
  });

  it("uses Arabic names in Arabic and shows the empty state", () => {
    expect(renderToStaticMarkup(<ServiceShareChart services={DATA.services} strings={ar} locale="ar" />)).toContain(
      "استحمام",
    );
    expect(renderToStaticMarkup(<ServiceShareChart services={[]} strings={en} locale="en" />)).toContain(
      en.dashboard.provider.servicesEmpty,
    );
  });
});

describe("RatingCard", () => {
  it("shows the overall rating, per category bars, top tags and the reviews link", () => {
    const html = renderToStaticMarkup(<RatingCard rating={DATA.rating} strings={en} />);
    expect(html).toContain(en.reviews.stars.replace("{rating}", "4.6"));
    expect(html).toContain(en.reviews.count.replace("{count}", "5"));
    expect(html).toContain(en.reviews.categories.grooming_quality);
    expect(html).toContain("4.8");
    expect(html).toContain("inline-size:96%");
    expect(html).toContain(`${en.reviews.tags.great_result} (4)`);
    expect(html).toContain(`${en.reviews.tags.gentle_handling} (2)`);
    expect(html).not.toContain(en.reviews.tags.long_waiting_time);
    expect(html).toContain(`href="${Routes.vendor.reviews}"`);
    expect(html).toContain(en.dashboard.provider.viewReviews);
  });

  it("shows the empty state with the reviews link when there are no reviews", () => {
    const html = renderToStaticMarkup(
      <RatingCard rating={{ count: 0, overallTenths: null, categories: [], tagCounts: {} }} strings={ar} />,
    );
    expect(html).toContain(ar.dashboard.provider.ratingEmpty);
    expect(html).toContain(`href="${Routes.vendor.reviews}"`);
  });
});
