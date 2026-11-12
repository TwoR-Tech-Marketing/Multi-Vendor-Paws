import Link from "next/link";

import { Routes } from "@/constants/routes";
import { formatEgp } from "@/features/products/domain/currency";
import { isScreenVisible } from "@/features/vendor/domain/vendor-type-config";
import type { AppStrings } from "@/shared/i18n/types";

import portalStyles from "@/features/vendor/presentation/portal.module.css";
import styles from "./settings.module.css";

type SettingsStoreSnapshotPanelProps = {
  strings: AppStrings;
  productCount: number;
  openOrders: number;
  netEarningsPiastres: number;
  isActiveVendor: boolean;
  /** Store when omitted. Providers have no products or orders cards. */
  vendorType?: string;
};

export function SettingsStoreSnapshotPanel({
  strings,
  productCount,
  openOrders,
  netEarningsPiastres,
  isActiveVendor,
  vendorType,
}: SettingsStoreSnapshotPanelProps) {
  const t = strings.settings;
  const showProducts = isScreenVisible(vendorType, "products");
  const showOrders = isScreenVisible(vendorType, "orders");

  return (
    <article className={portalStyles.panel} aria-labelledby="settings-snapshot-title">
      <h2 id="settings-snapshot-title" className={styles.panelTitle}>
        {t.snapshotTitle}
      </h2>

      <div className={styles.snapshotGrid}>
        {showProducts ? (
          <Link href={Routes.vendor.products} className={styles.snapshotCard}>
            <span className={styles.snapshotLabel}>{t.snapshotProducts}</span>
            <p className={styles.snapshotValue}>{productCount}</p>
          </Link>
        ) : null}
        {!showOrders ? null : isActiveVendor ? (
          <Link href={Routes.vendor.orders} className={styles.snapshotCard}>
            <span className={styles.snapshotLabel}>{t.snapshotOpenOrders}</span>
            <p className={styles.snapshotValue}>{openOrders}</p>
          </Link>
        ) : (
          <div className={styles.snapshotCard}>
            <span className={styles.snapshotLabel}>{t.snapshotOpenOrders}</span>
            <p className={styles.snapshotValue}>{openOrders}</p>
          </div>
        )}
        {isActiveVendor ? (
          <Link
            href={Routes.vendor.earnings}
            className={`${styles.snapshotCard} ${styles.snapshotCardHighlight}`}
          >
            <span className={styles.snapshotLabel}>{t.snapshotNetEarnings}</span>
            <p className={styles.snapshotValue}>{formatEgp(netEarningsPiastres)}</p>
          </Link>
        ) : (
          <div className={`${styles.snapshotCard} ${styles.snapshotCardHighlight}`}>
            <span className={styles.snapshotLabel}>{t.snapshotNetEarnings}</span>
            <p className={styles.snapshotValue}>{formatEgp(netEarningsPiastres)}</p>
          </div>
        )}
      </div>

      {!isActiveVendor ? (
        <p className={styles.hint}>{t.snapshotInactiveHint}</p>
      ) : null}
    </article>
  );
}
