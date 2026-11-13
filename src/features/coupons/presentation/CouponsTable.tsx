import Link from "next/link";

import { Routes } from "@/constants/routes";
import type { Coupon } from "@/features/coupons/domain/types";
import {
  formatCouponConditions,
  formatCouponDate,
  formatCouponUsage,
  formatCouponValue,
} from "@/features/coupons/presentation/coupon-copy";
import { CouponStatusBadge } from "@/features/coupons/presentation/CouponStatusBadge";
import type { AppStrings } from "@/shared/i18n/types";
import type { AppLocale } from "@/shared/preferences/domain/types";

import styles from "./coupons.module.css";

type CouponsTableProps = {
  coupons: Coupon[];
  strings: AppStrings;
  locale: AppLocale;
  isBusy: boolean;
  onEdit: (coupon: Coupon) => void;
  onPause: (coupon: Coupon) => void;
  onResume: (coupon: Coupon) => void;
};

/** Pure coupon rows with status, usage and actions. */
export function CouponsTable({
  coupons,
  strings,
  locale,
  isBusy,
  onEdit,
  onPause,
  onResume,
}: CouponsTableProps) {
  const t = strings.coupons;
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">{t.fields.code}</th>
            <th scope="col">{t.fields.value}</th>
            <th scope="col">{t.fields.status}</th>
            <th scope="col" className={styles.numeric}>
              {t.fields.usage}
            </th>
            <th scope="col">{t.fields.expiresAt}</th>
            <th scope="col">{t.fields.actions}</th>
          </tr>
        </thead>
        <tbody>
          {coupons.map((coupon) => {
            const conditions = formatCouponConditions(coupon, strings, locale);
            return (
              <tr key={coupon.couponId} data-coupon-id={coupon.couponId}>
                <td className={styles.code}>
                  <bdi dir="ltr" title={coupon.code}>
                    {coupon.code}
                  </bdi>
                </td>
                <td>
                  {formatCouponValue(coupon, strings, locale)}
                  {conditions ? <span className={styles.subLine}>{conditions}</span> : null}
                </td>
                <td>
                  <CouponStatusBadge status={coupon.status} strings={strings} />
                </td>
                <td className={styles.numeric}>{formatCouponUsage(coupon, strings)}</td>
                <td className={styles.dateCell}>
                  {coupon.expiresAtMs === null
                    ? t.noExpiry
                    : formatCouponDate(coupon.expiresAtMs, locale)}
                </td>
                <td>
                  <div className={styles.actions}>
                    <Link
                      className={styles.linkButton}
                      href={Routes.vendor.couponDetail(coupon.couponId)}
                      aria-label={`${t.view} ${coupon.code}`}
                    >
                      {t.view}
                    </Link>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => onEdit(coupon)}
                      disabled={isBusy}
                    >
                      {t.edit}
                    </button>
                    {coupon.status === "active" ? (
                      <button
                        type="button"
                        className={styles.dangerButton}
                        onClick={() => onPause(coupon)}
                        disabled={isBusy}
                      >
                        {t.pause}
                      </button>
                    ) : null}
                    {coupon.status === "paused" ? (
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => onResume(coupon)}
                        disabled={isBusy}
                      >
                        {t.resume}
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
