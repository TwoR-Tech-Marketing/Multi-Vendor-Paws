"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { submitVendorProfileChangeFromApi } from "@/features/vendor/application/vendor-profile.api";
import type {
  VendorProfileChangePayload,
  VendorProfileChangeRequest,
  VendorStoreProfile,
} from "@/features/vendor/domain/types";
import { uploadVendorLogo } from "@/features/auth/infrastructure/vendor-signup.service";
import type { AppStrings } from "@/shared/i18n/types";
import { ApiClientError } from "@/lib/auth-client";

import portalStyles from "@/features/vendor/presentation/portal.module.css";
import styles from "./profile.module.css";

type ProfileStoreFormProps = {
  strings: AppStrings;
  profile: VendorStoreProfile;
  pendingChange: VendorProfileChangeRequest | null;
  lastRejectedChange: VendorProfileChangeRequest | null;
  disabled: boolean;
  onSubmitted: () => Promise<void>;
};

type FormState = VendorProfileChangePayload;

function buildFormState(profile: VendorStoreProfile): FormState {
  return {
    ownerName: profile.ownerName,
    phone: profile.phone,
    storeName: profile.storeName,
    storeDescription: profile.storeDescription,
    contactPhone: profile.contactPhone,
    contactEmail: profile.contactEmail,
    contactAddress: profile.contactAddress,
    logoUrl: profile.logoUrl,
  };
}

function validateForm(form: FormState, strings: AppStrings): string | null {
  if (!form.ownerName.trim()) return strings.profile.validation.ownerName;
  if (!form.phone.trim()) return strings.profile.validation.phone;
  if (!form.storeName.trim()) return strings.profile.validation.storeName;
  if (!form.storeDescription.trim()) {
    return strings.profile.validation.storeDescription;
  }
  if (!form.contactPhone.trim()) return strings.profile.validation.contactPhone;
  if (!form.contactEmail.trim()) return strings.profile.validation.contactEmail;
  if (!form.contactAddress.trim()) return strings.profile.validation.contactAddress;
  return null;
}

export function ProfileStoreForm({
  strings,
  profile,
  pendingChange,
  lastRejectedChange,
  disabled,
  onSubmitted,
}: ProfileStoreFormProps) {
  const t = strings.profile;
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<FormState>(() => buildFormState(profile));
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(profile.logoUrl);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setForm(buildFormState(profile));
    setLogoPreview(profile.logoUrl);
    setLogoFile(null);
    setIsEditing(false);
  }, [profile, pendingChange?.id]);

  const isPending = pendingChange != null;
  const fieldsDisabled = disabled || isPending || !isEditing || isSubmitting;

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function onLogoChange(file: File | null) {
    setLogoFile(file);
    if (!file) {
      setLogoPreview(profile.logoUrl);
      return;
    }
    setLogoPreview(URL.createObjectURL(file));
  }

  function startEditing() {
    setError(null);
    setSuccess(null);
    setIsEditing(true);
  }

  function cancelEditing() {
    setError(null);
    setSuccess(null);
    setForm(buildFormState(profile));
    setLogoPreview(profile.logoUrl);
    setLogoFile(null);
    setIsEditing(false);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const validationError = validateForm(form, strings);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      let logoUrl = form.logoUrl ?? null;
      if (logoFile) {
        logoUrl = await uploadVendorLogo(logoFile);
      }

      await submitVendorProfileChangeFromApi({
        ...form,
        logoUrl,
      });

      setSuccess(t.changeRequestSuccess);
      setIsEditing(false);
      await onSubmitted();
    } catch (submitError) {
      if (submitError instanceof ApiClientError && submitError.status === 409) {
        setError(t.pendingChangeExists);
        return;
      }
      setError(t.changeRequestError);
    } finally {
      setIsSubmitting(false);
    }
  }

  const rejectedMessage = lastRejectedChange?.reviewNotes
    ? t.rejectedChangeBanner.replace("{reason}", lastRejectedChange.reviewNotes)
    : lastRejectedChange
      ? t.rejectedChangeBannerNoReason
      : null;

  return (
    <div className={portalStyles.panel}>
      <h3 className={styles.panelTitle}>{t.currentProfileTitle}</h3>
      <p className={styles.readOnlyNote}>{t.requestChangesHint}</p>

      {isPending ? (
        <div className={`${styles.alert} ${styles.alertInfo}`} role="status">
          {t.pendingChangeBanner}
        </div>
      ) : null}

      {!isPending && rejectedMessage ? (
        <div className={`${styles.alert} ${styles.alertWarning}`} role="status">
          {rejectedMessage}
        </div>
      ) : null}

      {success ? (
        <div className={`${styles.alert} ${styles.alertSuccess}`} role="status">
          {success}
        </div>
      ) : null}

      {error ? (
        <div className={`${styles.alert} ${styles.alertError}`} role="alert">
          {error}
        </div>
      ) : null}

      <form className={styles.formStack} onSubmit={onSubmit}>
        <label className={styles.field}>
          {t.fields.ownerName}
          <input
            type="text"
            value={form.ownerName}
            onChange={(event) => updateField("ownerName", event.target.value)}
            disabled={fieldsDisabled}
            required
          />
        </label>

        <label className={styles.field}>
          {t.fields.signInEmail}
          <input type="email" value={profile.email} disabled readOnly />
          <span className={styles.readOnlyNote}>{t.signInEmailNote}</span>
        </label>

        <label className={styles.field}>
          {t.fields.phone}
          <input
            type="tel"
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            disabled={fieldsDisabled}
            required
          />
        </label>

        <label className={styles.field}>
          {t.fields.storeName}
          <input
            type="text"
            value={form.storeName}
            onChange={(event) => updateField("storeName", event.target.value)}
            disabled={fieldsDisabled}
            required
          />
        </label>

        <label className={styles.field}>
          {t.fields.storeDescription}
          <textarea
            rows={4}
            value={form.storeDescription}
            onChange={(event) => updateField("storeDescription", event.target.value)}
            disabled={fieldsDisabled}
            required
          />
        </label>

        <label className={styles.field}>
          {t.fields.contactPhone}
          <input
            type="tel"
            value={form.contactPhone}
            onChange={(event) => updateField("contactPhone", event.target.value)}
            disabled={fieldsDisabled}
            required
          />
        </label>

        <label className={styles.field}>
          {t.fields.contactEmail}
          <input
            type="email"
            value={form.contactEmail}
            onChange={(event) => updateField("contactEmail", event.target.value)}
            disabled={fieldsDisabled}
            required
          />
        </label>

        <label className={styles.field}>
          {t.fields.contactAddress}
          <input
            type="text"
            value={form.contactAddress}
            onChange={(event) => updateField("contactAddress", event.target.value)}
            disabled={fieldsDisabled}
            required
          />
        </label>

        <label className={styles.field}>
          {t.fields.logo}
          <label className={`${styles.uploadBox} ${fieldsDisabled ? styles.uploadBoxDisabled : ""}`}>
            <input
              type="file"
              accept="image/*"
              disabled={fieldsDisabled}
              onChange={(event) => onLogoChange(event.target.files?.[0] ?? null)}
            />
            {t.uploadLogo}
          </label>
          {logoPreview ? (
            <Image
              src={logoPreview}
              alt=""
              width={88}
              height={88}
              className={styles.logoPreview}
              unoptimized
            />
          ) : (
            <div className={styles.logoPlaceholder}>{t.noLogo}</div>
          )}
        </label>

        <div className={styles.formActions}>
          {isPending || disabled ? null : !isEditing ? (
            <button type="button" className={styles.btnPrimary} onClick={startEditing}>
              {t.requestChangesCta}
            </button>
          ) : (
            <>
              <button type="submit" className={styles.btnPrimary} disabled={isSubmitting}>
                {isSubmitting ? t.submittingChangeRequest : t.submitChangeRequest}
              </button>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={cancelEditing}
                disabled={isSubmitting}
              >
                {t.cancelChanges}
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
