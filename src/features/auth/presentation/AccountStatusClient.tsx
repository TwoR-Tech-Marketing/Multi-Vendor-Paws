"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "firebase/auth";

import { signOutVendor, subscribeAuthState } from "@/lib/auth";
import { getVendorProfile } from "@/features/auth/infrastructure/vendor-profile.repository";
import type { VendorProfile } from "@/features/auth/domain/types";
import styles from "./auth.module.css";

export function AccountStatusClient() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeAuthState(async (nextUser) => {
      if (!nextUser) {
        router.replace("/login");
        return;
      }

      const vendorProfile = await getVendorProfile(nextUser.uid);
      if (vendorProfile?.status === "active") {
        router.replace("/dashboard");
        return;
      }

      setUser(nextUser);
      setProfile(vendorProfile);
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
            {status === "pending"
              ? "Your vendor application is pending admin review."
              : "Your vendor account is not active yet."}
          </p>
        </div>

        <div className={styles.reviewGrid}>
          <div className={styles.reviewRow}>
            <span>Store</span>
            <strong>{profile?.storeName ?? "—"}</strong>
          </div>
          <div className={styles.reviewRow}>
            <span>Email</span>
            <strong>{user.email}</strong>
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
