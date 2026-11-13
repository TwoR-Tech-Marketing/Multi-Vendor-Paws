"use client";

import { useCallback, useEffect, useState } from "react";

import { LogoutConfirmDialog } from "@/components/ui/LogoutConfirmDialog";
import { EmptyState } from "@/components/ui/empty-state/EmptyState";
import { LoadErrorState } from "@/components/ui/error-state/LoadErrorState";
import { toLoadErrorView, type LoadErrorView } from "@/components/ui/error-state/load-error";
import {
  createBranch,
  getBranchDeals,
  listBranches,
  setBranchStatus,
  updateBranch,
} from "@/features/branches/application/branches.api";
import {
  BRANCH_LIMITS,
  type Branch,
  type BranchDeal,
  type BranchPayload,
} from "@/features/branches/domain/types";
import { branchesErrorMessage } from "@/features/branches/presentation/branch-copy";
import { BranchCard } from "@/features/branches/presentation/BranchCard";
import { BranchesSkeleton } from "@/features/branches/presentation/BranchesSkeleton";
import { BranchForm } from "@/features/branches/presentation/BranchForm";
import { PendingBranchesHint } from "@/features/branches/presentation/PendingBranchesHint";
import { usePortalSession } from "@/features/vendor/presentation/PortalSessionContext";
import type { AppStrings } from "@/shared/i18n/types";
import type { AppLocale } from "@/shared/preferences/domain/types";
import { usePreferences, useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./branches.module.css";

type BranchListProps = {
  branches: Branch[];
  deals: Record<string, BranchDeal>;
  strings: AppStrings;
  locale: AppLocale;
  readOnly: boolean;
  onAdd: () => void;
  onEdit: (branch: Branch) => void;
  onArchive: (branch: Branch) => void;
  onRestore: (branch: Branch) => void;
};

/** Active and archived branch cards. Pure: driven by props. */
export function BranchList({
  branches,
  deals,
  strings,
  locale,
  readOnly,
  onAdd,
  onEdit,
  onArchive,
  onRestore,
}: BranchListProps) {
  const t = strings.branches;
  const active = branches.filter((b) => b.status === "active");
  const archived = branches.filter((b) => b.status === "archived");
  const atLimit = active.length >= BRANCH_LIMITS.maxActiveBranches;

  const card = (branch: Branch) => (
    <BranchCard
      key={branch.branchId}
      branch={branch}
      deal={deals[branch.branchId] ?? null}
      strings={strings}
      locale={locale}
      readOnly={readOnly}
      onEdit={onEdit}
      onArchive={onArchive}
      onRestore={onRestore}
    />
  );

  return (
    <>
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>{t.title}</h2>
          {!readOnly ? (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={onAdd}
              disabled={atLimit}
            >
              {t.add}
            </button>
          ) : null}
        </div>
        {readOnly ? <p className={styles.muted}>{t.readOnlyHint}</p> : null}
        {!readOnly && atLimit ? <p className={styles.muted}>{t.limitReached}</p> : null}
        {active.length === 0 ? (
          <EmptyState
            headingLevel={3}
            title={t.emptyTitle}
            description={t.emptyDescription}
            action={
              !readOnly && !atLimit ? (
                <button type="button" className={styles.primaryButton} onClick={onAdd}>
                  {t.add}
                </button>
              ) : null
            }
          />
        ) : (
          <div className={styles.grid}>{active.map(card)}</div>
        )}
      </section>
      {archived.length > 0 ? (
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>{t.archivedTitle}</h2>
          <div className={styles.grid}>{archived.map(card)}</div>
        </section>
      ) : null}
    </>
  );
}

type Editing = { mode: "new" } | { mode: "edit"; branch: Branch } | null;

export function BranchesSection() {
  const strings = useStrings();
  const { locale } = usePreferences();
  const t = strings.branches;
  const { sessionKind } = usePortalSession();
  const readOnly = sessionKind === "suspended";

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<LoadErrorView | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [deals, setDeals] = useState<Record<string, BranchDeal>>({});
  const [editing, setEditing] = useState<Editing>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Branch | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [items, dealSummary] = await Promise.all([
        listBranches({ includeArchived: true }),
        getBranchDeals().catch(() => null),
      ]);
      setBranches(items);
      const byBranch: Record<string, BranchDeal> = {};
      for (const row of dealSummary?.branches ?? []) byBranch[row.branchId] = row.deal;
      setDeals(byBranch);
    } catch (error) {
      setLoadError(toLoadErrorView(error, strings, t.loadError));
    } finally {
      setIsLoading(false);
    }
  }, [strings, t.loadError]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function run(action: () => Promise<unknown>, onDone?: () => void) {
    setIsSaving(true);
    setActionError(null);
    setSuccess(null);
    try {
      await action();
      onDone?.();
      await load();
    } catch (error) {
      setActionError(branchesErrorMessage(error, strings));
    } finally {
      setIsSaving(false);
    }
  }

  function handleSubmit(payload: BranchPayload) {
    const current = editing;
    if (!current) return;
    void run(
      () =>
        current.mode === "edit"
          ? updateBranch(current.branch.branchId, payload)
          : createBranch(payload),
      () => {
        setEditing(null);
        setSuccess(t.saveSuccess);
      },
    );
  }

  if (isLoading) return <BranchesSkeleton />;

  if (loadError) {
    return (
      <div className={styles.stack}>
        <section className={styles.panel}>
          <LoadErrorState view={loadError} strings={strings} onRetry={() => void load()} />
        </section>
      </div>
    );
  }

  return (
    <div className={styles.stack}>
      <PendingBranchesHint />
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

      {editing && !readOnly ? (
        <BranchForm
          key={editing.mode === "edit" ? editing.branch.branchId : "new"}
          branch={editing.mode === "edit" ? editing.branch : null}
          isSaving={isSaving}
          serverError={actionError}
          onSubmit={handleSubmit}
          onCancel={() => {
            setEditing(null);
            setActionError(null);
          }}
        />
      ) : (
        <BranchList
          branches={branches}
          deals={deals}
          strings={strings}
          locale={locale}
          readOnly={readOnly}
          onAdd={() => {
            setSuccess(null);
            setActionError(null);
            setEditing({ mode: "new" });
          }}
          onEdit={(branch) => {
            setSuccess(null);
            setActionError(null);
            setEditing({ mode: "edit", branch });
          }}
          onArchive={setArchiveTarget}
          onRestore={(branch) => void run(() => setBranchStatus(branch.branchId, "active"))}
        />
      )}

      <LogoutConfirmDialog
        open={archiveTarget !== null}
        title={t.archive}
        message={t.archiveConfirm}
        confirmLabel={t.archive}
        cancelLabel={strings.common.cancel}
        isConfirming={isSaving}
        onCancel={() => setArchiveTarget(null)}
        onConfirm={async () => {
          const target = archiveTarget;
          if (!target) return;
          await run(() => setBranchStatus(target.branchId, "archived"));
          setArchiveTarget(null);
        }}
      />
    </div>
  );
}
