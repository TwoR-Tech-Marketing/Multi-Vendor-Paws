import type { AppStrings } from "@/shared/i18n/types";

/** Detail actions that only need a yes or no. */
export type ConfirmKind = "complete" | "flagNoShow" | "markCompleted" | "confirmNoShow" | "voidInvoice";

export type DetailDialog =
  | { kind: ConfirmKind; invoiceId?: string }
  | { kind: "cancel" }
  | { kind: "reschedule" }
  | { kind: "createInvoice" };

export type SuccessKey = keyof AppStrings["appointments"]["success"];

export const CONFIRM_KINDS: readonly ConfirmKind[] = [
  "complete",
  "flagNoShow",
  "markCompleted",
  "confirmNoShow",
  "voidInvoice",
];

export function isConfirmKind(kind: string): kind is ConfirmKind {
  return (CONFIRM_KINDS as readonly string[]).includes(kind);
}

/** Title, message and confirm label of each yes or no dialog. */
export function confirmCopy(
  kind: ConfirmKind,
  strings: AppStrings,
): { title: string; message: string; confirmLabel: string; cancelLabel: string } {
  const d = strings.appointments.dialogs;
  const a = strings.appointments.actions;
  switch (kind) {
    case "complete":
      return {
        title: d.completeTitle,
        message: d.completeBody,
        confirmLabel: a.complete,
        cancelLabel: strings.common.cancel,
      };
    case "flagNoShow":
      return {
        title: d.flagNoShowTitle,
        message: d.flagNoShowBody,
        confirmLabel: a.flagNoShow,
        cancelLabel: d.back,
      };
    case "markCompleted":
      return {
        title: d.markCompletedTitle,
        message: d.markCompletedBody,
        confirmLabel: a.markCompleted,
        cancelLabel: d.back,
      };
    case "confirmNoShow":
      return {
        title: d.confirmNoShowTitle,
        message: d.confirmNoShowBody,
        confirmLabel: a.confirmNoShow,
        cancelLabel: d.back,
      };
    case "voidInvoice":
      return {
        title: strings.extraInvoices.voidTitle,
        message: strings.extraInvoices.voidBody,
        confirmLabel: strings.extraInvoices.void,
        cancelLabel: strings.extraInvoices.keep,
      };
  }
}
