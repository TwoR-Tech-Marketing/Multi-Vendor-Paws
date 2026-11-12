"use client";

import Image from "next/image";
import { useState } from "react";

import {
  providerPhotoOwner,
  submitVendorProfileChangeFromApi,
  uploadVendorProfileLogoFromApi,
  uploadVendorProviderPhotoFromApi,
  VendorProfileSubmitError,
} from "@/features/vendor/application/vendor-profile.api";
import {
  checkProviderPhotoFile,
  PROVIDER_PHOTOS_MAX,
  samePhotoList,
} from "@/features/vendor/domain/provider-photos";
import type {
  VendorProfileChangePayload,
  VendorProfileChangeRequest,
  VendorStoreProfile,
} from "@/features/vendor/domain/types";
import {
  buildProviderProfilePayload,
  providerProfileSchema,
  type ProviderTextFields,
} from "@/features/vendor/domain/provider-profile-schema";
import { getProviderConfig } from "@/features/vendor/domain/vendor-type-config";
import { ProviderFieldsInputs } from "@/features/vendor/presentation/ProviderFieldsInputs";
import {
  ProviderPhotoGrid,
  type ProviderPhotoItem,
} from "@/features/vendor/presentation/ProviderPhotoGrid";
import { ProviderPhotoList } from "@/features/vendor/presentation/ProviderPhotoList";
import type { AppStrings } from "@/shared/i18n/types";

import portalStyles from "@/features/vendor/presentation/portal.module.css";
import styles from "./profile.module.css";

type ProfileStoreFormProps = {
  strings: AppStrings;
  profile: VendorStoreProfile;
  pendingChange: VendorProfileChangeRequest | null;
  lastRejectedChange: VendorProfileChangeRequest | null;
  disabled: boolean;
  /** Why changes cannot be submitted, shown as a note when set. */
  lockedReason?: ProfileChangeLockReason | null;
  onSubmitted: () => Promise<void>;
};

export type ProfileChangeLockReason = "notApproved" | "suspended";

function lockMessage(reason: ProfileChangeLockReason, strings: AppStrings): string {
  return reason === "suspended"
    ? strings.profile.changeSuspended
    : strings.profile.changeAfterApproval;
}

function submitErrorMessage(
  error: unknown,
  strings: AppStrings,
  profile: VendorStoreProfile,
): string {
  if (!(error instanceof VendorProfileSubmitError)) return strings.profile.changeRequestError;
  switch (error.reason) {
    case "pending_exists":
      return strings.profile.pendingChangeExists;
    case "not_allowed":
      return lockMessage(profile.status === "suspended" ? "suspended" : "notApproved", strings);
    case "logo_too_large":
      return strings.profile.errors.logoTooLarge;
    case "photo_too_large":
      return strings.profile.errors.photoTooLarge;
    case "photo_type_not_allowed":
      return strings.profile.errors.photoTypeNotAllowed;
    default:
      return strings.profile.changeRequestError;
  }
}

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

function buildProviderFields(profile: VendorStoreProfile): ProviderTextFields {
  return {
    specialty: profile.providerProfile?.specialty ?? "",
    education: profile.providerProfile?.education ?? "",
    experience: profile.providerProfile?.experience ?? "",
  };
}

function storedPhotoUrls(profile: VendorStoreProfile): string[] {
  const urls = profile.providerProfile?.photoUrls;
  return Array.isArray(urls) ? urls : [];
}

function buildPhotoItems(profile: VendorStoreProfile): ProviderPhotoItem[] {
  return storedPhotoUrls(profile).map((url) => ({ id: url, url }));
}

let nextPhotoId = 0;

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
  lockedReason = null,
  onSubmitted,
}: ProfileStoreFormProps) {
  const t = strings.profile;
  const providerConfig = getProviderConfig(profile.vendorType);
  const typeStrings = strings.vendorTypes[providerConfig.type];
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<FormState>(() => buildFormState(profile));
  const [providerFields, setProviderFields] = useState<ProviderTextFields>(() =>
    buildProviderFields(profile),
  );
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(profile.logoUrl);
  const supportsPhotos = providerConfig.providerFields.includes("photoUrls");
  const [photos, setPhotos] = useState<ProviderPhotoItem[]>(() => buildPhotoItems(profile));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formSource, setFormSource] = useState({ profile, pendingId: pendingChange?.id });
  if (formSource.profile !== profile || formSource.pendingId !== pendingChange?.id) {
    setFormSource({ profile, pendingId: pendingChange?.id });
    setForm(buildFormState(profile));
    setProviderFields(buildProviderFields(profile));
    setLogoPreview(profile.logoUrl);
    setLogoFile(null);
    setPhotos(buildPhotoItems(profile));
    setIsEditing(false);
  }

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

  function onPhotosAdded(files: File[]) {
    setError(null);
    const added: ProviderPhotoItem[] = [];
    let issue: string | null = null;
    for (const file of files) {
      const fileIssue = checkProviderPhotoFile(file);
      if (fileIssue) {
        issue = strings.profile.errors[fileIssue];
        continue;
      }
      if (photos.length + added.length >= PROVIDER_PHOTOS_MAX) {
        issue = t.photos.limitReached.replace("{max}", String(PROVIDER_PHOTOS_MAX));
        break;
      }
      nextPhotoId += 1;
      added.push({ id: `new-${nextPhotoId}`, url: URL.createObjectURL(file), file });
    }
    if (issue) setError(issue);
    if (added.length) setPhotos((current) => [...current, ...added]);
  }

  function onPhotoRemoved(id: string) {
    setPhotos((current) => {
      const removed = current.find((item) => item.id === id);
      if (removed?.file) URL.revokeObjectURL(removed.url);
      return current.filter((item) => item.id !== id);
    });
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
    setProviderFields(buildProviderFields(profile));
    setLogoPreview(profile.logoUrl);
    setLogoFile(null);
    setPhotos(buildPhotoItems(profile));
    setIsEditing(false);
  }

  /** Uploads picked files in order; the full list when it changed, else undefined. */
  async function resolvePhotoUrls(): Promise<string[] | undefined> {
    if (!supportsPhotos) return undefined;
    const urls: string[] = [];
    for (const item of photos) {
      urls.push(
        item.file
          ? await uploadVendorProviderPhotoFromApi(profile.vendorId, item.file)
          : item.url,
      );
    }
    return samePhotoList(urls, storedPhotoUrls(profile)) ? undefined : urls;
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

    const providerProfile = buildProviderProfilePayload(
      profile.vendorType,
      providerFields,
      true,
    );
    const checkedProvider = providerProfile
      ? providerProfileSchema(profile.vendorType, "change").safeParse(providerProfile)
      : null;
    if (checkedProvider && !checkedProvider.success) {
      const key = checkedProvider.error.issues[0]?.message as keyof typeof strings.vendorTypes.errors;
      setError(strings.vendorTypes.errors[key] ?? t.changeRequestError);
      return;
    }

    setIsSubmitting(true);

    try {
      let logoUrl = form.logoUrl ?? null;
      if (logoFile) {
        logoUrl = await uploadVendorProfileLogoFromApi(profile.vendorId, logoFile);
      }

      const photoUrls = await resolvePhotoUrls();
      let nextProvider = checkedProvider?.success ? checkedProvider.data : undefined;
      if (photoUrls) {
        const checkedPhotos = providerProfileSchema(
          profile.vendorType,
          "change",
          providerPhotoOwner(profile.vendorId, storedPhotoUrls(profile)),
        ).safeParse({ photoUrls });
        if (!checkedPhotos.success) {
          setError(strings.vendorTypes.errors.photoUrlsInvalid);
          return;
        }
        nextProvider = { ...nextProvider, photoUrls };
      }

      await submitVendorProfileChangeFromApi({
        ...form,
        logoUrl,
        ...(nextProvider ? { providerProfile: nextProvider } : {}),
      });

      setSuccess(t.changeRequestSuccess);
      setIsEditing(false);
      await onSubmitted();
    } catch (submitError) {
      setError(submitErrorMessage(submitError, strings, profile));
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

      {lockedReason && !isPending ? (
        <div className={`${styles.alert} ${styles.alertInfo}`} role="status">
          {lockMessage(lockedReason, strings)}
        </div>
      ) : null}

      {isPending ? (
        <div className={`${styles.alert} ${styles.alertInfo}`} role="status">
          {t.pendingChangeBanner}
        </div>
      ) : null}

      {isPending && supportsPhotos && Array.isArray(pendingChange.providerProfile?.photoUrls) ? (
        <ProviderPhotoList
          strings={strings}
          title={t.photos.proposedTitle}
          urls={pendingChange.providerProfile.photoUrls}
        />
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
        {providerConfig.type === "store" ? null : (
          <label className={styles.field}>
            {strings.vendorTypes.profileRow}
            <input type="text" value={typeStrings.label} disabled readOnly />
          </label>
        )}

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
          {typeStrings.fields.storeName}
          <input
            type="text"
            value={form.storeName}
            onChange={(event) => updateField("storeName", event.target.value)}
            disabled={fieldsDisabled}
            required
          />
        </label>

        <label className={styles.field}>
          {typeStrings.fields.storeDescription}
          <textarea
            rows={4}
            value={form.storeDescription}
            onChange={(event) => updateField("storeDescription", event.target.value)}
            disabled={fieldsDisabled}
            required
          />
        </label>

        <ProviderFieldsInputs
          strings={strings}
          vendorType={profile.vendorType}
          value={providerFields}
          onChange={setProviderFields}
          fieldClassName={styles.field}
          disabled={fieldsDisabled}
        />

        {supportsPhotos ? (
          <ProviderPhotoGrid
            strings={strings}
            items={photos}
            max={PROVIDER_PHOTOS_MAX}
            disabled={fieldsDisabled}
            onAdd={onPhotosAdded}
            onRemove={onPhotoRemoved}
          />
        ) : null}

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
          {typeStrings.fields.logoUrl}
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
