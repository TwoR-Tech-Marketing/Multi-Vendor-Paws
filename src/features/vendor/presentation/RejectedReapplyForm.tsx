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
  type ProviderTextFields,
} from "@/features/vendor/domain/provider-profile-schema";
import {
  isKnownVendorType,
  type VendorType,
} from "@/features/vendor/domain/vendor-type-config";
import { ProviderFieldsInputs } from "@/features/vendor/presentation/ProviderFieldsInputs";
import { VendorTypePicker } from "@/features/vendor/presentation/VendorTypePicker";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./profile.module.css";

type RejectedReapplyFormProps = {
  profile: VendorProfile;
};

export function RejectedReapplyForm({ profile }: RejectedReapplyFormProps) {
  const strings = useStrings();
  const router = useRouter();
  const storedType = profile.vendorType;
  const [vendorType, setVendorType] = useState<VendorType>(
    isKnownVendorType(storedType) ? storedType : "store",
  );
  const [providerFields, setProviderFields] = useState<ProviderTextFields>(
    EMPTY_PROVIDER_TEXT_FIELDS,
  );
  const typeStrings = strings.vendorTypes[vendorType];
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

    const providerProfile = buildReapplyProviderProfile(storedType, vendorType, providerFields);
    if (providerProfile) {
      const checked = providerProfileSchema(vendorType, "signup").safeParse(providerProfile);
      if (!checked.success) {
        const key = checked.error.issues[0]?.message as keyof typeof strings.vendorTypes.errors;
        setError(strings.vendorTypes.errors[key] ?? strings.accountStatus.reapplyError);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await reapplyVendorSignupRequest({
        vendorType,
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
    <section>
      <h2 className={styles.panelTitle}>{strings.accountStatus.reapplyTitle}</h2>
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
        <VendorTypePicker strings={strings} value={vendorType} onChange={setVendorType} />
        <label>
          {strings.profile.fields.ownerName}
          <input
            required
            value={ownerName}
            onChange={(event) => setOwnerName(event.target.value)}
          />
        </label>
        <label>
          {typeStrings.fields.storeName}
          <input
            required
            value={storeName}
            onChange={(event) => setStoreName(event.target.value)}
          />
        </label>
        <label>
          {typeStrings.fields.storeDescription}
          <textarea
            required
            value={storeDescription}
            onChange={(event) => setStoreDescription(event.target.value)}
          />
        </label>
        <ProviderFieldsInputs
          strings={strings}
          vendorType={vendorType}
          value={providerFields}
          onChange={setProviderFields}
        />
        <label>
          {strings.profile.fields.phone}
          <input
            required
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </label>
        <label>
          {strings.profile.fields.contactPhone}
          <input
            required
            value={contactPhone}
            onChange={(event) => setContactPhone(event.target.value)}
          />
        </label>
        <label>
          {strings.profile.fields.contactEmail}
          <input
            required
            type="email"
            value={contactEmail}
            onChange={(event) => setContactEmail(event.target.value)}
          />
        </label>
        <label>
          {strings.profile.fields.contactAddress}
          <input
            required
            value={contactAddress}
            onChange={(event) => setContactAddress(event.target.value)}
          />
        </label>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? strings.accountStatus.reapplySubmitting
            : strings.accountStatus.reapplySubmit}
        </button>
      </form>
    </section>
  );
}
