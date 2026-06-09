"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "firebase/auth";

import { signOutVendor, subscribeAuthState } from "@/lib/auth";
import { resolveVendorSession } from "@/features/auth/infrastructure/resolve-vendor-session";
import type { VendorProfile } from "@/features/auth/domain/types";
import styles from "./auth.module.css";

export function AccountStatusClient() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeAuthState(async (nextUser) => {
      if (!nextUser) {
        router.replace("/login");
        return;
      }

      const session = await resolveVendorSession(nextUser);

      if (session.kind === "active") {
        router.replace("/dashboard");
        return;
      }

      if (
        session.kind === "mobile_app_account" ||
        session.kind === "wrong_sign_in_email" ||
        session.kind === "not_vendor"
      ) {
        await signOutVendor();
        router.replace("/login?invalid=1");
        return;
      }

      setUser(nextUser);
      setProfile(session.profile);
      setMessage(session.message);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [router]);

  async function onSignOut() {
    await signOutVendor();
    router.replace("/login");
  }

  if (isLoading) {
    return (
      <main className={styles.page}>
        <p>Loading account status...</p>
      </main>
    );
  }

  if (!user) return null;

  const status = profile?.status ?? "pending";

  return (
    <main className={styles.page}>
      <section className={styles.statusCard}>
        <div className={styles.brand}>
          <div className={styles.logoMark}>⏳</div>
          <h2>Account status</h2>
          <p>
            {message ||
              (status === "pending"
                ? "Your vendor application is pending admin review."
                : "Your vendor account is not active yet.")}
          </p>
        </div>

        <div className={styles.reviewGrid}>
          <div className={styles.reviewRow}>
            <span>Store</span>
            <strong>{profile?.storeName ?? "—"}</strong>
          </div>
          <div className={styles.reviewRow}>
            <span>Sign-in email</span>
            <strong>{profile?.email || user.email}</strong>
          </div>
          <div className={styles.reviewRow}>
            <span>Status</span>
            <strong className={styles.statusPending}>{status}</strong>
          </div>
        </div>

        <p style={{ color: "var(--color-text-muted)", fontSize: 14, marginBottom: 20 }}>
          You will be able to access products and orders once an admin approves your
          application in the Tender Paws admin panel.
        </p>

        <div className={styles.actions}>
          <button type="button" className={styles.btnSecondary} onClick={onSignOut}>
            Sign out
          </button>
          <Link href="/" className={styles.btnPrimary}>
            Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}
