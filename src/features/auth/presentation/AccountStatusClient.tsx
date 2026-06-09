"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "firebase/auth";

import { signOutVendor, subscribeAuthState } from "@/lib/auth";
import { resolveVendorSession } from "@/features/auth/infrastructure/resolve-vendor-session";
import type { VendorProfile } from "@/features/auth/domain/types";
import styles from "./auth.module.css";

function formatExpiry(expiresAt: Date | null | undefined): string {
  if (!expiresAt) return "—";
  return expiresAt.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function AccountStatusClient() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [message, setMessage] = useState("");
  const [sessionKind, setSessionKind] = useState<"pending" | "suspended">("pending");
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
      setSessionKind(session.kind === "suspended" ? "suspended" : "pending");
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
  const isSuspended = sessionKind === "suspended";

  return (
    <main className={styles.page}>
      <section className={styles.statusCard}>
        <div className={styles.brand}>
          <div className={styles.logoMark}>{isSuspended ? "🚫" : "⏳"}</div>
          <h2>Account status</h2>
          <p>
            {message ||
              (status === "pending"
                ? "Your vendor application is pending admin review."
                : "Your vendor account is not active yet.")}
          </p>
        </div>

        {isSuspended && profile?.restrictionReason ? (
          <div className={styles.alert + " " + styles.alertError}>
            This account is suspended for {profile.restrictionReason}
            {!profile.isPermanentRestriction && profile.restrictionExpiresAt
              ? ` until ${formatExpiry(profile.restrictionExpiresAt)}`
              : ""}
            .
          </div>
        ) : null}

        <div className={styles.reviewGrid}>
          <div className={styles.reviewRow}>
            <span>Store</span>
            <strong>{profile?.storeName ?? "—"}</strong>
          </div>
          <div className={styles.reviewRow}>
            <span>Email</span>
            <strong>{profile?.email || user.email}</strong>
          </div>
          <div className={styles.reviewRow}>
            <span>Status</span>
            <strong
              className={
                isSuspended ? styles.statusSuspended : styles.statusPending
              }
            >
              {isSuspended ? "suspended" : status}
            </strong>
          </div>
          {isSuspended ? (
            <>
              <div className={styles.reviewRow}>
                <span>Reason</span>
                <strong>{profile?.restrictionReason ?? "—"}</strong>
              </div>
              <div className={styles.reviewRow}>
                <span>Access restored</span>
                <strong>
                  {profile?.isPermanentRestriction
                    ? "Contact support"
                    : formatExpiry(profile?.restrictionExpiresAt)}
                </strong>
              </div>
            </>
          ) : null}
        </div>

        <p style={{ color: "var(--color-text-muted)", fontSize: 14, marginBottom: 20 }}>
          {isSuspended
            ? "You cannot access products, orders, or earnings while your account is suspended."
            : "You will be able to access products and orders once an admin approves your application in the Tender Paws admin panel."}
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
