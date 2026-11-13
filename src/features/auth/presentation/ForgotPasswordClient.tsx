"use client";

import Link from "next/link";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";

import { firebaseAuth } from "@/lib/firebase";
import { Routes } from "@/constants/routes";
import { PawlioLogo } from "@/shared/components/PawlioLogo";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import { authErrorMessage } from "./auth-copy";
import styles from "./auth.module.css";

export function ForgotPasswordClient() {
  const strings = useStrings();
  const t = strings.auth;
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      await sendPasswordResetEmail(firebaseAuth, email.trim());
      setMessage(t.resetSent);
    } catch (resetError) {
      setError(authErrorMessage(resetError, strings));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.brand}>
          <PawlioLogo className={styles.logoMark} />
          <h1>{t.resetTitle}</h1>
          <p>{t.resetSubtitle}</p>
        </div>

        {message ? (
          <div className={`${styles.alert} ${styles.alertSuccess}`} role="status">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className={`${styles.alert} ${styles.alertError}`} role="alert">
            {error}
          </div>
        ) : null}

        <form className={styles.formStack} onSubmit={onSubmit}>
          <label className={styles.field}>
            {t.emailLabel}
            <input
              type="email"
              required
              autoComplete="username email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t.emailPlaceholder}
              dir="ltr"
            />
          </label>
          <button
            type="submit"
            className={`${styles.btnPrimary} ${styles.btnBlock}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? t.resetSending : t.resetSend}
          </button>
        </form>

        <p className={styles.footer}>
          <Link href={Routes.auth.login} className={styles.link}>
            {t.backToSignIn}
          </Link>
        </p>
      </section>
    </main>
  );
}
