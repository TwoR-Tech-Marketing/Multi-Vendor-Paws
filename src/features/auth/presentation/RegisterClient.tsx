"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { VendorSignupPayload } from "@/features/auth/domain/types";
import {
  accountStepError,
  contactStepError,
  logoFileError,
  signupSubmitError,
  type RegisterError,
} from "@/features/auth/domain/register-errors";
import { signupBusinessSchema } from "@/features/auth/domain/signup-schema";
import {
  EMPTY_PROVIDER_TEXT_FIELDS,
  buildProviderProfilePayload,
  type ProviderTextFields,
} from "@/features/vendor/domain/provider-profile-schema";
import type { VendorType } from "@/features/vendor/domain/vendor-type-config";
import { ProviderFieldsInputs } from "@/features/vendor/presentation/ProviderFieldsInputs";
import { VendorTypePicker } from "@/features/vendor/presentation/VendorTypePicker";
import { useStrings } from "@/shared/preferences/PreferencesContext";
import { Routes } from "@/constants/routes";
import {
  submitVendorSignupRequest,
  uploadSignupLogo,
} from "@/features/auth/infrastructure/vendor-signup.service";
import { PawlioLogo } from "@/shared/components/PawlioLogo";
import { RegisterErrorAlert } from "./RegisterErrorAlert";
import styles from "./auth.module.css";

type FormState = Omit<VendorSignupPayload, "logoUrl" | "vendorType" | "providerProfile"> & {
  confirmPassword: string;
};

const initialForm: FormState = {
  ownerName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  storeName: "",
  storeDescription: "",
  contactPhone: "",
  contactEmail: "",
  contactAddress: "",
};

export function RegisterClient() {
  const router = useRouter();
  const strings = useStrings();
  const [step, setStep] = useState(1);
  const [vendorType, setVendorType] = useState<VendorType>("store");
  const [providerFields, setProviderFields] = useState<ProviderTextFields>(
    EMPTY_PROVIDER_TEXT_FIELDS,
  );
  const typeStrings = strings.vendorTypes[vendorType];
  const [form, setForm] = useState<FormState>(initialForm);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<RegisterError | null>(null);
  const signupStrings = strings.signup;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const businessInput = useMemo(
    () => ({
      vendorType,
      storeName: form.storeName,
      storeDescription: form.storeDescription,
      providerProfile: buildProviderProfilePayload(vendorType, providerFields),
    }),
    [vendorType, form.storeName, form.storeDescription, providerFields],
  );

  const reviewRows = useMemo(() => {
    const providerLabels = strings.vendorTypes.providerFields;
    const providerRows = Object.entries(businessInput.providerProfile ?? {})
      .filter(([, value]) => value.trim())
      .map(([key, value]) => [providerLabels[key as keyof ProviderTextFields], value]);
    return [
      [strings.vendorTypes.title, typeStrings.label],
      [strings.signup.fields.ownerName, form.ownerName],
      [strings.signup.fields.email, form.email],
      [strings.signup.fields.phone, form.phone],
      [typeStrings.fields.storeName, form.storeName],
      [typeStrings.fields.storeDescription, form.storeDescription],
      ...providerRows,
      [strings.signup.fields.contactPhone, form.contactPhone],
      [strings.signup.fields.contactEmail, form.contactEmail],
      [strings.signup.fields.contactAddress, form.contactAddress],
    ];
  }, [form, businessInput, strings, typeStrings]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validateStep2(): RegisterError | null {
    const result = signupBusinessSchema.safeParse(businessInput);
    if (!result.success) {
      return { source: "vendorType", key: result.error.issues[0]?.message ?? "" };
    }
    return contactStepError(form);
  }

  function onLogoChange(file: File | null) {
    const fileError = file ? logoFileError(file) : null;
    if (fileError) {
      setError(fileError);
      return;
    }
    setLogoFile(file);
    if (!file) {
      setLogoPreview(null);
      return;
    }
    setLogoPreview(URL.createObjectURL(file));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!acceptedTerms) {
      setError({ source: "terms" });
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      let logoUrl: string | null = null;
      if (logoFile) {
        logoUrl = await uploadSignupLogo(logoFile);
      }

      const business = signupBusinessSchema.parse(businessInput);
      await submitVendorSignupRequest({
        ownerName: form.ownerName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        storeName: form.storeName.trim(),
        storeDescription: form.storeDescription.trim(),
        contactPhone: form.contactPhone.trim(),
        contactEmail: form.contactEmail.trim(),
        contactAddress: form.contactAddress.trim(),
        logoUrl,
        vendorType: business.vendorType,
        ...(business.providerProfile ? { providerProfile: business.providerProfile } : {}),
      });

      router.replace(`${Routes.auth.login}?submitted=1`);
    } catch (submitError) {
      setError(signupSubmitError(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={`${styles.card} ${styles.cardWide}`}>
        <div className={styles.brand}>
          <PawlioLogo className={styles.logoMark} />
          <h2>{signupStrings.title}</h2>
          <p>{signupStrings.subtitle}</p>
        </div>

        <div className={styles.steps}>
          {[1, 2, 3].map((value) => (
            <div
              key={value}
              className={`${styles.step} ${
                step === value
                  ? styles.stepActive
                  : step > value
                    ? styles.stepDone
                    : ""
              }`}
            >
              <span>{value}</span>
              {value === 1
                ? signupStrings.steps.account
                : value === 2
                  ? signupStrings.steps.business
                  : signupStrings.steps.review}
            </div>
          ))}
        </div>

        <RegisterErrorAlert error={error} />

        <form onSubmit={onSubmit}>
          {step === 1 ? (
            <>
              <h3 className={styles.panelTitle}>{signupStrings.sections.account}</h3>
              <div className={styles.formGrid}>
                <label className={`${styles.field} ${styles.span2}`}>
                  {signupStrings.fields.ownerName} *
                  <input
                    required
                    minLength={2}
                    value={form.ownerName}
                    onChange={(e) => updateField("ownerName", e.target.value)}
                    placeholder={signupStrings.placeholders.ownerName}
                  />
                </label>
                <label className={styles.field}>
                  {signupStrings.fields.email} *
                  <input
                    type="email"
                    required
                    autoComplete="username email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder={signupStrings.placeholders.email}
                  />
                  <span className={styles.fieldHint}>
                    {signupStrings.hints.email}
                  </span>
                </label>
                <label className={styles.field}>
                  {signupStrings.fields.phone} *
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder={signupStrings.placeholders.phone}
                  />
                </label>
                <label className={styles.field}>
                  {signupStrings.fields.password} *
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    placeholder={signupStrings.placeholders.password}
                  />
                </label>
                <label className={styles.field}>
                  {signupStrings.fields.confirmPassword} *
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={(e) => updateField("confirmPassword", e.target.value)}
                    placeholder={signupStrings.placeholders.confirmPassword}
                  />
                </label>
              </div>
              <div className={styles.actions}>
                <Link href="/" className={styles.btnSecondary}>
                  {strings.common.cancel}
                </Link>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={() => {
                    const validationError = accountStepError(form);
                    if (validationError) {
                      setError(validationError);
                      return;
                    }
                    setError(null);
                    setStep(2);
                  }}
                >
                  {signupStrings.continue}
                </button>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <h3 className={styles.panelTitle}>{signupStrings.sections.business}</h3>
              <VendorTypePicker strings={strings} value={vendorType} onChange={setVendorType} />
              <div className={styles.formGrid}>
                <label className={`${styles.field} ${styles.span2}`}>
                  {typeStrings.fields.storeName} *
                  <input
                    required
                    value={form.storeName}
                    onChange={(e) => updateField("storeName", e.target.value)}
                    placeholder={typeStrings.placeholders.storeName}
                  />
                </label>
                <label className={`${styles.field} ${styles.span2}`}>
                  {typeStrings.fields.storeDescription} *
                  <textarea
                    rows={3}
                    required
                    value={form.storeDescription}
                    onChange={(e) => updateField("storeDescription", e.target.value)}
                    placeholder={typeStrings.placeholders.storeDescription}
                  />
                </label>
                <ProviderFieldsInputs
                  strings={strings}
                  vendorType={vendorType}
                  value={providerFields}
                  onChange={setProviderFields}
                  fieldClassName={`${styles.field} ${styles.span2}`}
                />
                <div className={styles.field}>
                  {typeStrings.fields.logoUrl}
                  <label className={styles.uploadBox}>
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => onLogoChange(e.target.files?.[0] ?? null)}
                    />
                    {signupStrings.logoUpload}
                  </label>
                  {logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoPreview} alt={signupStrings.logoPreviewAlt} className={styles.logoPreview} />
                  ) : null}
                </div>
                <label className={styles.field}>
                  {signupStrings.fields.contactAddress} *
                  <input
                    required
                    value={form.contactAddress}
                    onChange={(e) => updateField("contactAddress", e.target.value)}
                    placeholder={signupStrings.placeholders.contactAddress}
                  />
                </label>
                <label className={styles.field}>
                  {signupStrings.fields.contactPhone} *
                  <input
                    type="tel"
                    required
                    value={form.contactPhone}
                    onChange={(e) => updateField("contactPhone", e.target.value)}
                    placeholder={signupStrings.placeholders.phone}
                  />
                </label>
                <label className={styles.field}>
                  {signupStrings.fields.contactEmail} *
                  <input
                    type="email"
                    required
                    autoComplete="off"
                    value={form.contactEmail}
                    onChange={(e) => updateField("contactEmail", e.target.value)}
                    placeholder={signupStrings.placeholders.contactEmail}
                  />
                  <span className={styles.fieldHint}>
                    {signupStrings.hints.contactEmail}
                  </span>
                </label>
              </div>
              <div className={styles.actions}>
                <button type="button" className={styles.btnSecondary} onClick={() => setStep(1)}>
                  {signupStrings.back}
                </button>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={() => {
                    const validationError = validateStep2();
                    if (validationError) {
                      setError(validationError);
                      return;
                    }
                    setError(null);
                    setStep(3);
                  }}
                >
                  {signupStrings.reviewApplication}
                </button>
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <h3 className={styles.panelTitle}>{signupStrings.sections.review}</h3>
              <div className={styles.reviewGrid}>
                {reviewRows.map(([label, value]) => (
                  <div key={label} className={styles.reviewRow}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
              <label className={`${styles.field} ${styles.checkbox}`}>
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  required
                />
                {signupStrings.terms}
              </label>
              <div className={styles.actions}>
                <button type="button" className={styles.btnSecondary} onClick={() => setStep(2)}>
                  {signupStrings.back}
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={isSubmitting}>
                  {isSubmitting ? signupStrings.submitting : signupStrings.submit}
                </button>
              </div>
            </>
          ) : null}
        </form>
      </section>
    </main>
  );
}
