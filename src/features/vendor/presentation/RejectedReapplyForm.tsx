"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Routes } from "@/constants/routes";
import type { VendorProfile } from "@/features/auth/domain/types";
import { reapplyVendorSignupRequest } from "@/features/auth/infrastructure/vendor-reapply.service";
import {
  EMPTY_PROVIDER_TEXT_FIELDS,
  buildReapplyProviderProfile,
  providerProfileSchema,
  type ProviderProfile,
  type ProviderTextFields,
} from "@/features/vendor/domain/provider-profile-schema";
import {
  PROVIDER_FIELD_LIMITS,
  getProviderConfig,
  isKnownVendorType,
  type VendorType,
} from "@/features/vendor/domain/vendor-type-config";
import { ProviderFieldsInputs } from "@/features/vendor/presentation/ProviderFieldsInputs";
import { VendorTypePicker } from "@/features/vendor/presentation/VendorTypePicker";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import portalStyles from "./portal.module.css";
import styles from "./profile.module.css";

type RejectedReapplyFormProps = {
  profile: VendorProfile;
  /** Stored provider fields of the rejected request, used to prefill. */
  storedProviderProfile?: ProviderProfile;
};

export function RejectedReapplyForm({ profile, storedProviderProfile }: RejectedReapplyFormProps) {
  const strings = useStrings();
  const router = useRouter();
  const storedType = profile.vendorType;
  // null while the stored type is unknown and the applicant has not chosen one:
  // vendorType is then not sent, so the stored value is kept.
  const [chosenType, setChosenType] = useState<VendorType | null>(
    isKnownVendorType(storedType) ? storedType : null,
  );
  const effectiveType = chosenType ?? storedType;
  const [providerFields, setProviderFields] = useState<ProviderTextFields>(() => ({
    ...EMPTY_PROVIDER_TEXT_FIELDS,
    specialty: storedProviderProfile?.specialty ?? "",
    education: storedProviderProfile?.education ?? "",
    experience: storedProviderProfile?.experience ?? "",
  }));
  const typeStrings = strings.vendorTypes[getProviderConfig(effectiveType).type];
  const [ownerName, setOwnerName] = useState(profile.ownerName);
  const [storeName, setStoreName] = useState(profile.storeName);
  const [storeDescription, setStoreDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState(profile.email);
  const [contactAddress, setContactAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (
      effectiveType === "doctor" &&
      storeDescription.trim().length > PROVIDER_FIELD_LIMITS.doctorDescriptionMax
    ) {
      setError(strings.vendorTypes.errors.descriptionTooLong);
      return;
    }

    const providerProfile = buildReapplyProviderProfile(effectiveType, providerFields);
    if (providerProfile) {
      const checked = providerProfileSchema(effectiveType, "signup").safeParse(providerProfile);
      if (!checked.success) {
        const key = checked.error.issues[0]?.message as keyof typeof strings.vendorTypes.errors;
        setError(strings.vendorTypes.errors[key] ?? strings.accountStatus.reapplyError);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await reapplyVendorSignupRequest({
        ...(chosenType ? { vendorType: chosenType } : {}),
        ...(providerProfile ? { providerProfile } : {}),
        ownerName: ownerName.trim(),
        storeName: storeName.trim(),
        storeDescription: storeDescription.trim(),
        phone: phone.trim(),
        contactPhone: contactPhone.trim(),
        contactEmail: contactEmail.trim(),
        contactAddress: contactAddress.trim(),
        logoUrl: profile.logoUrl ?? null,
      });
      setSuccess(strings.accountStatus.reapplySuccess);
      router.replace(Routes.vendor.profile);
      router.refresh();
    } catch {
      setError(strings.accountStatus.reapplyError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className={portalStyles.panel} aria-labelledby="reapply-title">
      <h2 id="reapply-title" className={styles.panelTitle}>{strings.accountStatus.reapplyTitle}</h2>
      {error ? (
        <div className={`${styles.alert} ${styles.alertError}`} role="alert">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className={`${styles.alert} ${styles.alertSuccess}`} role="status">
          {success}
        </div>
      ) : null}
      <form className={styles.formStack} onSubmit={onSubmit}>
        <VendorTypePicker strings={strings} value={chosenType} onChange={setChosenType} />
        <label className={styles.field}>
          {strings.profile.fields.ownerName}
          <input
            required
            value={ownerName}
            onChange={(event) => setOwnerName(event.target.value)}
          />
        </label>
        <label className={styles.field}>
          {typeStrings.fields.storeName}
          <input
            required
            value={storeName}
            onChange={(event) => setStoreName(event.target.value)}
          />
        </label>
        <label className={styles.field}>
          {typeStrings.fields.storeDescription}
          <textarea
            required
            value={storeDescription}
            onChange={(event) => setStoreDescription(event.target.value)}
          />
        </label>
        <ProviderFieldsInputs
          strings={strings}
          vendorType={effectiveType}
          value={providerFields}
          onChange={setProviderFields}
          fieldClassName={styles.field}
        />
        <label className={styles.field}>
          {strings.profile.fields.phone}
          <input
            required
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </label>
        <label className={styles.field}>
          {strings.profile.fields.contactPhone}
          <input
            required
            value={contactPhone}
            onChange={(event) => setContactPhone(event.target.value)}
          />
        </label>
        <label className={styles.field}>
          {strings.profile.fields.contactEmail}
          <input
            required
            type="email"
            value={contactEmail}
            onChange={(event) => setContactEmail(event.target.value)}
          />
        </label>
        <label className={styles.field}>
          {strings.profile.fields.contactAddress}
          <input
            required
            value={contactAddress}
            onChange={(event) => setContactAddress(event.target.value)}
          />
        </label>
        <div className={styles.formActions}>
          <button type="submit" className={styles.btnPrimary} disabled={isSubmitting}>
            {isSubmitting
              ? strings.accountStatus.reapplySubmitting
              : strings.accountStatus.reapplySubmit}
          </button>
        </div>
      </form>
    </section>
  );
}
