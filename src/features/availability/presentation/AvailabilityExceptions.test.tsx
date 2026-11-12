import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { AvailabilityConflict, AvailabilityException } from "@/features/availability/domain/types";
import { ConflictsDialog } from "@/features/availability/presentation/ConflictsDialog";
import { ExceptionEditor } from "@/features/availability/presentation/ExceptionEditor";
import { ExceptionsCalendar } from "@/features/availability/presentation/ExceptionsCalendar";
import { SlotPreview } from "@/features/availability/presentation/SlotPreview";
import { UpcomingExceptions } from "@/features/availability/presentation/UpcomingExceptions";
import { makeService } from "@/features/branches/presentation/test-fixtures";
import { getStrings } from "@/shared/i18n/get-strings";

const en = getStrings("en");
const ar = getStrings("ar");
const noop = () => {};
const TODAY = "2026-11-12";

const CLOSED: AvailabilityException = { branch: { closed: true }, home: null, note: "Eid" };

function conflict(patch: Partial<AvailabilityConflict> = {}): AvailabilityConflict {
  return {
    appointmentId: "a1",
    mode: "branch",
    date: "2026-11-14",
    startMs: 1,
    endMs: 2,
    startLocal: "09:00",
    endLocal: "09:30",
    serviceIds: ["s1"],
    status: "paid",
    reason: "outside_hours",
    ...patch,
  };
}

describe("ExceptionsCalendar", () => {
  function render(props: Partial<Parameters<typeof ExceptionsCalendar>[0]> = {}) {
    return renderToStaticMarkup(
      <ExceptionsCalendar
        month="2026-11"
        todayDate={TODAY}
        selectedDate={null}
        exceptions={{ "2026-11-20": CLOSED }}
        strings={en}
        locale="en"
        onMonthChange={noop}
        onSelect={noop}
        {...props}
      />,
    );
  }

  it("starts the week on Saturday with the month title", () => {
    const html = render();
    expect(html).toContain("November 2026");
    const heads = [...html.matchAll(/<span class="[^"]*weekdayHead[^"]*">(\w+)<\/span>/g)].map(
      (m) => m[1],
    );
    expect(heads).toEqual(["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"]);
  });

  it("disables past days and the previous month, marks exceptions", () => {
    const html = render();
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*data-date="2026-11-11"/);
    expect(html).not.toMatch(/<button[^>]*disabled=""[^>]*data-date="2026-11-12"/);
    expect(html).toMatch(new RegExp(`aria-label="${en.availability.exceptions.prevMonth}"[^>]*disabled=""`));
    expect(html).toContain(`aria-label="2026-11-20 ${en.availability.exceptions.marked}"`);
  });

  it("stops at one year ahead", () => {
    const html = render({ month: "2027-11" });
    expect(html).toMatch(new RegExp(`aria-label="${en.availability.exceptions.nextMonth}"[^>]*disabled=""`));
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*data-date="2027-11-13"/);
    expect(html).not.toMatch(/<button[^>]*disabled=""[^>]*data-date="2027-11-12"/);
  });

  it("renders Arabic headers with Western digits", () => {
    const html = render({ strings: ar, locale: "ar" });
    expect(html).toContain(ar.availability.daysShort.sat);
    expect(html).toContain("2026");
    expect(html).not.toMatch(/[٠-٩]/);
  });
});

describe("ExceptionEditor", () => {
  function render(props: Partial<Parameters<typeof ExceptionEditor>[0]> = {}) {
    return renderToStaticMarkup(
      <ExceptionEditor
        date="2026-11-20"
        todayDate={TODAY}
        exception={CLOSED}
        homeVisitEnabled={false}
        atLimit={false}
        strings={en}
        locale="en"
        readOnly={false}
        isSaving={false}
        onSave={noop}
        onRemove={noop}
        {...props}
      />,
    );
  }

  it("shows the existing rule, note and remove", () => {
    const html = render();
    expect(html).toMatch(/checked="" value="closed"/);
    expect(html).toContain(">Eid</textarea>");
    expect(html).toContain(en.availability.exceptions.remove);
    expect(html).not.toContain(en.availability.exceptions.homeMode);
  });

  it("offers home visit rules when home visits are on", () => {
    const html = render({ exception: null, homeVisitEnabled: true });
    expect(html).toContain(en.availability.exceptions.homeMode);
    expect(html).not.toContain(en.availability.exceptions.remove);
  });

  it("blocks a new day at the 60 limit", () => {
    const html = render({ exception: null, atLimit: true });
    expect(html).toContain(en.availability.exceptions.limitReached);
    expect(html).toMatch(new RegExp(`<button[^>]*disabled=""[^>]*>${en.availability.exceptions.add}<`));
  });

  it("special hours list their intervals", () => {
    const html = render({
      exception: {
        branch: { closed: false, intervals: [{ start: "10:00", end: "14:00" }] },
        home: null,
        note: null,
      },
      readOnly: true,
    });
    expect(html).toContain("10:00 AM - 2:00 PM");
    expect(html).not.toContain(en.availability.exceptions.add);
  });
});

describe("UpcomingExceptions", () => {
  it("lists upcoming days in order and hides past ones", () => {
    const html = renderToStaticMarkup(
      <UpcomingExceptions
        exceptions={{
          "2026-11-25": CLOSED,
          "2026-11-20": {
            branch: null,
            home: { closed: false, intervals: [{ start: "10:00", end: "12:00" }] },
            note: null,
          },
          "2026-11-01": CLOSED,
        }}
        todayDate={TODAY}
        strings={en}
        locale="en"
        onSelect={noop}
      />,
    );
    expect(html.indexOf("20 Nov")).toBeLessThan(html.indexOf("25 Nov"));
    expect(html).not.toContain("1 Nov");
    expect(html).toContain("Home visits: 10:00 AM - 12:00 PM");
  });
});

describe("ConflictsDialog", () => {
  function render(props: Partial<Parameters<typeof ConflictsDialog>[0]> = {}) {
    return renderToStaticMarkup(
      <ConflictsDialog
        conflicts={[conflict(), conflict({ appointmentId: "a2", reason: "over_capacity", mode: "home" })]}
        services={[makeService()]}
        strings={en}
        locale="en"
        isSubmitting={false}
        onSubmit={noop}
        onClose={noop}
        {...props}
      />,
    );
  }

  it("lists each conflict with reason, time, service and a keep checkbox", () => {
    const html = render();
    expect(html).toContain(en.availability.conflicts.title);
    expect(html).toContain(en.availability.conflicts.reason.outside_hours);
    expect(html).toContain(en.availability.conflicts.reason.over_capacity);
    expect(html).toContain("9:00 AM to 9:30 AM");
    expect(html).toContain("Checkup");
    expect(html.split(en.availability.conflicts.keep).length - 1).toBe(2);
  });

  it("keeps save disabled until every conflict is kept", () => {
    expect(render()).toMatch(
      new RegExp(`<button[^>]*disabled=""[^>]*>${en.availability.conflicts.submit}<`),
    );
    expect(render({ initialKept: ["a1", "a2"] })).not.toMatch(
      new RegExp(`<button[^>]*disabled=""[^>]*>${en.availability.conflicts.submit}<`),
    );
  });

  it("renders Arabic copy", () => {
    const html = render({ strings: ar, locale: "ar" });
    expect(html).toContain(ar.availability.conflicts.title);
    expect(html).toContain("9:00 ص");
  });
});

describe("SlotPreview", () => {
  function render(props: Partial<Parameters<typeof SlotPreview>[0]> = {}) {
    return renderToStaticMarkup(
      <SlotPreview
        services={[makeService()]}
        serviceId="s1"
        mode="branch"
        homeVisitEnabled={false}
        preview={{
          durationMinutes: 30,
          days: [
            {
              date: "2026-11-14",
              closed: false,
              slots: [
                { startMs: 1, endMs: 2, startLocal: "09:00", endLocal: "09:30", remaining: 2 },
                { startMs: 3, endMs: 4, startLocal: "09:30", endLocal: "10:00", remaining: 0 },
              ],
            },
            { date: "2026-11-15", closed: true, slots: [] },
            { date: "2026-11-16", closed: false, slots: [] },
          ],
        }}
        isLoading={false}
        error={null}
        hasUnsavedChanges={false}
        strings={en}
        locale="en"
        onServiceChange={noop}
        onModeChange={noop}
        {...props}
      />,
    );
  }

  it("shows remaining, full, closed and empty days", () => {
    const html = render();
    expect(html).toContain("9:00 AM");
    expect(html).toContain("2 left");
    expect(html).toContain(en.availability.preview.full);
    expect(html).toContain(en.availability.preview.closed);
    expect(html).toContain(en.availability.preview.noSlots);
  });

  it("shows a skeleton while loading and an error when it fails", () => {
    expect(render({ isLoading: true })).toContain('aria-busy="true"');
    expect(render({ error: "Oops" })).toContain("Oops");
  });

  it("asks for a service first and notes unsaved changes", () => {
    expect(render({ services: [] })).toContain(en.availability.preview.noServices);
    expect(render({ hasUnsavedChanges: true })).toContain(en.availability.preview.saveFirst);
  });

  it("renders Arabic copy", () => {
    const html = render({ strings: ar, locale: "ar" });
    expect(html).toContain(ar.availability.preview.remaining.replace("{count}", "2"));
    expect(html).toContain("9:00 ص");
  });
});
