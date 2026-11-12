"use client";

import { useState, type FormEvent } from "react";

import { PortalSelect } from "@/components/ui/select/PortalSelect";
import {
  expiryDayBounds,
  initialCouponValues,
  parseCouponForm,
  type CouponFormField,
  type CouponFormValues,
} from "@/features/coupons/domain/schemas";
import {
  COUPON_LIMITS,
  type Coupon,
  type CouponCreatePayload,
  type CouponType,
} from "@/features/coupons/domain/types";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./coupons.module.css";

type CouponFormProps = {
  coupon?: Coupon | null;
  /** Clock for the expiry bounds; the section reads it once. */
  nowMs: number;
  isSaving: boolean;
  serverError: string | null;
  onSubmit: (payload: CouponCreatePayload) => void;
  onCancel: () => void;
};

export function CouponForm({
  coupon = null,
  nowMs,
  isSaving,
  serverError,
  onSubmit,
  onCancel,
}: CouponFormProps) {
  const strings = useStrings();
  const t = strings.coupons;
  const [values, setValues] = useState<CouponFormValues>(() => initialCouponValues(coupon, nowMs));
  const [errors, setErrors] = useState<Partial<Record<CouponFormField, true>>>({});
  const isEdit = coupon !== null;
  const locked = isEdit && coupon.usedCount > 0;
  const bounds = expiryDayBounds(nowMs);
  const isPercent = values.type === "percentage";

  function set<K extends keyof CouponFormValues>(key: K, value: CouponFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = parseCouponForm(values, nowMs, {
      currentExpiresAtMs: coupon?.expiresAtMs ?? null,
    });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    onSubmit(result.payload);
  }

  function inputClass(field: CouponFormField) {
    return errors[field] ? `${styles.input} ${styles.inputInvalid}` : styles.input;
  }

  function fieldError(field: CouponFormField) {
    if (!errors[field]) return null;
    const message =
      field === "value"
        ? isPercent
          ? t.validation.valuePercent
          : t.validation.valueFixed
        : t.validation[field];
    return (
      <p className={styles.fieldError} role="alert" id={`coupon-${field}-error`}>
        {message}
      </p>
    );
  }

  return (
    <form className={`${styles.panel} ${styles.form}`} onSubmit={handleSubmit} noValidate>
      <h2 className={styles.panelTitle}>{isEdit ? t.edit : t.add}</h2>
      {serverError ? (
        <div className={styles.alertError} role="alert">
          {serverError}
        </div>
      ) : null}
      {locked ? (
        <div className={styles.alertInfo} role="note">
          {t.lockedHint}
        </div>
      ) : null}

      <div className={styles.fieldGrid}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="coupon-code">
            {t.fields.code}
          </label>
          <input
            id="coupon-code"
            className={inputClass("code")}
            dir="ltr"
            autoCapitalize="characters"
            value={values.code}
            maxLength={COUPON_LIMITS.codeMax + 10}
            disabled={isEdit}
            onChange={(e) => set("code", e.target.value)}
          />
          <p className={styles.fieldHint}>{t.hints.code}</p>
          {fieldError("code")}
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="coupon-type">
            {t.fields.type}
          </label>
          {locked ? (
            <input id="coupon-type" className={styles.input} value={t.type[values.type]} disabled />
          ) : (
            <PortalSelect
              id="coupon-type"
              value={values.type}
              ariaLabel={t.fields.type}
              options={[
                { value: "percentage", label: t.type.percentage },
                { value: "fixed", label: t.type.fixed },
              ]}
              onChange={(next) => set("type", next as CouponType)}
            />
          )}
          {fieldError("type")}
        </div>
      </div>

      <div className={styles.fieldGrid}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="coupon-value">
            {isPercent ? t.fields.valuePercent : t.fields.valueFixed}
          </label>
          <input
            id="coupon-value"
            className={inputClass("value")}
            inputMode={isPercent ? "numeric" : "decimal"}
            dir="ltr"
            value={values.value}
            disabled={locked}
            onChange={(e) => set("value", e.target.value)}
          />
          {fieldError("value")}
        </div>
        {isPercent ? (
          <div className={styles.field}>
            <label className={styles.label} htmlFor="coupon-max-discount">
              {t.fields.maxDiscount}
            </label>
            <input
              id="coupon-max-discount"
              className={inputClass("maxDiscount")}
              inputMode="decimal"
              dir="ltr"
              value={values.maxDiscountEgp}
              onChange={(e) => set("maxDiscountEgp", e.target.value)}
            />
            <p className={styles.fieldHint}>{t.hints.maxDiscount}</p>
            {fieldError("maxDiscount")}
          </div>
        ) : null}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="coupon-min-order">
            {t.fields.minOrder}
          </label>
          <input
            id="coupon-min-order"
            className={inputClass("minOrder")}
            inputMode="decimal"
            dir="ltr"
            value={values.minOrderEgp}
            onChange={(e) => set("minOrderEgp", e.target.value)}
          />
          <p className={styles.fieldHint}>{t.hints.minOrder}</p>
          {fieldError("minOrder")}
        </div>
      </div>

      <div className={styles.fieldGrid}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="coupon-expires">
            {t.fields.expiresAt}
          </label>
          <input
            id="coupon-expires"
            className={inputClass("expiresAt")}
            type="date"
            dir="ltr"
            min={bounds.min}
            max={bounds.max}
            value={values.expiresOn}
            onChange={(e) => set("expiresOn", e.target.value)}
          />
          <p className={styles.fieldHint}>{t.hints.expiresAt}</p>
          {fieldError("expiresAt")}
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="coupon-per-user">
            {t.fields.perUserLimit}
          </label>
          <input
            id="coupon-per-user"
            className={inputClass("perUserLimit")}
            inputMode="numeric"
            dir="ltr"
            value={values.perUserLimit}
            onChange={(e) => set("perUserLimit", e.target.value)}
          />
          {fieldError("perUserLimit")}
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="coupon-total">
            {t.fields.totalLimit}
          </label>
          <input
            id="coupon-total"
            className={inputClass("totalLimit")}
            inputMode="numeric"
            dir="ltr"
            value={values.totalLimit}
            onChange={(e) => set("totalLimit", e.target.value)}
          />
          <p className={styles.fieldHint}>{t.hints.totalLimit}</p>
          {fieldError("totalLimit")}
        </div>
      </div>

      <ul className={styles.hintList}>
        <li>{t.hints.fundedByVendor}</li>
        <li>{t.hints.feesOnDiscounted}</li>
      </ul>

      <div className={styles.actions}>
        <button type="submit" className={styles.primaryButton} disabled={isSaving}>
          {isSaving ? t.saving : t.save}
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={onCancel}
          disabled={isSaving}
        >
          {strings.common.cancel}
        </button>
      </div>
    </form>
  );
}
