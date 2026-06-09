"use client";

import Link from "next/link";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";

import { firebaseAuth } from "@/lib/firebase";
import { mapAuthError } from "@/features/auth/domain/errors";
import styles from "./auth.module.css";

export function ForgotPasswordClient() {
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
      setMessage("If an account exists for this email, a reset link has been sent.");
    } catch (resetError) {
      setError(mapAuthError(resetError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.brand}>
          <h2>Reset password</h2>
          <p>Enter your business email (the one you use to sign in).</p>
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
            Business email
            <input
              type="email"
              required
              autoComplete="username email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="vendor@store.com"
            />
          </label>
          <button
            type="submit"
            className={`${styles.btnPrimary} ${styles.btnBlock}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className={styles.footer}>
          <Link href="/login" className={styles.link}>
            Back to sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
