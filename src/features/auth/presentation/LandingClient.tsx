"use client";

import Link from "next/link";
import styles from "./auth.module.css";

export function LandingClient() {
  return (
    <main className={styles.landing}>
      <div className={styles.landingHero}>
        <div className={styles.landingCopy}>
          <span className={styles.badge}>Tender Paws · Phase 3</span>
          <h1>Sell on Tender Paws as a vendor</h1>
          <p>
            Manage your store, products, and orders from one vendor portal. Buyers
            discover your products in the Tender Paws mobile app.
          </p>
          <div className={styles.landingActions}>
            <Link href="/register" className={styles.btnPrimary}>
              Create vendor account
            </Link>
            <Link href="/login" className={styles.btnSecondary}>
              Sign in
            </Link>
          </div>
          <p className={styles.landingHint}>
            After signup, your application is reviewed by our admin team before
            activation.
          </p>
        </div>

        <div className={styles.features}>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>🏪</div>
            <div>
              <strong>Store setup</strong>
              <small>Name, logo, description, contacts</small>
            </div>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>📦</div>
            <div>
              <strong>Product catalog</strong>
              <small>Add, edit, stock &amp; status</small>
            </div>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>🧾</div>
            <div>
              <strong>Order inbox</strong>
              <small>Your orders only</small>
            </div>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>💳</div>
            <div>
              <strong>Earnings</strong>
              <small>Commission-ready payouts</small>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
