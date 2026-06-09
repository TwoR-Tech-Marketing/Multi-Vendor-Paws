"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "firebase/auth";

import { signOutVendor, subscribeAuthState } from "@/lib/auth";
import { getVendorProfile } from "@/features/auth/infrastructure/vendor-profile.repository";
import type { VendorProfile } from "@/features/auth/domain/types";
import styles from "./auth.module.css";

export function DashboardClient() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeAuthState(async (nextUser) => {
      if (!nextUser) {
        router.replace("/login");
        return;
      }

      const vendorProfile = await getVendorProfile(nextUser.uid);
      if (!vendorProfile || vendorProfile.status !== "active") {
        router.replace("/account-status");
        return;
      }

      setUser(nextUser);
      setProfile(vendorProfile);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [router]);

  async function onLogout() {
    setIsLoggingOut(true);
    await signOutVendor();
    router.replace("/login");
  }

  if (isLoading) {
    return (
      <main className={styles.page}>
        <p>Loading your vendor dashboard...</p>
      </main>
    );
  }

  if (!user || !profile) return null;

  return (
    <main className={styles.landing}>
      <section className={styles.statusCard}>
        <div className={styles.brand}>
          <div className={styles.logoMark}>🏪</div>
          <h2>{profile.storeName}</h2>
          <p>Welcome back, {profile.ownerName}. Your vendor portal is active.</p>
        </div>

        <div className={styles.reviewGrid}>
          <div className={styles.reviewRow}>
            <span>Email</span>
            <strong>{user.email}</strong>
          </div>
          <div className={styles.reviewRow}>
            <span>Status</span>
            <strong className={styles.statusActive}>{profile.status}</strong>
          </div>
        </div>

        <p style={{ color: "var(--color-text-muted)", fontSize: 14, marginBottom: 20 }}>
          Product, order, and earnings modules will be added in the next Phase 3 milestones.
        </p>

        <div className={styles.actions}>
          <Link href="/account-status" className={styles.btnSecondary}>
            Account status
          </Link>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={onLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </section>
    </main>
  );
}
