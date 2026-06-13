"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { VendorSignupPayload } from "@/features/auth/domain/types";
import { mapAuthError } from "@/features/auth/domain/errors";
import { Routes } from "@/constants/routes";
import {
  submitVendorSignupRequest,
  uploadVendorLogo,
} from "@/features/auth/infrastructure/vendor-signup.service";
import { PawlioLogo } from "@/shared/components/PawlioLogo";
import styles from "./auth.module.css";

type FormState = Omit<VendorSignupPayload, "logoUrl"> & {
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
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reviewRows = useMemo(
    () => [
      ["Owner", form.ownerName],
      ["Sign-in email", form.email],
      ["Phone", form.phone],
      ["Store", form.storeName],
      ["Description", form.storeDescription],
      ["Contact phone", form.contactPhone],
      ["Store contact email", form.contactEmail],
      ["Address", form.contactAddress],
    ],
    [form],
  );

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validateStep1(): string | null {
    if (form.password.length < 8) return "Password must be at least 8 characters.";
    if (form.password !== form.confirmPassword) return "Passwords do not match.";
    return null;
  }

  function validateStep2(): string | null {
    if (!form.storeName.trim() || !form.storeDescription.trim()) {
      return "Store name and description are required.";
    }
    return null;
  }

  function onLogoChange(file: File | null) {
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
      setError("Please accept the vendor terms to continue.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      let logoUrl: string | null = null;
      if (logoFile) {
        logoUrl = await uploadVendorLogo(logoFile);
      }

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
      });

      router.replace(`${Routes.auth.login}?submitted=1`);
    } catch (submitError) {
      setError(mapAuthError(submitError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={`${styles.card} ${styles.cardWide}`}>
        <div className={styles.brand}>
          <PawlioLogo className={styles.logoMark} />
          <h2>Become a Pawlio vendor</h2>
          <p>
            Complete all steps. Your store will be reviewed before activation.
          </p>
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
              {value === 1 ? "Account" : value === 2 ? "Store" : "Review"}
            </div>
          ))}
        </div>

        {error ? (
          <div className={`${styles.alert} ${styles.alertError}`} role="alert">
            {error}
          </div>
        ) : null}

        <form onSubmit={onSubmit}>
          {step === 1 ? (
            <>
              <h3 className={styles.panelTitle}>Account details</h3>
              <div className={styles.formGrid}>
                <label className={`${styles.field} ${styles.span2}`}>
                  Owner full name *
                  <input
                    required
                    minLength={2}
                    value={form.ownerName}
                    onChange={(e) => updateField("ownerName", e.target.value)}
                    placeholder="Ahmed Hassan"
                  />
                </label>
                <label className={styles.field}>
                  Business email (sign-in) *
                  <input
                    type="email"
                    required
                    autoComplete="username email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="vendor@store.com"
                  />
                  <span className={styles.fieldHint}>
                    Use this email and password to sign in after admin approval.
                  </span>
                </label>
                <label className={styles.field}>
                  Mobile phone *
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="+20 10x xxx xxxx"
                  />
                </label>
                <label className={styles.field}>
                  Password *
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    placeholder="Min. 8 characters"
                  />
                </label>
                <label className={styles.field}>
                  Confirm password *
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={(e) => updateField("confirmPassword", e.target.value)}
                    placeholder="Repeat password"
                  />
                </label>
              </div>
              <div className={styles.actions}>
                <Link href="/" className={styles.btnSecondary}>
                  Cancel
                </Link>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={() => {
                    const validationError = validateStep1();
                    if (validationError) {
                      setError(validationError);
                      return;
                    }
                    setError(null);
                    setStep(2);
                  }}
                >
                  Continue to store setup
                </button>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <h3 className={styles.panelTitle}>Store profile</h3>
              <div className={styles.formGrid}>
                <label className={`${styles.field} ${styles.span2}`}>
                  Store name *
                  <input
                    required
                    value={form.storeName}
                    onChange={(e) => updateField("storeName", e.target.value)}
                    placeholder="Happy Tails Hub"
                  />
                </label>
                <label className={`${styles.field} ${styles.span2}`}>
                  Store description *
                  <textarea
                    rows={3}
                    required
                    value={form.storeDescription}
                    onChange={(e) => updateField("storeDescription", e.target.value)}
                    placeholder="What products do you sell?"
                  />
                </label>
                <div className={styles.field}>
                  Store logo
                  <label className={styles.uploadBox}>
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => onLogoChange(e.target.files?.[0] ?? null)}
                    />
                    Click to upload logo
                  </label>
                  {logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoPreview} alt="Logo preview" className={styles.logoPreview} />
                  ) : null}
                </div>
                <label className={styles.field}>
                  Business address *
                  <input
                    required
                    value={form.contactAddress}
                    onChange={(e) => updateField("contactAddress", e.target.value)}
                    placeholder="City, area, street"
                  />
                </label>
                <label className={styles.field}>
                  Contact phone *
                  <input
                    type="tel"
                    required
                    value={form.contactPhone}
                    onChange={(e) => updateField("contactPhone", e.target.value)}
                    placeholder="+20 10x xxx xxxx"
                  />
                </label>
                <label className={styles.field}>
                  Store contact email *
                  <input
                    type="email"
                    required
                    autoComplete="off"
                    value={form.contactEmail}
                    onChange={(e) => updateField("contactEmail", e.target.value)}
                    placeholder="contact@store.com"
                  />
                  <span className={styles.fieldHint}>
                    Shown to customers on your store profile — not used to sign in.
                  </span>
                </label>
              </div>
              <div className={styles.actions}>
                <button type="button" className={styles.btnSecondary} onClick={() => setStep(1)}>
                  Back
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
                  Review application
                </button>
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <h3 className={styles.panelTitle}>Review &amp; submit</h3>
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
                I confirm the information is accurate and agree to Pawlio vendor terms.
              </label>
              <div className={styles.actions}>
                <button type="button" className={styles.btnSecondary} onClick={() => setStep(2)}>
                  Back
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit for admin approval"}
                </button>
              </div>
            </>
          ) : null}
        </form>
      </section>
    </main>
  );
}
