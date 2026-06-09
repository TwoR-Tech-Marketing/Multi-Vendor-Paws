"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { signInVendor } from "@/lib/auth";
import { mapAuthError } from "@/features/auth/domain/errors";
import { getVendorProfile } from "@/features/auth/infrastructure/vendor-profile.repository";
import styles from "./auth.module.css";

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const submitted = searchParams.get("submitted") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const credential = await signInVendor(email.trim(), password);
      const profile = await getVendorProfile(credential.user.uid);

      if (!profile || profile.status !== "active") {
        router.push("/account-status");
        return;
      }

      router.push("/dashboard");
    } catch (signInError) {
      setError(mapAuthError(signInError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.logoMark}>🐾</div>
          <h2>Vendor sign in</h2>
          <p>Sign in with your business email and password.</p>
        </div>

        {submitted ? (
          <div className={`${styles.alert} ${styles.alertSuccess}`} role="status">
            Application submitted. Sign in with your business email after admin approval.
          </div>
        ) : null}

        {error ? (
          <div className={`${styles.alert} ${styles.alertError}`} role="alert">
            {error}
          </div>
        ) : null}

        <form className={styles.formStack} onSubmit={onSubmit}>
          <label className={styles.field}>
            Business email
            <input
              type="email"
              required
              autoComplete="username email"
              placeholder="vendor@store.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className={styles.field}>
            Password
            <input
              type="password"
              required
              minLength={8}
              autoComplete="current-password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <div className={styles.rowBetween}>
            <label className={`${styles.field} ${styles.checkbox}`}>
              <input type="checkbox" defaultChecked />
              Remember me
            </label>
            <Link href="/forgot-password" className={styles.link}>
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className={`${styles.btnPrimary} ${styles.btnBlock}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className={styles.footer}>
          New vendor?{" "}
          <Link href="/register" className={styles.link}>
            Create account
          </Link>
        </p>
      </section>
    </main>
  );
}
