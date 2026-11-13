import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { emptyWeekly, type WeeklyHours } from "@/features/availability/domain/types";
import { getStrings } from "@/shared/i18n/get-strings";

const state = vi.hoisted(() => ({ locale: "en" as "en" | "ar", sessionKind: "active" }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("@/shared/preferences/PreferencesContext", async () => {
  const { getStrings: load } = await import("@/shared/i18n/get-strings");
  return {
    useStrings: () => load(state.locale),
    usePreferences: () => ({ locale: state.locale, dir: state.locale === "ar" ? "rtl" : "ltr" }),
  };
});
vi.mock("@/features/vendor/presentation/PortalSessionContext", () => ({
  usePortalSession: () => ({
    sessionKind: state.sessionKind,
    profile: { vendorType: "clinic" },
    user: { uid: "uid1" },
  }),
}));
vi.mock("@/features/availability/application/availability.api", () => ({
  getBranchAvailability: vi.fn(),
  listBranchSlots: vi.fn(),
  mapConflicts: vi.fn(),
  saveBranchAvailability: vi.fn(),
  setBranchAvailabilityException: vi.fn(),
}));
vi.mock("@/features/branches/application/branches.api", () => ({ getBranch: vi.fn() }));

import { AvailabilitySection } from "@/features/availability/presentation/AvailabilitySection";
import { AvailabilitySkeleton } from "@/features/availability/presentation/AvailabilitySkeleton";
import { AvailabilityTabs } from "@/features/availability/presentation/AvailabilityTabs";
import { CapacityStepper } from "@/features/availability/presentation/CapacityStepper";
import { CopyDayDialog } from "@/features/availability/presentation/CopyDayDialog";
import { HomeVisitSummary } from "@/features/availability/presentation/HomeVisitSummary";
import { nextInterval } from "@/features/availability/presentation/IntervalList";
import { WeeklyEditor } from "@/features/availability/presentation/WeeklyEditor";

const en = getStrings("en");
const ar = getStrings("ar");
const noop = () => {};

function renderWeekly(weekly: WeeklyHours, extra: Partial<Parameters<typeof WeeklyEditor>[0]> = {}) {
  return renderToStaticMarkup(
    <WeeklyEditor weekly={weekly} errors={{}} strings={en} readOnly={false} onChange={noop} {...extra} />,
  );
}

beforeEach(() => {
  state.locale = "en";
  state.sessionKind = "active";
});

describe("AvailabilitySection", () => {
  it("starts with the shimmer skeleton, not a spinner", () => {
    const html = renderToStaticMarkup(<AvailabilitySection branchId="b1" />);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain(`aria-label="${en.common.loading}"`);
  });
});

describe("AvailabilitySkeleton", () => {
  it("renders one shimmer per shape with an Arabic label", () => {
    state.locale = "ar";
    const html = renderToStaticMarkup(<AvailabilitySkeleton />);
    expect(html).toContain(`aria-label="${ar.common.loading}"`);
    expect(html.match(/shimmer/g)?.length ?? 0).toBeGreaterThan(20);
  });
});

describe("WeeklyEditor", () => {
  it("lists days Saturday first and shows closed days", () => {
    const html = renderWeekly(emptyWeekly());
    const order = [...html.matchAll(/data-day="(\w+)"/g)].map((m) => m[1]);
    expect(order).toEqual(["sat", "sun", "mon", "tue", "wed", "thu", "fri"]);
    expect(html.split(en.availability.closed).length - 1).toBe(7);
    expect(html).toContain(en.availability.addInterval);
    expect(html).toContain(en.availability.copyDay);
  });

  it("shows 12 hour times and disables add at 4 intervals", () => {
    const weekly = {
      ...emptyWeekly(),
      sat: [
        { start: "08:00", end: "09:00" },
        { start: "10:00", end: "11:00" },
        { start: "12:00", end: "13:00" },
        { start: "14:00", end: "15:00" },
      ],
    };
    const html = renderWeekly(weekly);
    expect(html).toContain("8:00 AM");
    expect(html).toContain("3:00 PM");
    const satRow = html.slice(html.indexOf('data-day="sat"'), html.indexOf('data-day="sun"'));
    expect(satRow).toMatch(new RegExp(`<button[^>]*disabled=""[^>]*>${en.availability.addInterval}</button>`));
  });

  it("shows validation errors per day", () => {
    const html = renderWeekly(emptyWeekly(), { errors: { mon: "overlap" } });
    expect(html).toContain(en.errors.availability.overlap.replace("'", "&#x27;"));
  });

  it("is read only without edit controls", () => {
    const weekly = { ...emptyWeekly(), sun: [{ start: "09:00", end: "17:00" }] };
    const html = renderWeekly(weekly, { readOnly: true });
    expect(html).toContain("9:00 AM - 5:00 PM");
    expect(html).not.toContain(en.availability.addInterval);
    expect(html).not.toContain(en.availability.copyDay);
    expect(html).not.toContain(en.availability.removeInterval);
  });

  it("renders Arabic day names and AM/PM markers", () => {
    const weekly = { ...emptyWeekly(), sat: [{ start: "09:00", end: "17:00" }] };
    const html = renderWeekly(weekly, { strings: ar, readOnly: true });
    expect(html).toContain(ar.availability.days.sat);
    expect(html).toContain("9:00 ص - 5:00 م");
  });

  it("suggests the next interval", () => {
    expect(nextInterval([])).toEqual({ start: "09:00", end: "17:00" });
    expect(nextInterval([{ start: "09:00", end: "17:00" }])).toEqual({ start: "17:00", end: "18:00" });
    expect(nextInterval([{ start: "23:30", end: "24:00" }])).toBeNull();
  });
});

describe("CopyDayDialog", () => {
  it("offers the other days, Saturday first, with apply disabled until one is picked", () => {
    const html = renderToStaticMarkup(
      <CopyDayDialog from="mon" strings={en} onApply={noop} onClose={noop} />,
    );
    expect(html).toContain("Copy Monday hours to");
    const days = [...html.matchAll(/type="checkbox" value="(\w+)"/g)].map((m) => m[1]);
    expect(days).toEqual(["sat", "sun", "tue", "wed", "thu", "fri"]);
    expect(html).toMatch(new RegExp(`<button[^>]*disabled=""[^>]*>${en.availability.copyDayApply}<`));
  });

  it("renders Arabic copy", () => {
    const html = renderToStaticMarkup(
      <CopyDayDialog from="sat" strings={ar} onApply={noop} onClose={noop} />,
    );
    expect(html).toContain(ar.availability.copyDayTitle.replace("{day}", ar.availability.days.sat));
    expect(html).toContain(ar.availability.copyDayApply);
  });
});

describe("CapacityStepper", () => {
  it("disables decrease at 1 and increase at 10", () => {
    const low = renderToStaticMarkup(
      <CapacityStepper label="x" value={1} strings={en} readOnly={false} onChange={noop} />,
    );
    expect(low).toMatch(new RegExp(`<button[^>]*aria-label="${en.availability.decrease}"[^>]*disabled=""`));
    const high = renderToStaticMarkup(
      <CapacityStepper label="x" value={10} strings={en} readOnly={false} onChange={noop} />,
    );
    expect(high).toMatch(new RegExp(`<button[^>]*aria-label="${en.availability.increase}"[^>]*disabled=""`));
  });

  it("hides the buttons when read only", () => {
    const html = renderToStaticMarkup(
      <CapacityStepper label="x" value={3} strings={en} readOnly onChange={noop} />,
    );
    expect(html).not.toContain(en.availability.increase);
    expect(html).toContain(">3<");
  });
});

describe("HomeVisitSummary", () => {
  it("shows fee and radius from the branch with an edit link", () => {
    const html = renderToStaticMarkup(
      <HomeVisitSummary
        branchId="b1"
        homeVisit={{ enabled: true, feePiastres: 15000, radiusMeters: 3500 }}
        strings={en}
        locale="en"
      />,
    );
    expect(html).toContain("Home visit fee: 150.00 EGP");
    expect(html).toContain('data-tone="success"');
    expect(html).toContain("Coverage radius: 3.5 km");
    expect(html).toContain('href="/branches/b1"');
  });

  it("explains when home visits are off", () => {
    const html = renderToStaticMarkup(
      <HomeVisitSummary
        branchId="b1"
        homeVisit={{ enabled: false, feePiastres: 0, radiusMeters: 0 }}
        strings={ar}
        locale="ar"
      />,
    );
    expect(html).toContain(ar.availability.homeVisitOff);
  });

  it("shows the fee as amount then unit with isolated figures in Arabic", () => {
    const html = renderToStaticMarkup(
      <HomeVisitSummary
        branchId="b1"
        homeVisit={{ enabled: true, feePiastres: 15000, radiusMeters: 3500 }}
        strings={ar}
        locale="ar"
      />,
    );
    expect(html).toContain("\u2066150.00\u2069 ج.م");
  });
});

describe("AvailabilityTabs", () => {
  it("renders the four tabs with the selected one marked", () => {
    const html = renderToStaticMarkup(
      <AvailabilityTabs value="exceptions" strings={en} onChange={noop} />,
    );
    expect(html).toContain(en.availability.tabs.weekly);
    expect(html).toContain(en.availability.tabs.homeVisit);
    expect(html).toContain(en.availability.tabs.preview);
    expect(html).toMatch(
      new RegExp(`aria-selected="true"[^>]*>${en.availability.tabs.exceptions}<`),
    );
  });
});
