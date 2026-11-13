import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state/EmptyState";
import { Routes } from "@/constants/routes";
import type { CouponDetail as CouponDetailData } from "@/features/coupons/domain/types";
import {
  formatCouponConditions,
  formatCouponDate,
  formatCouponValue,
} from "@/features/coupons/presentation/coupon-copy";
import { CouponStatusBadge } from "@/features/coupons/presentation/CouponStatusBadge";
import { formatEgp } from "@/features/products/domain/currency";
import type { AppStrings } from "@/shared/i18n/types";
import type { AppLocale } from "@/shared/preferences/domain/types";

import styles from "./coupons.module.css";

type CouponDetailProps = {
  detail: CouponDetailData;
  strings: AppStrings;
  locale: AppLocale;
  isBusy: boolean;
  onEdit: () => void;
  onPause: () => void;
  onResume: () => void;
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.stat}>
      <p className={styles.statLabel}>{label}</p>
      <p className={styles.statValue}>{value}</p>
    </div>
  );
}

/** Coupon summary, usage card and recent redemptions. Pure: driven by props. */
export function CouponDetail({
  detail,
  strings,
  locale,
  isBusy,
  onEdit,
  onPause,
  onResume,
}: CouponDetailProps) {
  const t = strings.coupons;
  const { coupon, usage } = detail;
  const conditions = formatCouponConditions(coupon, strings, locale);
  const perUser = `${t.fields.perUserLimit}: ${coupon.perUserLimit}`;

  return (
    <>
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.codeTitle} dir="ltr">
            {coupon.code}
          </h2>
          <CouponStatusBadge status={coupon.status} strings={strings} />
        </div>
        <p className={styles.panelTitle}>{formatCouponValue(coupon, strings, locale)}</p>
        {conditions ? <p className={styles.muted}>{conditions}</p> : null}
        <p className={styles.muted}>
          {t.fields.expiresAt}:{" "}
          {coupon.expiresAtMs === null ? t.noExpiry : formatCouponDate(coupon.expiresAtMs, locale)}
        </p>
        <p className={styles.muted}>{perUser}</p>
        <p className={styles.muted}>{t.hints.fundedByVendor}</p>
        <div className={styles.actions}>
          <button type="button" className={styles.secondaryButton} onClick={onEdit} disabled={isBusy}>
            {t.edit}
          </button>
          {coupon.status === "active" ? (
            <button type="button" className={styles.dangerButton} onClick={onPause} disabled={isBusy}>
              {t.pause}
            </button>
          ) : null}
          {coupon.status === "paused" ? (
            <button type="button" className={styles.secondaryButton} onClick={onResume} disabled={isBusy}>
              {t.resume}
            </button>
          ) : null}
          <Link className={styles.linkButton} href={Routes.vendor.coupons}>
            {t.backToList}
          </Link>
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="coupon-usage-title">
        <h2 className={styles.panelTitle} id="coupon-usage-title">
          {t.usage.title}
        </h2>
        <div className={styles.statGrid}>
          <Stat label={t.usage.used} value={String(usage.usedCount)} />
          <Stat
            label={t.usage.remaining}
            value={usage.remainingTotal === null ? t.usage.unlimited : String(usage.remainingTotal)}
          />
          <Stat label={t.usage.discountGiven} value={formatEgp(usage.discountGivenPiastres, locale)} />
          <Stat
            label={t.usage.lastUsed}
            value={
              usage.lastUsedAtMs === null
                ? t.usage.neverUsed
                : formatCouponDate(usage.lastUsedAtMs, locale)
            }
          />
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="coupon-recent-title">
        <h2 className={styles.panelTitle} id="coupon-recent-title">
          {t.usage.recent}
        </h2>
        {usage.recent.length === 0 ? (
          <EmptyState headingLevel={3} title={t.usage.recentEmpty} />
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">{t.usage.order}</th>
                  <th scope="col">{t.usage.date}</th>
                  <th scope="col" className={styles.numeric}>
                    {t.usage.items}
                  </th>
                  <th scope="col" className={styles.numeric}>
                    {t.usage.discount}
                  </th>
                  <th scope="col">{t.usage.status}</th>
                </tr>
              </thead>
              <tbody>
                {usage.recent.map((row) => (
                  <tr key={row.orderId}>
                    <td className={styles.code}>
                      {row.vendorOrderId ? (
                        <Link className={styles.link} href={Routes.vendor.orderDetail(row.vendorOrderId)}>
                          <bdi title={row.orderId}>{row.orderId}</bdi>
                        </Link>
                      ) : (
                        <bdi title={row.orderId}>{row.orderId}</bdi>
                      )}
                    </td>
                    <td className={styles.dateCell}>{formatCouponDate(row.createdAtMs, locale)}</td>
                    <td className={styles.numeric}>{formatEgp(row.itemsPiastres, locale)}</td>
                    <td className={styles.numeric}>{formatEgp(row.discountPiastres, locale)}</td>
                    <td>{row.status === "reversed" ? t.usage.reversed : t.usage.applied}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
