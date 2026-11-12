import { egpToPiastres } from "@/features/products/domain/currency";
import {
  EXTRA_INVOICE_LIMITS as L,
  type ExtraInvoice,
} from "@/features/appointments/domain/types";

/**
 * Extra invoice form rules. They mirror the server limits so the form can
 * guide the provider; the server recomputes service prices and totals and is
 * the only authority. Money is integer piastres.
 */

export type InvoiceLineKind = "service" | "custom";

/** One line as typed in the form. */
export type InvoiceLineDraft = {
  key: string;
  kind: InvoiceLineKind;
  serviceId: string;
  name: string;
  priceEgp: string;
  quantity: string;
};

export type InvoiceDraft = { lines: InvoiceLineDraft[]; note: string };

/** An active service of the appointment's branch, offered as a service line. */
export type InvoiceServiceOption = {
  serviceId: string;
  nameEn: string;
  nameAr: string;
  pricePiastres: number;
};

export type InvoiceLinePayload =
  | { serviceId: string; quantity: number }
  | { name: string; unitPricePiastres: number; quantity: number };

export type CreateExtraInvoicePayload = { lines: InvoiceLinePayload[]; note?: string };

export type InvoiceLineIssue = "service" | "name" | "price" | "quantity";

export type InvoiceLineCheck = {
  key: string;
  issues: InvoiceLineIssue[];
  unitPricePiastres: number | null;
  lineTotalPiastres: number | null;
};

export type InvoiceDraftCheck = {
  lines: InvoiceLineCheck[];
  totalPiastres: number;
  totalIssue: "min" | "max" | null;
  linesIssue: "empty" | "tooMany" | null;
  noteInvalid: boolean;
  payload: CreateExtraInvoicePayload | null;
};

export function emptyInvoiceLine(key: string, kind: InvoiceLineKind = "service"): InvoiceLineDraft {
  return { key, kind, serviceId: "", name: "", priceEgp: "", quantity: "1" };
}

/** "12" or "12.50" EGP to integer piastres; anything else is null. */
export function parsePriceEgp(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  return egpToPiastres(Number(trimmed));
}

export function parseQuantity(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const quantity = Number(trimmed);
  return quantity >= L.quantityMin && quantity <= L.quantityMax ? quantity : null;
}

function checkLine(line: InvoiceLineDraft, services: InvoiceServiceOption[]) {
  const issues: InvoiceLineIssue[] = [];
  const quantity = parseQuantity(line.quantity);
  if (quantity === null) issues.push("quantity");
  let unitPricePiastres: number | null = null;
  let payload: InvoiceLinePayload | null = null;

  if (line.kind === "service") {
    const service = services.find((s) => s.serviceId === line.serviceId);
    if (!service) issues.push("service");
    else unitPricePiastres = service.pricePiastres;
    if (service && quantity !== null) payload = { serviceId: service.serviceId, quantity };
  } else {
    const name = line.name.trim();
    if (name.length < L.nameMin || name.length > L.nameMax) issues.push("name");
    const price = parsePriceEgp(line.priceEgp);
    if (price === null || price < L.unitPriceMinPiastres || price > L.unitPriceMaxPiastres) {
      issues.push("price");
    } else {
      unitPricePiastres = price;
    }
    if (issues.length === 0 && quantity !== null && unitPricePiastres !== null) {
      payload = { name, unitPricePiastres, quantity };
    }
  }

  const lineTotalPiastres =
    unitPricePiastres !== null && quantity !== null ? unitPricePiastres * quantity : null;
  return {
    check: { key: line.key, issues, unitPricePiastres, lineTotalPiastres },
    payload: issues.length === 0 ? payload : null,
  };
}

/** Checks every line, the line count, the total and the note; builds the payload when all pass. */
export function checkInvoiceDraft(
  draft: InvoiceDraft,
  services: InvoiceServiceOption[],
): InvoiceDraftCheck {
  const results = draft.lines.map((line) => checkLine(line, services));
  const totalPiastres = results.reduce((sum, r) => sum + (r.check.lineTotalPiastres ?? 0), 0);
  const linesIssue =
    draft.lines.length === 0 ? "empty" : draft.lines.length > L.maxLines ? "tooMany" : null;
  const totalIssue =
    totalPiastres > L.totalMaxPiastres
      ? "max"
      : totalPiastres < L.totalMinPiastres
        ? "min"
        : null;
  const note = draft.note.trim();
  const noteInvalid = note.length > L.noteMax;
  const payloads = results.map((r) => r.payload);
  const allLinesValid = payloads.every((p): p is InvoiceLinePayload => p !== null);

  const payload =
    allLinesValid && !linesIssue && !totalIssue && !noteInvalid
      ? { lines: payloads as InvoiceLinePayload[], ...(note ? { note } : {}) }
      : null;

  return {
    lines: results.map((r) => r.check),
    totalPiastres,
    totalIssue,
    linesIssue,
    noteInvalid,
    payload,
  };
}

/** Invoices that count toward the limit of five. */
export function activeInvoiceCount(invoices: Pick<ExtraInvoice, "status">[]): number {
  return invoices.filter((invoice) => invoice.status !== "void").length;
}

export function canAddInvoice(invoices: Pick<ExtraInvoice, "status">[]): boolean {
  return activeInvoiceCount(invoices) < L.maxInvoices;
}
