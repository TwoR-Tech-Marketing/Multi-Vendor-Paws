import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { formatEgp } from "@/features/products/domain/currency";
import type { AppointmentNoShow, ExtraInvoice } from "@/features/appointments/domain/types";
import { emptyInvoiceLine } from "@/features/appointments/domain/extra-invoices";
import { makeAppointment } from "@/features/appointments/presentation/test-fixtures";
import { getStrings } from "@/shared/i18n/get-strings";

vi.mock("@/features/appointments/application/invoice-services", () => ({
  listInvoiceServices: vi.fn(() => new Promise(() => {})),
}));

import { AppointmentActionBar } from "@/features/appointments/presentation/AppointmentActionBar";
import { ExtraInvoiceDialog } from "@/features/appointments/presentation/ExtraInvoiceDialog";
import { ExtraInvoicesCard } from "@/features/appointments/presentation/ExtraInvoicesCard";
import { InvoiceLineFields } from "@/features/appointments/presentation/InvoiceLineFields";
import { NoShowPanel } from "@/features/appointments/presentation/NoShowPanel";
import { formatInstant } from "@/features/appointments/presentation/appointments-copy";
import { confirmCopy } from "@/features/appointments/presentation/detail-dialogs";

const en = getStrings("en");
const ar = getStrings("ar");
const noop = () => {};
/** Static markup escapes apostrophes. */
const html$ = (text: string) => text.replace(/'/g, "&#x27;");

function noShow(overrides: Partial<AppointmentNoShow> = {}): AppointmentNoShow {
  return {
    state: "awaiting_buyer",
    flaggedAtMs: 10_000_000,
    answerDueAtMs: 20_000_000,
    answer: null,
    answeredAtMs: null,
    buyerNote: null,
    confirmedBy: null,
    ...overrides,
  };
}

function flagged(state: AppointmentNoShow["state"], extra: Partial<AppointmentNoShow> = {}) {
  return makeAppointment({ status: "no_show", noShowState: state, noShow: noShow({ state, ...extra }) });
}

describe("NoShowPanel", () => {
  it("renders nothing for a booked appointment the server already lets flag", () => {
    const html = renderToStaticMarkup(
      <NoShowPanel appointment={makeAppointment()} allowedActions={["flagNoShow"]} strings={en} locale="en" />,
    );
    expect(html).toBe("");
  });

  it("explains when the flag opens: start plus 120 minutes, in both languages", () => {
    const appointment = makeAppointment({ startMs: Date.UTC(2026, 10, 14, 7, 30) });
    const opensAt = Date.UTC(2026, 10, 14, 9, 30);
    const html = renderToStaticMarkup(
      <NoShowPanel appointment={appointment} allowedActions={["complete"]} strings={en} locale="en" />,
    );
    expect(html).toContain(en.appointments.noShow.tooEarly.replace("{time}", formatInstant(opensAt, "en")));
    expect(html).toContain("11:30");
    const htmlAr = renderToStaticMarkup(
      <NoShowPanel appointment={appointment} allowedActions={["cancel"]} strings={ar} locale="ar" />,
    );
    expect(htmlAr).toContain(ar.appointments.noShow.tooEarly.replace("{time}", formatInstant(opensAt, "ar")));
    const held = renderToStaticMarkup(
      <NoShowPanel appointment={{ ...appointment, held: true }} allowedActions={[]} strings={en} locale="en" />,
    );
    expect(held).toBe("");
  });

  it.each(["awaiting_buyer", "confirmed", "late_returned", "disputed", "overturned"] as const)(
    "shows the %s state in English and Arabic",
    (state) => {
      const appointment = flagged(state);
      const html = renderToStaticMarkup(
        <NoShowPanel appointment={appointment} allowedActions={[]} strings={en} locale="en" />,
      );
      expect(html).toContain(html$(en.appointments.noShow.state[state]));
      expect(html).toContain(en.appointments.noShow.customerSaw);
      expect(html).not.toContain("<button");
      const htmlAr = renderToStaticMarkup(
        <NoShowPanel appointment={appointment} allowedActions={[]} strings={ar} locale="ar" />,
      );
      expect(htmlAr).toContain(ar.appointments.noShow.state[state]);
    },
  );

  it("shows the answer deadline only while waiting, and hints for late and disputed", () => {
    const waiting = renderToStaticMarkup(
      <NoShowPanel appointment={flagged("awaiting_buyer")} allowedActions={[]} strings={en} locale="en" />,
    );
    expect(waiting).toContain(
      en.appointments.noShow.answerDueAt.replace("{time}", formatInstant(20_000_000, "en")),
    );
    expect(waiting).toContain(en.appointments.noShow.noAnswerYet);
    const late = renderToStaticMarkup(
      <NoShowPanel
        appointment={flagged("late_returned", { answer: "arrived_late", answeredAtMs: 15_000_000 })}
        allowedActions={["markCompleted", "confirmNoShow"]}
        strings={en}
        locale="en"
      />,
    );
    expect(late).toContain(en.appointments.noShow.lateHint);
    expect(late).toContain(en.appointments.noShow.answer.arrived_late);
    expect(late).not.toContain(en.appointments.noShow.answerDueAt.split("{time}")[0]);
    const disputed = renderToStaticMarkup(
      <NoShowPanel
        appointment={flagged("disputed", { answer: "attended", buyerNote: "I was there at 9" })}
        allowedActions={[]}
        strings={ar}
        locale="ar"
      />,
    );
    expect(disputed).toContain(ar.appointments.noShow.disputedHint);
    expect(disputed).toContain(ar.appointments.noShow.answer.attended);
    expect(disputed).toContain("I was there at 9");
    const confirmed = renderToStaticMarkup(
      <NoShowPanel
        appointment={flagged("confirmed", { answer: null, confirmedBy: "timeout" })}
        allowedActions={[]}
        strings={en}
        locale="en"
      />,
    );
    expect(confirmed).toContain(en.appointments.noShow.confirmedBy.timeout);
  });

  it("shows the clinic question for clinics, exact in English and Arabic", () => {
    const appointment = flagged("awaiting_buyer");
    const html = renderToStaticMarkup(
      <NoShowPanel appointment={appointment} allowedActions={[]} strings={en} locale="en" />,
    );
    expect(html).toContain("Appointment marked as no-show");
    expect(html).toContain("The clinic marked this appointment as a no-show. Is this correct?");
    expect(html).not.toContain("groomer");
    const htmlAr = renderToStaticMarkup(
      <NoShowPanel appointment={appointment} allowedActions={[]} strings={ar} locale="ar" />,
    );
    expect(htmlAr).toContain("تم تسجيل الموعد كعدم حضور");
    expect(htmlAr).toContain("قامت العيادة بتسجيل هذا الموعد كعدم حضور. هل هذا صحيح؟");
  });

  it("shows the groomer question for groomers, exact in English and Arabic", () => {
    const appointment = { ...flagged("awaiting_buyer"), vendorType: "groomer" };
    const html = renderToStaticMarkup(
      <NoShowPanel appointment={appointment} allowedActions={[]} strings={en} locale="en" />,
    );
    expect(html).toContain("The groomer marked this appointment as a no-show. Is this correct?");
    expect(html).not.toContain("The clinic marked");
    const htmlAr = renderToStaticMarkup(
      <NoShowPanel appointment={appointment} allowedActions={[]} strings={ar} locale="ar" />,
    );
    expect(htmlAr).toContain("قام الجرومر بتسجيل هذا الموعد كعدم حضور. هل هذا صحيح؟");
    expect(htmlAr).not.toContain("قامت العيادة");
  });

  it("has the four exact answer labels in both languages", () => {
    expect(en.appointments.noShow.answer).toEqual({
      did_not_attend: "Yes, I did not attend",
      attended: "No, I attended",
      arrived_late: "I arrived late",
      report_issue: "Report an issue",
    });
    expect(ar.appointments.noShow.answer).toEqual({
      did_not_attend: "نعم، لم أحضر",
      attended: "لا، لقد حضرت",
      arrived_late: "وصلت متأخرًا",
      report_issue: "الإبلاغ عن مشكلة",
    });
  });
});

describe("late arrival and no-show actions", () => {
  it("shows mark completed and confirm no-show only when allowed", () => {
    const html = renderToStaticMarkup(
      <AppointmentActionBar
        actions={["confirmNoShow", "markCompleted"]}
        strings={en}
        disabled={false}
        onAction={noop}
      />,
    );
    expect(html).toContain(en.appointments.actions.markCompleted);
    expect(html).toContain(en.appointments.actions.confirmNoShow);
    expect(html).not.toContain(en.appointments.actions.flagNoShow);
    expect(html.indexOf(en.appointments.actions.markCompleted)).toBeLessThan(
      html.indexOf(en.appointments.actions.confirmNoShow),
    );
  });

  it("shows the no-show flag in Arabic and never shows invoice actions as bar buttons", () => {
    const html = renderToStaticMarkup(
      <AppointmentActionBar
        actions={["flagNoShow", "createExtraInvoice", "voidExtraInvoice"]}
        strings={ar}
        disabled={false}
        onAction={noop}
      />,
    );
    expect(html).toContain(ar.appointments.actions.flagNoShow);
    expect(html).not.toContain(ar.extraInvoices.add);
    expect(html.match(/<button/g)).toHaveLength(1);
  });

  it("has confirm copy for every yes or no action in both languages", () => {
    for (const strings of [en, ar]) {
      for (const kind of ["complete", "flagNoShow", "markCompleted", "confirmNoShow", "voidInvoice"] as const) {
        const copy = confirmCopy(kind, strings);
        expect(copy.title).toBeTruthy();
        expect(copy.message).toBeTruthy();
        expect(copy.confirmLabel).toBeTruthy();
        expect(copy.cancelLabel).toBeTruthy();
      }
    }
    expect(confirmCopy("markCompleted", en).confirmLabel).toBe(en.appointments.actions.markCompleted);
    expect(confirmCopy("confirmNoShow", ar).confirmLabel).toBe(ar.appointments.actions.confirmNoShow);
  });
});

function invoice(overrides: Partial<ExtraInvoice> = {}): ExtraInvoice {
  return {
    invoiceId: "inv1",
    status: "unpaid",
    lines: [
      {
        kind: "service",
        serviceId: "s1",
        nameEn: "Nail trim",
        nameAr: "قص الأظافر",
        unitPricePiastres: 15_000,
        quantity: 2,
        lineTotalPiastres: 30_000,
      },
      {
        kind: "custom",
        serviceId: null,
        nameEn: "Shampoo",
        nameAr: "Shampoo",
        unitPricePiastres: 5_050,
        quantity: 1,
        lineTotalPiastres: 5_050,
      },
    ],
    totalPiastres: 35_050,
    note: "Extra care",
    createdAtMs: 1_000,
    paidAtMs: null,
    voidedAtMs: null,
    ...overrides,
  };
}

function card(invoices: ExtraInvoice[], allowedActions: Parameters<typeof ExtraInvoicesCard>[0]["allowedActions"], strings = en, locale = "en") {
  return renderToStaticMarkup(
    <ExtraInvoicesCard
      invoices={invoices}
      allowedActions={allowedActions}
      strings={strings}
      locale={locale}
      disabled={false}
      onAdd={noop}
      onVoid={noop}
    />,
  );
}

describe("ExtraInvoicesCard", () => {
  it("is hidden when there are no invoices and creating is not allowed", () => {
    expect(card([], [])).toBe("");
    expect(card([], ["complete"])).toBe("");
  });

  it("offers to add the first invoice when the server allows it", () => {
    const html = card([], ["createExtraInvoice"]);
    expect(html).toContain(en.extraInvoices.title);
    expect(html).toContain(en.extraInvoices.empty);
    expect(html).toContain(en.extraInvoices.add);
    expect(html).toContain("0 of 5 invoices");
  });

  it("lists lines, quantities and piastre totals, with void on unpaid invoices only", () => {
    const html = card(
      [invoice(), invoice({ invoiceId: "inv2", status: "paid" })],
      ["createExtraInvoice", "voidExtraInvoice"],
    );
    expect(html).toContain("Nail trim");
    expect(html).toContain(`2 x ${formatEgp(15_000)}`);
    expect(html).toContain(formatEgp(30_000));
    expect(html).toContain(formatEgp(35_050));
    expect(html).toContain("Extra care");
    expect(html).toContain(en.extraInvoices.status.unpaid);
    expect(html).toContain(en.extraInvoices.status.paid);
    expect(html.match(new RegExp(en.extraInvoices.void, "g"))).toHaveLength(1);
  });

  it("shows Arabic names and labels", () => {
    const html = card([invoice()], ["createExtraInvoice"], ar, "ar");
    expect(html).toContain("قص الأظافر");
    expect(html).toContain(ar.extraInvoices.title);
    expect(html).toContain(ar.extraInvoices.status.unpaid);
    expect(html).not.toContain(ar.extraInvoices.void);
  });

  it("stops offering new invoices at five non-void ones and shows the limit", () => {
    const five = ["a", "b", "c", "d", "e"].map((id) => invoice({ invoiceId: id }));
    const all = [...five, invoice({ invoiceId: "f", status: "void", voidedAtMs: 2_000 })];
    const html = card(all, ["createExtraInvoice"]);
    expect(html).not.toContain(en.extraInvoices.add);
    expect(html).toContain(en.extraInvoices.limit);
    const serverAtLimit = card(all, ["complete", "voidExtraInvoice"]);
    expect(serverAtLimit).toContain(en.extraInvoices.limit);
    expect(serverAtLimit).not.toContain(en.extraInvoices.windowClosed);
    expect(serverAtLimit).toContain(en.extraInvoices.void);
    expect(html).toContain("5 of 5 invoices");
    expect(html).toContain(en.extraInvoices.status.void);
  });

  it("explains the window once the server stops allowing new invoices", () => {
    const html = card([invoice()], ["complete"]);
    expect(html).toContain(en.extraInvoices.windowClosed);
    expect(html).not.toContain(en.extraInvoices.add);
    expect(html).not.toContain(en.extraInvoices.void);
    expect(card([invoice()], [])).not.toContain(en.extraInvoices.windowClosed);
  });
});

describe("ExtraInvoiceDialog", () => {
  it("loads branch services with a shimmer and shows the note and total", () => {
    const html = renderToStaticMarkup(
      <ExtraInvoiceDialog
        branchId="b1"
        strings={en}
        locale="en"
        isSubmitting={false}
        error={null}
        onConfirm={noop}
        onClose={noop}
      />,
    );
    expect(html).toContain(en.extraInvoices.dialogTitle);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain(en.extraInvoices.note);
    expect(html).toContain(formatEgp(0));
    expect(html).toMatch(/<button[^>]*disabled[^>]*>Create invoice</);
  });

  it("shows a mapped error in Arabic", () => {
    const html = renderToStaticMarkup(
      <ExtraInvoiceDialog
        branchId="b1"
        strings={ar}
        locale="ar"
        isSubmitting={false}
        error={ar.errors.appointments.windowClosed}
        onConfirm={noop}
        onClose={noop}
      />,
    );
    expect(html).toContain(ar.errors.appointments.windowClosed);
    expect(html).toContain(ar.extraInvoices.dialogTitle);
  });
});

describe("InvoiceLineFields", () => {
  const services = [{ serviceId: "s1", nameEn: "Nail trim", nameAr: "قص الأظافر", pricePiastres: 15_000 }];

  it("a service line picks a branch service with its fixed price, no price input", () => {
    const html = renderToStaticMarkup(
      <InvoiceLineFields
        line={{ ...emptyInvoiceLine("a"), serviceId: "s1", quantity: "2" }}
        index={0}
        check={{ key: "a", issues: [], unitPricePiastres: 15_000, lineTotalPiastres: 30_000 }}
        services={services}
        showErrors={false}
        canRemove={false}
        strings={en}
        locale="en"
        onChange={noop}
        onRemove={noop}
      />,
    );
    expect(html).toContain(`Nail trim (${formatEgp(15_000)})`);
    expect(html).toContain(formatEgp(30_000));
    expect(html).not.toContain(en.extraInvoices.price);
    expect(html).not.toContain("Remove line");
  });

  it("a custom line asks for a name and price and shows field errors after submit", () => {
    const html = renderToStaticMarkup(
      <InvoiceLineFields
        line={{ ...emptyInvoiceLine("b", "custom"), name: "A", priceEgp: "0.5" }}
        index={1}
        check={{ key: "b", issues: ["name", "price"], unitPricePiastres: null, lineTotalPiastres: null }}
        services={services}
        showErrors
        canRemove
        strings={ar}
        locale="ar"
        onChange={noop}
        onRemove={noop}
      />,
    );
    expect(html).toContain(ar.extraInvoices.name);
    expect(html).toContain(ar.extraInvoices.price);
    expect(html).toContain(ar.extraInvoices.validation.name);
    expect(html).toContain(ar.extraInvoices.validation.price);
    expect(html).toContain(ar.extraInvoices.removeLine.replace("{number}", "2"));
  });
});
