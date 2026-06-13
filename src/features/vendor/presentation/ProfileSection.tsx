"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import { Strings } from "@/constants/strings";
import { uploadVendorLogo } from "@/features/auth/infrastructure/vendor-signup.service";
import type {
  VendorProfileChangePayload,
  VendorProfileChangeRequest,
  VendorStoreProfile,
} from "@/features/vendor/domain/types";
import {
  getPendingProfileChangeRequest,
  submitProfileChangeRequest,
} from "@/features/vendor/infrastructure/vendor-profile-change.repository";
import { getVendorStoreProfile } from "@/features/vendor/infrastructure/vendor-store-profile.repository";
import { AccountStatusBanner } from "@/features/vendor/presentation/AccountStatusBanner";
import { ProfileActiveSessionCard } from "@/features/vendor/presentation/ProfileActiveSessionCard";
import { usePortalSession } from "@/features/vendor/presentation/PortalSessionContext";
import { PortalContentSkeleton } from "@/features/vendor/presentation/PortalContentSkeleton";

import portalStyles from "./portal.module.css";
import styles from "./profile.module.css";

type ProfileChangeRequestFormProps = {
  profile: VendorStoreProfile;
  pendingChange: VendorProfileChangeRequest | null;
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

function validateForm(form: FormState): string | null {
  if (!form.ownerName.trim()) return Strings.profile.validation.ownerName;
  if (!form.phone.trim()) return Strings.profile.validation.phone;
  if (!form.storeName.trim()) return Strings.profile.validation.storeName;
  if (!form.storeDescription.trim()) {
    return Strings.profile.validation.storeDescription;
  }
  if (!form.contactPhone.trim()) return Strings.profile.validation.contactPhone;
  if (!form.contactEmail.trim()) return Strings.profile.validation.contactEmail;
  if (!form.contactAddress.trim()) return Strings.profile.validation.contactAddress;
  return null;
}

function ProfileChangeRequestForm({
  profile,
  pendingChange,
  disabled,
  onSubmitted,
}: ProfileChangeRequestFormProps) {
  const { user } = usePortalSession();
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
  }, [profile]);

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

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const validationError = validateForm(form);
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

      await submitProfileChangeRequest(profile.vendorId, user.uid, {
        ...form,
        logoUrl,
      });

      setSuccess(Strings.profile.changeRequestSuccess);
      await onSubmitted();
    } catch (submitError) {
      if (
        submitError instanceof Error &&
        submitError.message === "PENDING_CHANGE_EXISTS"
      ) {
        setError(Strings.profile.pendingChangeExists);
        return;
      }
      setError(Strings.profile.changeRequestError);
    } finally {
      setIsSubmitting(false);
    }
  }

  const isFormDisabled = disabled || pendingChange != null;

  return (
    <div className={portalStyles.panel}>
      <h3 className={styles.panelTitle}>{Strings.profile.requestChangesTitle}</h3>
      <p className={styles.readOnlyNote}>{Strings.profile.requestChangesHint}</p>

      {pendingChange ? (
        <div className={`${styles.alert} ${styles.alertInfo}`} role="status">
          {Strings.profile.pendingChangeBanner}
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
          {Strings.profile.fields.ownerName}
          <input
            type="text"
            value={form.ownerName}
            onChange={(event) => updateField("ownerName", event.target.value)}
            disabled={isFormDisabled || isSubmitting}
            required
          />
        </label>

        <label className={styles.field}>
          {Strings.profile.fields.signInEmail}
          <input type="email" value={profile.email} disabled readOnly />
          <span className={styles.readOnlyNote}>{Strings.profile.signInEmailNote}</span>
        </label>

        <label className={styles.field}>
          {Strings.profile.fields.phone}
          <input
            type="tel"
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            disabled={isFormDisabled || isSubmitting}
            required
          />
        </label>

        <label className={styles.field}>
          {Strings.profile.fields.storeName}
          <input
            type="text"
            value={form.storeName}
            onChange={(event) => updateField("storeName", event.target.value)}
            disabled={isFormDisabled || isSubmitting}
            required
          />
        </label>

        <label className={styles.field}>
          {Strings.profile.fields.storeDescription}
          <textarea
            rows={4}
            value={form.storeDescription}
            onChange={(event) => updateField("storeDescription", event.target.value)}
            disabled={isFormDisabled || isSubmitting}
            required
          />
        </label>

        <label className={styles.field}>
          {Strings.profile.fields.contactPhone}
          <input
            type="tel"
            value={form.contactPhone}
            onChange={(event) => updateField("contactPhone", event.target.value)}
            disabled={isFormDisabled || isSubmitting}
            required
          />
        </label>

        <label className={styles.field}>
          {Strings.profile.fields.contactEmail}
          <input
            type="email"
            value={form.contactEmail}
            onChange={(event) => updateField("contactEmail", event.target.value)}
            disabled={isFormDisabled || isSubmitting}
            required
          />
        </label>

        <label className={styles.field}>
          {Strings.profile.fields.contactAddress}
          <input
            type="text"
            value={form.contactAddress}
            onChange={(event) => updateField("contactAddress", event.target.value)}
            disabled={isFormDisabled || isSubmitting}
            required
          />
        </label>

        <label className={styles.field}>
          {Strings.profile.fields.logo}
          <label className={styles.uploadBox}>
            <input
              type="file"
              accept="image/*"
              disabled={isFormDisabled || isSubmitting}
              onChange={(event) => onLogoChange(event.target.files?.[0] ?? null)}
            />
            {Strings.profile.uploadLogo}
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
          ) : null}
        </label>

        <div className={styles.formActions}>
          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={isFormDisabled || isSubmitting}
          >
            {isSubmitting
              ? Strings.profile.submittingChangeRequest
              : Strings.profile.submitChangeRequest}
          </button>
        </div>
      </form>
    </div>
  );
}

type ProfileDetailsPanelProps = {
  profile: VendorStoreProfile;
};

function formatDate(value: Date | null | undefined): string {
  if (!value) return "—";
  return value.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function ProfileDetailsPanel({ profile }: ProfileDetailsPanelProps) {
  const rows: { label: string; value: string; block?: boolean }[] = [
    { label: Strings.profile.fields.ownerName, value: profile.ownerName },
    { label: Strings.profile.fields.signInEmail, value: profile.email },
    { label: Strings.profile.fields.phone, value: profile.phone || "—" },
    { label: Strings.profile.fields.storeName, value: profile.storeName },
    {
      label: Strings.profile.fields.storeDescription,
      value: profile.storeDescription || "—",
      block: true,
    },
    { label: Strings.profile.fields.contactPhone, value: profile.contactPhone || "—" },
    { label: Strings.profile.fields.contactEmail, value: profile.contactEmail || "—" },
    { label: Strings.profile.fields.contactAddress, value: profile.contactAddress || "—" },
    { label: Strings.profile.fields.updatedAt, value: formatDate(profile.updatedAt) },
  ];

  return (
    <div className={portalStyles.panel}>
      <h3 className={styles.panelTitle}>{Strings.profile.currentProfileTitle}</h3>

      {profile.logoUrl ? (
        <Image
          src={profile.logoUrl}
          alt=""
          width={88}
          height={88}
          className={styles.logoPreview}
          unoptimized
        />
      ) : (
        <div className={styles.logoPlaceholder}>{Strings.profile.noLogo}</div>
      )}

      <div className={styles.detailList}>
        {rows.map((row) => (
          <div
            key={row.label}
            className={`${styles.detailRow} ${row.block ? styles.detailRowBlock : ""}`}
          >
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfileSection() {
  const { user, profile, sessionKind } = usePortalSession();
  const [storeProfile, setStoreProfile] = useState<VendorStoreProfile | null>(null);
  const [pendingChange, setPendingChange] =
    useState<VendorProfileChangeRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setLoadError(null);

    const nextProfile = await getVendorStoreProfile(
      user.uid,
      user.email?.trim().toLowerCase() ?? "",
    );

    if (!nextProfile) {
      setLoadError(Strings.errors.generic);
      setIsLoading(false);
      return;
    }

    const pending = await getPendingProfileChangeRequest(nextProfile.vendorId);
    setStoreProfile(nextProfile);
    setPendingChange(pending);
    setIsLoading(false);
  }, [user.email, user.uid]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  if (isLoading) {
    return <PortalContentSkeleton />;
  }

  if (loadError || !storeProfile) {
    return (
      <div className={`${styles.alert} ${styles.alertError}`} role="alert">
        {loadError ?? Strings.errors.generic}
      </div>
    );
  }

  const isSuspended = sessionKind === "suspended";

  return (
    <>
      <AccountStatusBanner sessionKind={sessionKind} profile={profile} />

      <div className={styles.profileGrid}>
        <ProfileDetailsPanel profile={storeProfile} />
        <ProfileChangeRequestForm
          profile={storeProfile}
          pendingChange={pendingChange}
          disabled={isSuspended}
          onSubmitted={loadProfile}
        />
      </div>

      <ProfileActiveSessionCard />
    </>
  );
}
