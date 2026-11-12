import { describe, expect, it } from "vitest";

import {
  activeInvoiceCount,
  canAddInvoice,
  checkInvoiceDraft,
  editInvoiceDraft,
  emptyInvoiceLine,
  parsePriceEgp,
  parseQuantity,
  type InvoiceLineDraft,
  type InvoiceServiceOption,
} from "@/features/appointments/domain/extra-invoices";

const SERVICES: InvoiceServiceOption[] = [
  { serviceId: "s1", nameEn: "Nail trim", nameAr: "قص الأظافر", pricePiastres: 15_000 },
];

function service(key: string, quantity = "1", serviceId = "s1"): InvoiceLineDraft {
  return { ...emptyInvoiceLine(key, "service"), serviceId, quantity };
}

function custom(key: string, name: string, priceEgp: string, quantity = "1"): InvoiceLineDraft {
  return { ...emptyInvoiceLine(key, "custom"), name, priceEgp, quantity };
}

describe("parsers", () => {
  it("reads EGP with up to two decimals as integer piastres", () => {
    expect(parsePriceEgp("12")).toBe(1_200);
    expect(parsePriceEgp(" 12.5 ")).toBe(1_250);
    expect(parsePriceEgp("0.1")).toBe(10);
    expect(parsePriceEgp("1.234")).toBeNull();
    expect(parsePriceEgp("-1")).toBeNull();
    expect(parsePriceEgp("")).toBeNull();
  });

  it("accepts quantities 1 to 10 only", () => {
    expect(parseQuantity("1")).toBe(1);
    expect(parseQuantity("10")).toBe(10);
    expect(parseQuantity("0")).toBeNull();
    expect(parseQuantity("11")).toBeNull();
    expect(parseQuantity("1.5")).toBeNull();
  });
});

describe("checkInvoiceDraft", () => {
  it("builds service and custom lines with quantities and a piastre total", () => {
    const check = checkInvoiceDraft(
      { lines: [service("a", "2"), custom("b", " Shampoo ", "50.25", "3")], note: " Thanks " },
      SERVICES,
    );
    expect(check.lines.map((l) => l.lineTotalPiastres)).toEqual([30_000, 15_075]);
    expect(check.totalPiastres).toBe(45_075);
    expect(check.payload).toEqual({
      lines: [
        { serviceId: "s1", quantity: 2 },
        { name: "Shampoo", unitPricePiastres: 5_025, quantity: 3 },
      ],
      note: "Thanks",
    });
  });

  it("leaves out an empty note", () => {
    expect(checkInvoiceDraft({ lines: [service("a")], note: "  " }, SERVICES).payload).toEqual({
      lines: [{ serviceId: "s1", quantity: 1 }],
    });
  });

  it("flags a missing or unknown service", () => {
    const check = checkInvoiceDraft({ lines: [service("a", "1", "")], note: "" }, SERVICES);
    expect(check.lines[0].issues).toEqual(["service"]);
    expect(check.payload).toBeNull();
    expect(
      checkInvoiceDraft({ lines: [service("a", "1", "gone")], note: "" }, SERVICES).lines[0].issues,
    ).toEqual(["service"]);
  });

  it("checks custom names of 2 to 80 characters and unit prices of 1 to 10,000 EGP", () => {
    const issues = (name: string, price: string) =>
      checkInvoiceDraft({ lines: [custom("a", name, price)], note: "" }, []).lines[0].issues;
    expect(issues("A", "10")).toEqual(["name"]);
    expect(issues("x".repeat(81), "10")).toEqual(["name"]);
    expect(issues("Ok", "0.99")).toEqual(["price"]);
    expect(issues("Ok", "10000.01")).toEqual(["price"]);
    expect(issues("Ok", "1")).toEqual([]);
    expect(issues("Ok", "10000")).toEqual([]);
  });

  it("flags a quantity outside 1 to 10", () => {
    const check = checkInvoiceDraft({ lines: [service("a", "11")], note: "" }, SERVICES);
    expect(check.lines[0].issues).toEqual(["quantity"]);
    expect(check.lines[0].lineTotalPiastres).toBeNull();
  });

  it("limits lines to 1 to 10 and the total to 50,000 EGP", () => {
    expect(checkInvoiceDraft({ lines: [], note: "" }, SERVICES).linesIssue).toBe("empty");
    const eleven = Array.from({ length: 11 }, (_, i) => service(String(i)));
    const many = checkInvoiceDraft({ lines: eleven, note: "" }, SERVICES);
    expect(many.linesIssue).toBe("tooMany");
    expect(many.payload).toBeNull();
    const big = Array.from({ length: 6 }, (_, i) => custom(String(i), "Surgery", "10000", "1"));
    const over = checkInvoiceDraft({ lines: big, note: "" }, []);
    expect(over.totalPiastres).toBe(6_000_000);
    expect(over.totalIssue).toBe("max");
    expect(over.payload).toBeNull();
    const five = checkInvoiceDraft({ lines: big.slice(0, 5), note: "" }, []);
    expect(five.totalIssue).toBeNull();
    expect(five.payload).not.toBeNull();
  });

  it("refuses a note over 300 characters", () => {
    const check = checkInvoiceDraft({ lines: [service("a")], note: "n".repeat(301) }, SERVICES);
    expect(check.noteInvalid).toBe(true);
    expect(check.payload).toBeNull();
  });
});

describe("invoice limit", () => {
  it("counts only non-void invoices toward the limit of five", () => {
    const four = [
      { status: "unpaid" as const },
      { status: "paid" as const },
      { status: "unpaid" as const },
      { status: "unpaid" as const },
      { status: "void" as const },
    ];
    expect(activeInvoiceCount(four)).toBe(4);
    expect(canAddInvoice(four)).toBe(true);
    expect(canAddInvoice([...four, { status: "unpaid" as const }])).toBe(false);
  });
});

describe("editInvoiceDraft", () => {
  it("keeps the request id on a plain retry and makes a new one after any edit", () => {
    let n = 0;
    const next = () => `req-${++n}`;
    const start = { draft: { lines: [service("a")], note: "" }, requestId: "req-0" };
    expect(editInvoiceDraft(start, (d) => d, next)).toBe(start);
    const edited = editInvoiceDraft(start, (d) => ({ ...d, lines: [service("a", "2")] }), next);
    expect(edited.requestId).toBe("req-1");
    expect(edited.draft.lines[0].quantity).toBe("2");
    const noted = editInvoiceDraft(edited, (d) => ({ ...d, note: "Thanks" }), next);
    expect(noted.requestId).toBe("req-2");
    expect(noted.draft.note).toBe("Thanks");
  });
});
