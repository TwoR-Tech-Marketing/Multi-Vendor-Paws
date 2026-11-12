"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getBranchAvailability,
  listBranchSlots,
  saveBranchAvailability,
  setBranchAvailabilityException,
} from "@/features/availability/application/availability.api";
import {
  applyReload,
  applySaved,
  classifyWriteError,
  isDirty,
  type EditorData,
  type WriteKind,
} from "@/features/availability/application/availability-write";
import { validateWeekly, wouldExceedExceptionLimit } from "@/features/availability/domain/schemas";
import { addDays, monthOf } from "@/features/availability/domain/time";
import {
  AVAILABILITY_LIMITS,
  type Availability,
  type AvailabilityConflict,
  type AvailabilityException,
  type AvailabilityMode,
  type SlotPreview as SlotPreviewData,
  type WeeklyPayload,
} from "@/features/availability/domain/types";
import { availabilityErrorMessage } from "@/features/availability/presentation/availability-copy";
import { AvailabilitySkeleton } from "@/features/availability/presentation/AvailabilitySkeleton";
import { AvailabilityTabs, type AvailabilityTab } from "@/features/availability/presentation/AvailabilityTabs";
import { CapacityStepper } from "@/features/availability/presentation/CapacityStepper";
import { ConflictsDialog } from "@/features/availability/presentation/ConflictsDialog";
import { ExceptionEditor } from "@/features/availability/presentation/ExceptionEditor";
import { ExceptionsCalendar } from "@/features/availability/presentation/ExceptionsCalendar";
import { HomeVisitSummary } from "@/features/availability/presentation/HomeVisitSummary";
import { SlotPreview } from "@/features/availability/presentation/SlotPreview";
import { UpcomingExceptions } from "@/features/availability/presentation/UpcomingExceptions";
import { WeeklyEditor } from "@/features/availability/presentation/WeeklyEditor";
import { getBranch } from "@/features/branches/application/branches.api";
import type { Branch, BranchService } from "@/features/branches/domain/types";
import { usePortalSession } from "@/features/vendor/presentation/PortalSessionContext";
import { usePreferences, useStrings } from "@/shared/preferences/PreferencesContext";

import branchStyles from "@/features/branches/presentation/branches.module.css";
import styles from "./availability.module.css";

type PendingWrite = {
  kind: WriteKind;
  conflicts: AvailabilityConflict[];
  kept: string[];
  retry: (keep: string[]) => Promise<Availability>;
};

const MAX_PREVIEW_WEEK = Math.floor(
  AVAILABILITY_LIMITS.bookingWindowDays / AVAILABILITY_LIMITS.previewDays,
);

export function AvailabilitySection({ branchId }: { branchId: string }) {
  const strings = useStrings();
  const { locale } = usePreferences();
  const { sessionKind } = usePortalSession();
  const t = strings.availability;

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [data, setData] = useState<EditorData | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [services, setServices] = useState<BranchService[]>([]);
  const [tab, setTab] = useState<AvailabilityTab>("weekly");
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [versionChanged, setVersionChanged] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingWrite | null>(null);

  const [month, setMonth] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [serviceId, setServiceId] = useState("");
  const [mode, setMode] = useState<AvailabilityMode>("branch");
  const [week, setWeek] = useState(0);
  const [preview, setPreview] = useState<SlotPreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [loaded, detail] = await Promise.all([
        getBranchAvailability(branchId),
        getBranch(branchId, { includeArchived: true }),
      ]);
      setData((previous) => applyReload(previous, loaded));
      setBranch(detail.branch);
      const active = detail.services.filter((s) => s.status === "active");
      setServices(active);
      setServiceId((current) => current || active[0]?.serviceId || "");
      setMonth((current) => current || monthOf(loaded.todayDate));
      setVersionChanged(false);
      setPending(null);
    } catch (error) {
      setLoadError(availabilityErrorMessage(error, strings));
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

  const state = data?.state ?? null;
  const draft = data?.draft ?? null;
  const todayDate = state?.todayDate ?? "";
  const loadPreview = useCallback(async () => {
    if (!serviceId || !todayDate) return;
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const fromDate = addDays(todayDate, week * AVAILABILITY_LIMITS.previewDays);
      const lastDay = Math.min(
        (week + 1) * AVAILABILITY_LIMITS.previewDays - 1,
        AVAILABILITY_LIMITS.bookingWindowDays,
      );
      setPreview(
        await listBranchSlots({
          branchId,
          serviceId,
          mode,
          fromDate,
          toDate: addDays(todayDate, lastDay),
        }),
      );
    } catch (error) {
      setPreviewError(availabilityErrorMessage(error, strings));
    } finally {
      setPreviewLoading(false);
    }
  }, [branchId, serviceId, mode, week, todayDate, strings]);

  useEffect(() => {
    if (tab !== "preview") return;
    const timer = window.setTimeout(() => {
      void loadPreview();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [tab, loadPreview, state?.availability.version]);

  /**
   * Runs a write. Outcomes come from the pure helpers: conflicts open the
   * dialog, a version mismatch asks to reload, the draft is never dropped.
   */
  async function runWrite(
    kind: WriteKind,
    attempt: (keep: string[]) => Promise<Availability>,
    keep: string[] = [],
  ) {
    setIsSaving(true);
    setActionError(null);
    setSuccess(null);
    try {
      const saved = await attempt(keep);
      setData((current) => (current ? applySaved(kind, current, saved) : current));
      setPending(null);
      setSuccess(t.saved);
    } catch (error) {
      const failure = classifyWriteError(error, keep);
      setPending(failure.type === "conflicts" ? { kind, ...failure, retry: attempt } : null);
      if (failure.type === "versionChanged") setVersionChanged(true);
      if (failure.type === "error") {
        setActionError(
          failure.key === "generic" ? strings.errors.generic : strings.errors.availability[failure.key],
        );
      }
    } finally {
      setIsSaving(false);
    }
  }

  function setDraft(next: WeeklyPayload) {
    setData((current) => (current ? { ...current, draft: next } : current));
  }

  if (isLoading) return <AvailabilitySkeleton />;

  if (loadError || !state || !draft || !branch) {
    return (
      <div className={branchStyles.stack}>
        <div className={branchStyles.alertError} role="alert">
          {loadError ?? strings.errors.generic}
        </div>
        <div className={branchStyles.actions}>
          <button type="button" className={branchStyles.secondaryButton} onClick={() => void load()}>
            {strings.common.retry}
          </button>
        </div>
      </div>
    );
  }

  const availability = state.availability;
  const archived = branch.status === "archived";
  const readOnly = sessionKind === "suspended" || archived;
  const validation = validateWeekly(draft.weekly);
  const homeValidation = validateWeekly(draft.homeVisitWeekly);
  const dirty = isDirty(draft, availability);
  const canSave = !readOnly && dirty && validation.ok && homeValidation.ok && !isSaving;

  function saveWeekly() {
    if (!draft || !validation.ok || !homeValidation.ok) return;
    const payload: WeeklyPayload = {
      ...draft,
      weekly: validation.weekly,
      homeVisitWeekly: homeValidation.weekly,
    };
    const expectedVersion = availability.version;
    void runWrite("weekly", (keep) =>
      saveBranchAvailability({ branchId, expectedVersion, payload, keepAppointmentIds: keep }),
    );
  }

  function writeException(date: string, exception: AvailabilityException | null) {
    const expectedVersion = availability.version;
    void runWrite("exception", (keep) =>
      setBranchAvailabilityException({
        branchId,
        expectedVersion,
        date,
        exception,
        keepAppointmentIds: keep,
      }),
    );
  }

  const saveBar = readOnly ? null : (
    <div className={styles.saveBar}>
      <span className={branchStyles.muted}>{dirty ? t.unsavedHint : ""}</span>
      <button type="button" className={branchStyles.primaryButton} disabled={!canSave} onClick={saveWeekly}>
        {isSaving ? t.saving : t.save}
      </button>
    </div>
  );

  return (
    <div className={branchStyles.stack}>
      <section className={branchStyles.panel}>
        <div className={branchStyles.panelHeader}>
          <h2 className={branchStyles.panelTitle}>{branch.name}</h2>
        </div>
        {sessionKind === "suspended" ? <p className={branchStyles.muted}>{t.readOnlyHint}</p> : null}
        {archived ? <p className={branchStyles.muted}>{t.archivedHint}</p> : null}
        <AvailabilityTabs value={tab} strings={strings} onChange={setTab} />
      </section>

      {success ? (
        <div className={branchStyles.alertSuccess} role="status">
          {success}
        </div>
      ) : null}
      {actionError ? (
        <div className={branchStyles.alertError} role="alert">
          {actionError}
        </div>
      ) : null}
      {versionChanged ? (
        <div className={branchStyles.alertError} role="alert">
          <div className={branchStyles.panelHeader}>
            <span>{strings.errors.availability.versionChanged}</span>
            <button type="button" className={branchStyles.secondaryButton} onClick={() => void load()}>
              {t.reload}
            </button>
          </div>
        </div>
      ) : null}

      {tab === "weekly" ? (
        <section className={branchStyles.panel} aria-label={t.weekly}>
          <h2 className={branchStyles.panelTitle}>{t.weekly}</h2>
          <WeeklyEditor
            weekly={draft.weekly}
            errors={validation.ok ? {} : validation.errors}
            strings={strings}
            readOnly={readOnly}
            onChange={(weekly) => setDraft({ ...draft, weekly })}
          />
          <CapacityStepper
            label={t.capacity}
            value={draft.capacity}
            strings={strings}
            readOnly={readOnly}
            onChange={(capacity) => setDraft({ ...draft, capacity })}
          />
          {saveBar}
        </section>
      ) : null}

      {tab === "homeVisit" ? (
        <section className={branchStyles.panel} aria-label={t.homeVisit}>
          <h2 className={branchStyles.panelTitle}>{t.homeVisit}</h2>
          <HomeVisitSummary branchId={branchId} homeVisit={state.homeVisit} strings={strings} />
          {state.homeVisit.enabled ? (
            <>
              <WeeklyEditor
                weekly={draft.homeVisitWeekly}
                errors={homeValidation.ok ? {} : homeValidation.errors}
                strings={strings}
                readOnly={readOnly}
                onChange={(homeVisitWeekly) => setDraft({ ...draft, homeVisitWeekly })}
              />
              <CapacityStepper
                label={t.homeVisitCapacity}
                value={draft.homeVisitCapacity}
                strings={strings}
                readOnly={readOnly}
                onChange={(homeVisitCapacity) => setDraft({ ...draft, homeVisitCapacity })}
              />
              {saveBar}
            </>
          ) : null}
        </section>
      ) : null}

      {tab === "exceptions" ? (
        <section className={branchStyles.panel} aria-label={t.exceptions.title}>
          <h2 className={branchStyles.panelTitle}>{t.exceptions.title}</h2>
          <div className={styles.exceptionsLayout}>
            <div className={branchStyles.stack}>
              <ExceptionsCalendar
                month={month}
                todayDate={todayDate}
                selectedDate={selectedDate}
                exceptions={availability.exceptions}
                strings={strings}
                locale={locale}
                onMonthChange={setMonth}
                onSelect={(date) => {
                  setSuccess(null);
                  setSelectedDate(date);
                }}
              />
              <UpcomingExceptions
                exceptions={availability.exceptions}
                todayDate={todayDate}
                strings={strings}
                locale={locale}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setMonth(monthOf(date));
                }}
              />
            </div>
            {selectedDate ? (
              <ExceptionEditor
                key={`${selectedDate}-${availability.version}`}
                date={selectedDate}
                todayDate={todayDate}
                exception={availability.exceptions[selectedDate] ?? null}
                homeVisitEnabled={state.homeVisit.enabled}
                atLimit={wouldExceedExceptionLimit(availability.exceptions, selectedDate, todayDate)}
                strings={strings}
                locale={locale}
                readOnly={readOnly}
                isSaving={isSaving}
                onSave={(exception) => writeException(selectedDate, exception)}
                onRemove={() => writeException(selectedDate, null)}
              />
            ) : (
              <p className={branchStyles.muted}>{t.exceptions.pickDay}</p>
            )}
          </div>
        </section>
      ) : null}

      {tab === "preview" ? (
        <section className={branchStyles.panel} aria-label={t.preview.title}>
          <h2 className={branchStyles.panelTitle}>{t.preview.title}</h2>
          <SlotPreview
            services={services}
            serviceId={serviceId}
            mode={mode}
            homeVisitEnabled={state.homeVisit.enabled}
            preview={preview}
            isLoading={previewLoading}
            error={previewError}
            hasUnsavedChanges={dirty}
            canPrevWeek={week > 0}
            canNextWeek={week < MAX_PREVIEW_WEEK}
            strings={strings}
            locale={locale}
            onServiceChange={setServiceId}
            onModeChange={setMode}
            onPrevWeek={() => setWeek((w) => Math.max(0, w - 1))}
            onNextWeek={() => setWeek((w) => Math.min(MAX_PREVIEW_WEEK, w + 1))}
          />
        </section>
      ) : null}

      {pending ? (
        <ConflictsDialog
          key={pending.conflicts.map((c) => c.appointmentId).join(",")}
          conflicts={pending.conflicts}
          initialKept={pending.kept}
          services={services}
          strings={strings}
          locale={locale}
          isSubmitting={isSaving}
          onSubmit={(keep) => void runWrite(pending.kind, pending.retry, keep)}
          onClose={() => setPending(null)}
        />
      ) : null}
    </div>
  );
}
