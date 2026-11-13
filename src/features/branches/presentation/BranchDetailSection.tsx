"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { StatusBadge } from "@/components/ui/badge/StatusBadge";
import { LogoutConfirmDialog } from "@/components/ui/LogoutConfirmDialog";
import { LoadErrorState } from "@/components/ui/error-state/LoadErrorState";
import { toLoadErrorView, type LoadErrorView } from "@/components/ui/error-state/load-error";
import { Routes } from "@/constants/routes";
import {
  attachServicePhoto,
  createService,
  duplicateServices,
  getBranch,
  getBranchDeals,
  listBranches,
  setBranchStatus,
  setServiceStatus,
  updateBranch,
  updateService,
} from "@/features/branches/application/branches.api";
import type {
  Branch,
  BranchDeal,
  BranchPayload,
  BranchService,
  ServicePayload,
} from "@/features/branches/domain/types";
import { BRANCH_LIMITS } from "@/features/branches/domain/types";
import {
  branchesErrorMessage,
  canOpenAvailability,
} from "@/features/branches/presentation/branch-copy";
import { BranchDealCard } from "@/features/branches/presentation/BranchDealCard";
import { BranchDetailSkeleton } from "@/features/branches/presentation/BranchDetailSkeleton";
import { BranchForm } from "@/features/branches/presentation/BranchForm";
import { DuplicateServicesDialog } from "@/features/branches/presentation/DuplicateServicesDialog";
import { PendingBranchesHint } from "@/features/branches/presentation/PendingBranchesHint";
import { ServiceForm } from "@/features/branches/presentation/ServiceForm";
import { ServicesTable } from "@/features/branches/presentation/ServicesTable";
import { usePortalSession } from "@/features/vendor/presentation/PortalSessionContext";
import { usePreferences, useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./branches.module.css";

type Panel =
  | { kind: "editBranch" }
  | { kind: "newService" }
  | { kind: "editService"; service: BranchService }
  | null;

type Confirm =
  | { kind: "branch" }
  | { kind: "service"; service: BranchService }
  | null;

export function BranchDetailSection({ branchId }: { branchId: string }) {
  const strings = useStrings();
  const { locale } = usePreferences();
  const { sessionKind, user, profile } = usePortalSession();
  const t = strings.branches;

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<LoadErrorView | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [services, setServices] = useState<BranchService[]>([]);
  const [deal, setDeal] = useState<BranchDeal | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [dupOpen, setDupOpen] = useState(false);
  const [dupSources, setDupSources] = useState<Branch[]>([]);
  const [dupFrom, setDupFrom] = useState("");
  const [dupServices, setDupServices] = useState<BranchService[] | null>(null);
  const [dupError, setDupError] = useState<string | null>(null);
  const [dupResult, setDupResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [detail, deals] = await Promise.all([
        getBranch(branchId, { includeArchived: true }),
        getBranchDeals().catch(() => null),
      ]);
      setBranch(detail.branch);
      setServices(detail.services);
      setDeal(deals?.branches.find((row) => row.branchId === branchId)?.deal ?? null);
    } catch (error) {
      setLoadError(toLoadErrorView(error, strings, branchesErrorMessage(error, strings)));
    } finally {
      setIsLoading(false);
    }
  }, [branchId, strings]);

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

  async function saveService(payload: ServicePayload, photo: File | null) {
    const current = panel;
    setIsSaving(true);
    setActionError(null);
    setSuccess(null);
    let saved: BranchService;
    try {
      saved =
        current?.kind === "editService"
          ? await updateService(branchId, current.service.serviceId, payload)
          : await createService(branchId, payload);
    } catch (error) {
      setActionError(branchesErrorMessage(error, strings));
      setIsSaving(false);
      return;
    }
    setPanel(null);
    if (photo) {
      try {
        await attachServicePhoto({
          vendorId: user.uid,
          branchId,
          serviceId: saved.serviceId,
          file: photo,
        });
      } catch {
        setActionError(strings.services.photoUploadError);
      }
    }
    setSuccess(strings.services.saveSuccess);
    await load();
    setIsSaving(false);
  }

  async function loadDupServices(fromId: string) {
    setDupServices(null);
    try {
      const detail = await getBranch(fromId);
      setDupServices(detail.services);
    } catch (error) {
      setDupServices([]);
      setDupError(branchesErrorMessage(error, strings));
    }
  }

  async function openDuplicate() {
    setDupOpen(true);
    setDupError(null);
    setDupResult(null);
    setDupServices(null);
    try {
      const all = await listBranches();
      const sources = all.filter((b) => b.branchId !== branchId && b.serviceCount > 0);
      setDupSources(sources);
      const first = sources[0]?.branchId ?? "";
      setDupFrom(first);
      if (first) await loadDupServices(first);
    } catch (error) {
      setDupError(branchesErrorMessage(error, strings));
    }
  }

  async function submitDuplicate(input: { serviceIds?: string[]; skipExisting: boolean }) {
    setIsSaving(true);
    setDupError(null);
    setDupResult(null);
    try {
      const result = await duplicateServices({
        fromBranchId: dupFrom,
        toBranchId: branchId,
        serviceIds: input.serviceIds,
        skipExisting: input.skipExisting,
      });
      setDupResult(
        strings.services.duplicate.result
          .replace("{created}", String(result.created))
          .replace("{skipped}", String(result.skipped)),
      );
      await load();
    } catch (error) {
      setDupError(branchesErrorMessage(error, strings));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <BranchDetailSkeleton />;

  if (loadError || !branch) {
    return (
      <div className={styles.stack}>
        <section className={styles.panel}>
          <LoadErrorState
            view={loadError ?? toLoadErrorView(null, strings, strings.errors.generic, false)}
            strings={strings}
            onRetry={() => void load()}
          />
        </section>
      </div>
    );
  }

  const archived = branch.status === "archived";
  const readOnly = sessionKind === "suspended";
  const canEdit = !readOnly && !archived;
  const activeServices = services.filter((s) => s.status === "active").length;
  const atServiceLimit = activeServices >= BRANCH_LIMITS.maxActiveServices;

  return (
    <div className={styles.stack}>
      <PendingBranchesHint />
      {success ? (
        <div className={styles.alertSuccess} role="status">
          {success}
        </div>
      ) : null}
      {actionError && !panel ? (
        <div className={styles.alertError} role="alert">
          {actionError}
        </div>
      ) : null}

      {panel?.kind === "editBranch" ? (
        <BranchForm
          branch={branch}
          isSaving={isSaving}
          serverError={actionError}
          onSubmit={(payload: BranchPayload) =>
            void run(() => updateBranch(branchId, payload), () => {
              setPanel(null);
              setSuccess(t.saveSuccess);
            })
          }
          onCancel={() => {
            setPanel(null);
            setActionError(null);
          }}
        />
      ) : (
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle} title={branch.name}>
              {branch.name}
            </h2>
            <StatusBadge
              tone={archived ? "neutral" : "success"}
              label={archived ? t.archivedBadge : t.activeBadge}
              status={branch.status}
            />
          </div>
          <p className={styles.cardLine}>{branch.address}</p>
          <p className={styles.cardLine}>
            <bdi dir="ltr">{branch.phone}</bdi>
          </p>
          {branch.homeVisit.enabled ? (
            <div className={styles.badgeRow}>
              <StatusBadge tone="confirmed" label={t.homeVisitBadge} />
            </div>
          ) : null}
          {canOpenAvailability(branch, profile.vendorType) ? (
            <div className={styles.actions}>
              <Link className={styles.linkButton} href={Routes.vendor.branchAvailability(branchId)}>
                {strings.availability.open}
              </Link>
            </div>
          ) : null}
          {!readOnly ? (
            <div className={styles.actions}>
              {archived ? (
                <button
                  type="button"
                  className={styles.secondaryButton}
                  disabled={isSaving}
                  onClick={() => void run(() => setBranchStatus(branchId, "active"))}
                >
                  {t.restore}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => {
                      setSuccess(null);
                      setActionError(null);
                      setPanel({ kind: "editBranch" });
                    }}
                  >
                    {t.edit}
                  </button>
                  <button
                    type="button"
                    className={styles.dangerButton}
                    onClick={() => setConfirm({ kind: "branch" })}
                  >
                    {t.archive}
                  </button>
                </>
              )}
            </div>
          ) : (
            <p className={styles.muted}>{t.readOnlyHint}</p>
          )}
        </section>
      )}

      {deal ? <BranchDealCard deal={deal} strings={strings} locale={locale} /> : null}

      {panel?.kind === "newService" || panel?.kind === "editService" ? (
        <ServiceForm
          key={panel.kind === "editService" ? panel.service.serviceId : "new"}
          service={panel.kind === "editService" ? panel.service : null}
          isSaving={isSaving}
          serverError={actionError}
          onSubmit={(payload, photo) => void saveService(payload, photo)}
          onCancel={() => {
            setPanel(null);
            setActionError(null);
          }}
        />
      ) : null}

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>{strings.services.title}</h2>
          {canEdit ? (
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => void openDuplicate()}
              >
                {strings.services.duplicate.open}
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                disabled={atServiceLimit}
                onClick={() => {
                  setSuccess(null);
                  setActionError(null);
                  setPanel({ kind: "newService" });
                }}
              >
                {strings.services.add}
              </button>
            </div>
          ) : null}
        </div>
        <ServicesTable
          services={services}
          strings={strings}
          locale={locale}
          readOnly={!canEdit}
          onEdit={(service) => {
            setSuccess(null);
            setActionError(null);
            setPanel({ kind: "editService", service });
          }}
          onArchive={(service) => setConfirm({ kind: "service", service })}
          onRestore={(service) =>
            void run(() => setServiceStatus(branchId, service.serviceId, "active"))
          }
        />
      </section>

      <DuplicateServicesDialog
        key={dupFrom}
        open={dupOpen}
        strings={strings}
        locale={locale}
        sources={dupSources}
        fromBranchId={dupFrom}
        onFromChange={(value) => {
          setDupFrom(value);
          void loadDupServices(value);
        }}
        services={dupServices}
        isSubmitting={isSaving}
        error={dupError}
        resultMessage={dupResult}
        onSubmit={(input) => void submitDuplicate(input)}
        onClose={() => setDupOpen(false)}
      />

      <LogoutConfirmDialog
        open={confirm !== null}
        title={confirm?.kind === "service" ? strings.services.archive : t.archive}
        message={confirm?.kind === "service" ? strings.services.archiveConfirm : t.archiveConfirm}
        confirmLabel={confirm?.kind === "service" ? strings.services.archive : t.archive}
        cancelLabel={strings.common.cancel}
        isConfirming={isSaving}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          const target = confirm;
          if (!target) return;
          await run(() =>
            target.kind === "service"
              ? setServiceStatus(branchId, target.service.serviceId, "archived")
              : setBranchStatus(branchId, "archived"),
          );
          setConfirm(null);
        }}
      />
    </div>
  );
}
