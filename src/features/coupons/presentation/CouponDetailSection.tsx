"use client";

import { useCallback, useEffect, useState } from "react";

import { LogoutConfirmDialog } from "@/components/ui/LogoutConfirmDialog";
import {
  getCoupon,
  setCouponActive,
  updateCoupon,
} from "@/features/coupons/application/coupons.api";
import { buildCouponUpdate } from "@/features/coupons/domain/schemas";
import type {
  CouponCreatePayload,
  CouponDetail as CouponDetailData,
} from "@/features/coupons/domain/types";
import { couponsErrorMessage } from "@/features/coupons/presentation/coupon-copy";
import { CouponDetail } from "@/features/coupons/presentation/CouponDetail";
import { CouponDetailSkeleton } from "@/features/coupons/presentation/CouponDetailSkeleton";
import { CouponForm } from "@/features/coupons/presentation/CouponForm";
import { usePreferences, useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./coupons.module.css";

export function CouponDetailSection({ couponId }: { couponId: string }) {
  const strings = useStrings();
  const { locale } = usePreferences();
  const t = strings.coupons;

  const [nowMs] = useState(() => Date.now());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [detail, setDetail] = useState<CouponDetailData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmPause, setConfirmPause] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setDetail(await getCoupon(couponId));
    } catch (error) {
      setLoadError(
        error && typeof error === "object" && "code" in error
          ? couponsErrorMessage(error, strings)
          : t.detailLoadError,
      );
    } finally {
      setIsLoading(false);
    }
  }, [couponId, strings, t.detailLoadError]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function run(action: () => Promise<unknown>, doneMessage: string, onDone?: () => void) {
    setIsSaving(true);
    setActionError(null);
    setSuccess(null);
    try {
      await action();
      onDone?.();
      setSuccess(doneMessage);
      await load();
    } catch (error) {
      setActionError(couponsErrorMessage(error, strings));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <CouponDetailSkeleton />;

  if (loadError || !detail) {
    return (
      <div className={styles.stack}>
        <div className={styles.alertError} role="alert">
          {loadError ?? t.detailLoadError}
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.secondaryButton} onClick={() => void load()}>
            {strings.common.retry}
          </button>
        </div>
      </div>
    );
  }

  const coupon = detail.coupon;

  function handleSubmit(payload: CouponCreatePayload) {
    void run(
      () => updateCoupon(coupon.couponId, buildCouponUpdate(payload, coupon)),
      t.saveSuccess,
      () => setIsEditing(false),
    );
  }

  return (
    <div className={styles.stack}>
      {success ? (
        <div className={styles.alertSuccess} role="status">
          {success}
        </div>
      ) : null}
      {actionError && !isEditing ? (
        <div className={styles.alertError} role="alert">
          {actionError}
        </div>
      ) : null}

      {isEditing ? (
        <CouponForm
          coupon={coupon}
          nowMs={nowMs}
          isSaving={isSaving}
          serverError={actionError}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsEditing(false);
            setActionError(null);
          }}
        />
      ) : (
        <CouponDetail
          detail={detail}
          strings={strings}
          locale={locale}
          isBusy={isSaving}
          onEdit={() => {
            setSuccess(null);
            setActionError(null);
            setIsEditing(true);
          }}
          onPause={() => setConfirmPause(true)}
          onResume={() => void run(() => setCouponActive(coupon.couponId, true), t.resumeSuccess)}
        />
      )}

      <LogoutConfirmDialog
        open={confirmPause}
        title={t.pause}
        message={t.pauseConfirm}
        confirmLabel={t.pause}
        cancelLabel={strings.common.cancel}
        isConfirming={isSaving}
        onCancel={() => setConfirmPause(false)}
        onConfirm={async () => {
          await run(() => setCouponActive(coupon.couponId, false), t.pauseSuccess);
          setConfirmPause(false);
        }}
      />
    </div>
  );
}
