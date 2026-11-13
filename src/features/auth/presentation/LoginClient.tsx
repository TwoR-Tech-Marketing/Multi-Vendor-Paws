"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Routes } from "@/constants/routes";
import { portalPostLoginHref } from "@/features/auth/domain/portal-account-gate";
import { createServerSession } from "@/lib/auth-client";
import { signInVendorForIdToken, signOutVendor } from "@/lib/auth";
import { PawlioLogo } from "@/shared/components/PawlioLogo";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import { authErrorMessage } from "./auth-copy";
import styles from "./auth.module.css";

export function LoginClient() {
  const router = useRouter();
  const strings = useStrings();
  const t = strings.auth;
  const searchParams = useSearchParams();
  const submitted = searchParams.get("submitted") === "1";
  const showLoginFailed = searchParams.get("invalid") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const idToken = await signInVendorForIdToken(email.trim(), password);
      const session = await createServerSession(idToken);
      await signOutVendor();

      const nextHref = portalPostLoginHref(session.sessionKind);
      if (nextHref) {
        router.replace(nextHref);
        return;
      }

      setError(t.loginFailed);
    } catch (signInError) {
      await signOutVendor();
      setError(authErrorMessage(signInError, strings));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.brand}>
          <PawlioLogo className={styles.logoMark} priority />
          <h1>{t.loginTitle}</h1>
          <p>{t.loginSubtitle}</p>
        </div>

        {submitted ? (
          <div className={`${styles.alert} ${styles.alertSuccess}`} role="status">
            {t.submittedNotice}
          </div>
        ) : null}

        {(error || showLoginFailed) ? (
          <div className={`${styles.alert} ${styles.alertError}`} role="alert">
            {error ?? t.loginFailed}
          </div>
        ) : null}

        <form className={styles.formStack} onSubmit={onSubmit}>
          <label className={styles.field}>
            {t.emailLabel}
            <input
              type="email"
              required
              autoComplete="username email"
              placeholder={t.emailPlaceholder}
              dir="ltr"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className={styles.field}>
            {t.passwordLabel}
            <input
              type="password"
              required
              minLength={8}
              autoComplete="current-password"
              placeholder={t.passwordPlaceholder}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <div className={styles.rowBetween}>
            <label className={`${styles.field} ${styles.checkbox}`}>
              <input type="checkbox" defaultChecked />
              {t.rememberMe}
            </label>
            <Link href={Routes.auth.forgotPassword} className={styles.link}>
              {t.forgotPassword}
            </Link>
          </div>

          <button
            type="submit"
            className={`${styles.btnPrimary} ${styles.btnBlock}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? t.signingIn : t.signIn}
          </button>
        </form>

        <p className={styles.footer}>
          {t.newVendor}{" "}
          <Link href={Routes.auth.register} className={styles.link}>
            {t.createAccount}
          </Link>
        </p>
      </section>
    </main>
  );
}
