import { activeInvoiceCount, canAddInvoice } from "@/features/appointments/domain/extra-invoices";
import {
  EXTRA_INVOICE_LIMITS,
  type AppointmentAction,
  type ExtraInvoice,
  type ExtraInvoiceStatus,
} from "@/features/appointments/domain/types";
import { formatInstant } from "@/features/appointments/presentation/appointments-copy";
import { formatEgp } from "@/features/products/domain/currency";
import type { AppStrings } from "@/shared/i18n/types";

import branchStyles from "@/features/branches/presentation/branches.module.css";
import styles from "./appointments.module.css";

const STATUS_TONE: Record<ExtraInvoiceStatus, string> = {
  unpaid: styles.toneWarning,
  paid: styles.toneDone,
  void: styles.toneMuted,
};

type ExtraInvoicesCardProps = {
  invoices: ExtraInvoice[];
  allowedActions: readonly AppointmentAction[];
  strings: AppStrings;
  locale: string;
  disabled: boolean;
  onAdd: () => void;
  onVoid: (invoiceId: string) => void;
};

function InvoiceItem({
  invoice,
  index,
  canVoid,
  strings,
  locale,
  disabled,
  onVoid,
}: {
  invoice: ExtraInvoice;
  index: number;
  canVoid: boolean;
  strings: AppStrings;
  locale: string;
  disabled: boolean;
  onVoid: (invoiceId: string) => void;
}) {
  const t = strings.extraInvoices;
  return (
    <li className={styles.invoice}>
      <div className={branchStyles.panelHeader}>
        <span className={styles.rowTitle}>
          {t.invoiceLabel.replace("{number}", String(index + 1))}
        </span>
        <span className={`${styles.badge} ${STATUS_TONE[invoice.status]}`}>
          {t.status[invoice.status]}
        </span>
      </div>
      <ul className={styles.lines}>
        {invoice.lines.map((line, lineIndex) => (
          <li key={`${invoice.invoiceId}-${lineIndex}`} className={styles.line}>
            <span>
              {locale === "ar" ? line.nameAr : line.nameEn}{" "}
              <span className={branchStyles.muted}>
                {t.lineSummary
                  .replace("{quantity}", String(line.quantity))
                  .replace("{price}", formatEgp(line.unitPricePiastres))}
              </span>
            </span>
            <span>{formatEgp(line.lineTotalPiastres)}</span>
          </li>
        ))}
        <li className={styles.lineTotal}>
          <span>{t.total}</span>
          <span>{formatEgp(invoice.totalPiastres)}</span>
        </li>
      </ul>
      {invoice.note ? <p className={styles.rowText}>{invoice.note}</p> : null}
      {invoice.createdAtMs !== null ? (
        <p className={branchStyles.muted}>
          {t.createdAt.replace("{time}", formatInstant(invoice.createdAtMs, locale))}
        </p>
      ) : null}
      {invoice.voidedAtMs !== null ? (
        <p className={branchStyles.muted}>
          {t.voidedAt.replace("{time}", formatInstant(invoice.voidedAtMs, locale))}
        </p>
      ) : null}
      {canVoid && invoice.status === "unpaid" ? (
        <div className={branchStyles.actions}>
          <button
            type="button"
            className={branchStyles.dangerButton}
            disabled={disabled}
            onClick={() => onVoid(invoice.invoiceId)}
          >
            {t.void}
          </button>
        </div>
      ) : null}
    </li>
  );
}

/**
 * Extra invoices of one appointment. Create and void buttons follow the
 * server's allowed actions; the limit of five is shown, not enforced, here. Pure.
 */
export function ExtraInvoicesCard({
  invoices,
  allowedActions,
  strings,
  locale,
  disabled,
  onAdd,
  onVoid,
}: ExtraInvoicesCardProps) {
  const t = strings.extraInvoices;
  const canCreate = allowedActions.includes("createExtraInvoice");
  const canVoid = allowedActions.includes("voidExtraInvoice");
  if (!canCreate && invoices.length === 0) return null;
  const underLimit = canAddInvoice(invoices);
  /** The server drops the create action at the limit but keeps void while the window is open. */
  const windowOpen = canCreate || canVoid;

  return (
    <section className={branchStyles.panel} aria-label={t.title}>
      <div className={branchStyles.panelHeader}>
        <h2 className={branchStyles.panelTitle}>{t.title}</h2>
        <span className={branchStyles.muted}>
          {t.count
            .replace("{count}", String(activeInvoiceCount(invoices)))
            .replace("{max}", String(EXTRA_INVOICE_LIMITS.maxInvoices))}
        </span>
      </div>
      {canCreate ? <p className={branchStyles.muted}>{t.hint}</p> : null}
      {invoices.length === 0 ? (
        <p className={branchStyles.muted}>{t.empty}</p>
      ) : (
        <ol className={styles.lines}>
          {invoices.map((invoice, index) => (
            <InvoiceItem
              key={invoice.invoiceId}
              invoice={invoice}
              index={index}
              canVoid={canVoid}
              strings={strings}
              locale={locale}
              disabled={disabled}
              onVoid={onVoid}
            />
          ))}
        </ol>
      )}
      {canCreate && underLimit ? (
        <div className={branchStyles.actions}>
          <button
            type="button"
            className={branchStyles.primaryButton}
            disabled={disabled}
            onClick={onAdd}
          >
            {t.add}
          </button>
        </div>
      ) : null}
      {windowOpen && !underLimit ? <p className={branchStyles.muted}>{t.limit}</p> : null}
      {!windowOpen && allowedActions.length > 0 ? (
        <p className={branchStyles.muted}>{t.windowClosed}</p>
      ) : null}
    </section>
  );
}
