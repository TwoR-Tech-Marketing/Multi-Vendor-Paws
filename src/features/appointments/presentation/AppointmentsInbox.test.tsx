import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { Routes } from "@/constants/routes";
import { DEFAULT_APPOINTMENT_FILTERS } from "@/features/appointments/domain/filters";
import { APPOINTMENT_STATUSES } from "@/features/appointments/domain/types";
import { formatEgp } from "@/features/products/domain/currency";
import { makeRow } from "@/features/appointments/presentation/test-fixtures";
import { getStrings } from "@/shared/i18n/get-strings";

vi.mock("@/shared/preferences/PreferencesContext", async () => {
  const { getStrings: load } = await import("@/shared/i18n/get-strings");
  return { useStrings: () => load("en"), usePreferences: () => ({ locale: "en", dir: "ltr" }) };
});
vi.mock("@/features/appointments/application/appointments.api", () => ({
  listVendorAppointments: vi.fn(() => new Promise(() => {})),
}));
vi.mock("@/features/branches/application/branches.api", () => ({
  listBranches: vi.fn(() => new Promise(() => {})),
}));

import { AppointmentsFilters } from "@/features/appointments/presentation/AppointmentsFilters";
import { AppointmentsInboxSection } from "@/features/appointments/presentation/AppointmentsInboxSection";
import { AppointmentsList } from "@/features/appointments/presentation/AppointmentsList";

const en = getStrings("en");
const ar = getStrings("ar");
const noop = () => {};

function renderFilters(props: Partial<Parameters<typeof AppointmentsFilters>[0]> = {}) {
  return renderToStaticMarkup(
    <AppointmentsFilters
      filters={DEFAULT_APPOINTMENT_FILTERS}
      branches={[{ branchId: "b1", name: "Zamalek" }]}
      strings={en}
      onChange={noop}
      onPresetChange={noop}
      {...props}
    />,
  );
}

function renderList(props: Partial<Parameters<typeof AppointmentsList>[0]> = {}) {
  return renderToStaticMarkup(
    <AppointmentsList
      items={[makeRow()]}
      strings={en}
      locale="en"
      hasMore={false}
      isLoadingMore={false}
      onLoadMore={noop}
      {...props}
    />,
  );
}

describe("AppointmentsInboxSection", () => {
  it("starts with the shimmer skeleton, not a spinner", () => {
    const html = renderToStaticMarkup(<AppointmentsInboxSection />);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain(`aria-label="${en.common.loading}"`);
  });
});

describe("AppointmentsFilters", () => {
  it("shows every status chip with the selected one pressed", () => {
    const html = renderFilters();
    for (const label of Object.values(en.appointments.filters.groups)) expect(html).toContain(label);
    expect(html).toMatch(new RegExp(`aria-pressed="true"[^>]*>${en.appointments.filters.groups.upcoming}<`));
    expect(html).toContain(en.appointments.filters.allBranches);
    expect(html).toContain(en.appointments.filters.presets.any);
  });

  it("shows the date inputs and a range error for an invalid custom range", () => {
    const html = renderFilters({
      filters: { ...DEFAULT_APPOINTMENT_FILTERS, datePreset: "custom", dateFrom: "2026-11-10", dateTo: "2026-11-01" },
    });
    expect(html).toContain('type="date"');
    expect(html).toContain(en.appointments.filters.rangeOrder);
  });

  it("renders Arabic labels", () => {
    const html = renderFilters({ strings: ar });
    expect(html).toContain(ar.appointments.filters.groups.upcoming);
    expect(html).toContain(ar.appointments.filters.allBranches);
  });
});

describe("AppointmentsList", () => {
  it("renders a row with time, customer, services, total, badge and detail link", () => {
    const html = renderList();
    expect(html).toContain(`href="${Routes.vendor.appointmentDetail("appt1")}"`);
    expect(html).toContain("9:30 AM");
    expect(html).toContain("Mona");
    expect(html).toContain("Checkup");
    expect(html).toContain(formatEgp(25_000));
    expect(html).toContain(en.appointments.status.paid);
    expect(html).not.toContain(en.appointments.held);
  });

  it("shows the held badge and the no-show state as text", () => {
    const html = renderList({
      items: [makeRow({ status: "no_show", held: true, noShowState: "awaiting_buyer" })],
    });
    expect(html).toContain(en.appointments.held);
    expect(html).toContain(en.appointments.status.no_show);
    expect(html).toContain(en.appointments.noShow.state.awaiting_buyer.replace("'", "&#x27;"));
  });

  it("shows Arabic service names and the empty state", () => {
    expect(renderList({ strings: ar, locale: "ar" })).toContain("كشف");
    expect(renderList({ items: [] })).toContain(en.appointments.empty);
    expect(renderList({ hasMore: true })).toContain(en.appointments.loadMore);
  });
});

describe("AppointmentsList statuses", () => {
  it.each([
    ["en", en],
    ["ar", ar],
  ] as const)("renders one row per status with its %s label", (locale, strings) => {
    expect(APPOINTMENT_STATUSES).toHaveLength(8);
    const items = APPOINTMENT_STATUSES.map((status) =>
      makeRow({ appointmentId: `appt_${status}`, appointmentNumber: `#${status}`, status }),
    );
    const html = renderList({ items, strings, locale });
    expect(html.match(/<li>/g)).toHaveLength(8);
    for (const status of APPOINTMENT_STATUSES) {
      const label = strings.appointments.status[status];
      expect(label).toBeTruthy();
      expect(html).toContain(`>${label}</span>`);
      expect(html).toContain(`href="${Routes.vendor.appointmentDetail(`appt_${status}`)}"`);
    }
  });
});
