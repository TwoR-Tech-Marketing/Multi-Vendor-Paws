"use client";

import { useCallback, useEffect, useState } from "react";

import { LogoutConfirmDialog } from "@/components/ui/LogoutConfirmDialog";
import {
  createCoupon,
  listCoupons,
  setCouponActive,
  updateCoupon,
} from "@/features/coupons/application/coupons.api";
import { buildCouponUpdate } from "@/features/coupons/domain/schemas";
import {
  COUPON_LIMITS,
  countOpenCoupons,
  type Coupon,
  type CouponCreatePayload,
  type CouponStatusFilter,
} from "@/features/coupons/domain/types";
import { couponsErrorMessage } from "@/features/coupons/presentation/coupon-copy";
import { CouponForm } from "@/features/coupons/presentation/CouponForm";
import { CouponsSkeleton } from "@/features/coupons/presentation/CouponsSkeleton";
import { CouponStatusTabs } from "@/features/coupons/presentation/CouponStatusTabs";
import { CouponsTable } from "@/features/coupons/presentation/CouponsTable";
import type { AppStrings } from "@/shared/i18n/types";
import { usePreferences, useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./coupons.module.css";

type CouponListProps = {
  coupons: Coupon[];
  tab: CouponStatusFilter;
  strings: AppStrings;
  locale: string;
  isBusy: boolean;
  onTabChange: (tab: CouponStatusFilter) => void;
  onAdd: () => void;
  onEdit: (coupon: Coupon) => void;
  onPause: (coupon: Coupon) => void;
  onResume: (coupon: Coupon) => void;
};

/** Header, status tabs, empty states and the coupon table. Pure: driven by props. */
export function CouponList({
  coupons,
  tab,
  strings,
  locale,
  isBusy,
  onTabChange,
  onAdd,
  onEdit,
  onPause,
  onResume,
}: CouponListProps) {
  const t = strings.coupons;
  const atLimit = countOpenCoupons(coupons) >= COUPON_LIMITS.openPerVendor;
  const visible = tab === "all" ? coupons : coupons.filter((c) => c.status === tab);

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>{t.title}</h2>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={onAdd}
          disabled={atLimit || isBusy}
        >
          {t.add}
        </button>
      </div>
      {atLimit ? <p className={styles.muted}>{t.limitReached}</p> : null}
      {coupons.length === 0 ? (
        <p className={styles.muted}>{t.empty}</p>
      ) : (
        <>
          <CouponStatusTabs strings={strings} tab={tab} onTabChange={onTabChange} />
          {visible.length === 0 ? (
            <p className={styles.muted}>{t.filteredEmpty}</p>
          ) : (
            <CouponsTable
              coupons={visible}
              strings={strings}
              locale={locale}
              isBusy={isBusy}
              onEdit={onEdit}
              onPause={onPause}
              onResume={onResume}
            />
          )}
        </>
      )}
    </section>
  );
}

type Editing = { mode: "new" } | { mode: "edit"; coupon: Coupon } | null;

export function CouponsSection() {
  const strings = useStrings();
  const { locale } = usePreferences();
  const t = strings.coupons;

  const [nowMs] = useState(() => Date.now());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [tab, setTab] = useState<CouponStatusFilter>("all");
  const [editing, setEditing] = useState<Editing>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pauseTarget, setPauseTarget] = useState<Coupon | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setCoupons(await listCoupons("all"));
    } catch {
      setLoadError(t.loadError);
    } finally {
      setIsLoading(false);
    }
  }, [t.loadError]);

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

  function handleSubmit(payload: CouponCreatePayload) {
    const current = editing;
    if (!current) return;
    void run(
      () =>
        current.mode === "edit"
          ? updateCoupon(current.coupon.couponId, buildCouponUpdate(payload, current.coupon))
          : createCoupon(payload),
      t.saveSuccess,
      () => setEditing(null),
    );
  }

  function openEditor(next: Editing) {
    setSuccess(null);
    setActionError(null);
    setEditing(next);
  }

  if (isLoading) return <CouponsSkeleton />;

  if (loadError) {
    return (
      <div className={styles.stack}>
        <div className={styles.alertError} role="alert">
          {loadError}
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.secondaryButton} onClick={() => void load()}>
            {strings.common.retry}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.stack}>
      {success ? (
        <div className={styles.alertSuccess} role="status">
          {success}
        </div>
      ) : null}
      {actionError && !editing ? (
        <div className={styles.alertError} role="alert">
          {actionError}
        </div>
      ) : null}

      {editing ? (
        <CouponForm
          key={editing.mode === "edit" ? editing.coupon.couponId : "new"}
          coupon={editing.mode === "edit" ? editing.coupon : null}
          nowMs={nowMs}
          isSaving={isSaving}
          serverError={actionError}
          onSubmit={handleSubmit}
          onCancel={() => {
            setEditing(null);
            setActionError(null);
          }}
        />
      ) : (
        <CouponList
          coupons={coupons}
          tab={tab}
          strings={strings}
          locale={locale}
          isBusy={isSaving}
          onTabChange={setTab}
          onAdd={() => openEditor({ mode: "new" })}
          onEdit={(coupon) => openEditor({ mode: "edit", coupon })}
          onPause={setPauseTarget}
          onResume={(coupon) =>
            void run(() => setCouponActive(coupon.couponId, true), t.resumeSuccess)
          }
        />
      )}

      <LogoutConfirmDialog
        open={pauseTarget !== null}
        title={t.pause}
        message={t.pauseConfirm}
        confirmLabel={t.pause}
        cancelLabel={strings.common.cancel}
        isConfirming={isSaving}
        onCancel={() => setPauseTarget(null)}
        onConfirm={async () => {
          const target = pauseTarget;
          if (!target) return;
          await run(() => setCouponActive(target.couponId, false), t.pauseSuccess);
          setPauseTarget(null);
        }}
      />
    </div>
  );
}
