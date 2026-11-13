import { useId } from "react";

import { PortalSelect } from "@/components/ui/select/PortalSelect";
import type {
  InvoiceLineCheck,
  InvoiceLineDraft,
  InvoiceLineIssue,
  InvoiceLineKind,
  InvoiceServiceOption,
} from "@/features/appointments/domain/extra-invoices";
import { EXTRA_INVOICE_LIMITS } from "@/features/appointments/domain/types";
import { formatEgp } from "@/features/products/domain/currency";
import type { AppStrings } from "@/shared/i18n/types";
import type { AppLocale } from "@/shared/preferences/domain/types";

import branchStyles from "@/features/branches/presentation/branches.module.css";
import styles from "./appointments.module.css";

type InvoiceLineFieldsProps = {
  line: InvoiceLineDraft;
  index: number;
  check: InvoiceLineCheck | undefined;
  services: InvoiceServiceOption[];
  showErrors: boolean;
  canRemove: boolean;
  strings: AppStrings;
  locale: AppLocale;
  onChange: (line: InvoiceLineDraft) => void;
  onRemove: () => void;
};

/** Fields of one invoice line: service or custom item, price, quantity and line total. Pure. */
export function InvoiceLineFields({
  line,
  index,
  check,
  services,
  showErrors,
  canRemove,
  strings,
  locale,
  onChange,
  onRemove,
}: InvoiceLineFieldsProps) {
  const t = strings.extraInvoices;
  const id = useId();
  const number = String(index + 1);
  const issue = (key: InvoiceLineIssue) => showErrors && (check?.issues.includes(key) ?? false);

  function errorText(key: InvoiceLineIssue) {
    return issue(key) ? <p className={branchStyles.fieldError}>{t.validation[key]}</p> : null;
  }

  return (
    <fieldset className={styles.invoiceLine} aria-label={t.lineLabel.replace("{number}", number)}>
      <div className={branchStyles.field}>
        <span className={branchStyles.label}>{t.lineKind}</span>
        <PortalSelect
          value={line.kind}
          ariaLabel={t.lineKind}
          options={[
            { value: "service", label: t.service },
            { value: "custom", label: t.custom },
          ]}
          onChange={(kind) => onChange({ ...line, kind: kind as InvoiceLineKind })}
        />
      </div>
      {line.kind === "service" ? (
        <div className={branchStyles.field}>
          <span className={branchStyles.label}>{t.service}</span>
          <PortalSelect
            value={line.serviceId}
            ariaLabel={t.service}
            options={[
              { value: "", label: t.selectService },
              ...services.map((s) => ({
                value: s.serviceId,
                label: `${locale === "ar" ? s.nameAr || s.nameEn : s.nameEn} (${formatEgp(s.pricePiastres, locale)})`,
              })),
            ]}
            onChange={(serviceId) => onChange({ ...line, serviceId })}
          />
          {errorText("service")}
        </div>
      ) : (
        <>
          <div className={branchStyles.field}>
            <label className={branchStyles.label} htmlFor={`${id}-name`}>
              {t.name}
            </label>
            <input
              id={`${id}-name`}
              className={`${branchStyles.input} ${issue("name") ? branchStyles.inputInvalid : ""}`}
              value={line.name}
              maxLength={EXTRA_INVOICE_LIMITS.nameMax}
              aria-invalid={issue("name")}
              onChange={(event) => onChange({ ...line, name: event.target.value })}
            />
            {errorText("name")}
          </div>
          <div className={branchStyles.field}>
            <label className={branchStyles.label} htmlFor={`${id}-price`}>
              {t.price}
            </label>
            <input
              id={`${id}-price`}
              className={`${branchStyles.input} ${issue("price") ? branchStyles.inputInvalid : ""}`}
              value={line.priceEgp}
              inputMode="decimal"
              aria-invalid={issue("price")}
              onChange={(event) => onChange({ ...line, priceEgp: event.target.value })}
            />
            {errorText("price")}
          </div>
        </>
      )}
      <div className={branchStyles.field}>
        <label className={branchStyles.label} htmlFor={`${id}-quantity`}>
          {t.quantity}
        </label>
        <input
          id={`${id}-quantity`}
          className={`${branchStyles.input} ${issue("quantity") ? branchStyles.inputInvalid : ""}`}
          value={line.quantity}
          type="number"
          min={EXTRA_INVOICE_LIMITS.quantityMin}
          max={EXTRA_INVOICE_LIMITS.quantityMax}
          inputMode="numeric"
          aria-invalid={issue("quantity")}
          onChange={(event) => onChange({ ...line, quantity: event.target.value })}
        />
        {errorText("quantity")}
      </div>
      <div className={branchStyles.field}>
        <span className={branchStyles.label}>{t.lineTotal}</span>
        <span className={styles.amount}>{formatEgp(check?.lineTotalPiastres ?? 0, locale)}</span>
      </div>
      {canRemove ? (
        <div className={branchStyles.actions}>
          <button type="button" className={branchStyles.secondaryButton} onClick={onRemove}>
            {t.removeLine.replace("{number}", number)}
          </button>
        </div>
      ) : null}
    </fieldset>
  );
}
