"use client";

import { useState, type FormEvent } from "react";

import {
  parseServiceForm,
  type ServiceFormField,
  type ServiceFormValues,
} from "@/features/branches/domain/schemas";
import {
  BRANCH_LIMITS,
  type BranchService,
  type ServicePayload,
} from "@/features/branches/domain/types";
import { piastresToEgp } from "@/features/products/domain/currency";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./branches.module.css";

/** Same limit as the Storage rule for vendor files. */
export const SERVICE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

type ServiceFormProps = {
  service?: BranchService | null;
  isSaving: boolean;
  serverError: string | null;
  onSubmit: (payload: ServicePayload, photo: File | null) => void;
  onCancel: () => void;
};

export function initialServiceValues(service?: BranchService | null): ServiceFormValues {
  return {
    nameEn: service?.nameEn ?? "",
    nameAr: service?.nameAr ?? "",
    priceEgp: service ? String(piastresToEgp(service.pricePiastres)) : "",
    durationMinutes: String(service?.durationMinutes ?? BRANCH_LIMITS.defaultDurationMinutes),
  };
}

export function isAcceptablePhoto(file: File): boolean {
  return file.type.startsWith("image/") && file.size <= SERVICE_PHOTO_MAX_BYTES;
}

export function ServiceForm({ service, isSaving, serverError, onSubmit, onCancel }: ServiceFormProps) {
  const strings = useStrings();
  const t = strings.services;
  const [values, setValues] = useState<ServiceFormValues>(() => initialServiceValues(service));
  const [errors, setErrors] = useState<Partial<Record<ServiceFormField, true>>>({});
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState(false);

  function set<K extends keyof ServiceFormValues>(key: K, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = parseServiceForm(values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    if (photoError) return;
    setErrors({});
    onSubmit(result.payload, photo);
  }

  function field(
    key: keyof ServiceFormValues,
    error: ServiceFormField,
    label: string,
    options: { dir?: "ltr" | "rtl"; inputMode?: "decimal" | "numeric"; maxLength?: number } = {},
  ) {
    const id = `service-${key}`;
    return (
      <div className={styles.field}>
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
        <input
          id={id}
          className={errors[error] ? `${styles.input} ${styles.inputInvalid}` : styles.input}
          value={values[key]}
          dir={options.dir}
          inputMode={options.inputMode}
          maxLength={options.maxLength}
          onChange={(e) => set(key, e.target.value)}
        />
        {errors[error] ? (
          <p className={styles.fieldError} role="alert">
            {t.validation[error]}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form className={`${styles.panel} ${styles.form}`} onSubmit={handleSubmit} noValidate>
      <h2 className={styles.panelTitle}>{service ? t.edit : t.add}</h2>
      {serverError ? (
        <div className={styles.alertError} role="alert">
          {serverError}
        </div>
      ) : null}
      <div className={styles.fieldGrid}>
        {field("nameEn", "nameEn", t.fields.nameEn, { dir: "ltr", maxLength: BRANCH_LIMITS.nameMax })}
        {field("nameAr", "nameAr", t.fields.nameAr, { dir: "rtl", maxLength: BRANCH_LIMITS.nameMax })}
        {field("priceEgp", "price", t.fields.price, { dir: "ltr", inputMode: "decimal" })}
        {field("durationMinutes", "duration", t.fields.duration, {
          dir: "ltr",
          inputMode: "numeric",
        })}
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="service-photo">
          {t.fields.photo}
        </label>
        <input
          id="service-photo"
          type="file"
          accept="image/*"
          aria-describedby="service-photo-hint"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            const ok = !file || isAcceptablePhoto(file);
            setPhotoError(!ok);
            setPhoto(ok ? file : null);
          }}
        />
        <p id="service-photo-hint" className={styles.muted}>
          {t.photoHint}
        </p>
        {photoError ? (
          <p className={styles.fieldError} role="alert">
            {t.photoTooLarge}
          </p>
        ) : null}
      </div>
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
