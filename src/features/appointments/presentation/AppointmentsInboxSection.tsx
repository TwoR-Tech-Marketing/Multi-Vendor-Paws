"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { listVendorAppointments } from "@/features/appointments/application/appointments.api";
import {
  DEFAULT_APPOINTMENT_FILTERS,
  buildListRequest,
  cairoPresetRange,
  type AppointmentFilters,
  type DatePreset,
} from "@/features/appointments/domain/filters";
import type { AppointmentRow } from "@/features/appointments/domain/types";
import {
  AppointmentsFilters,
  type BranchOption,
} from "@/features/appointments/presentation/AppointmentsFilters";
import { AppointmentsList } from "@/features/appointments/presentation/AppointmentsList";
import {
  AppointmentListSkeleton,
  AppointmentsInboxSkeleton,
} from "@/features/appointments/presentation/AppointmentsSkeletons";
import { appointmentErrorMessage } from "@/features/appointments/presentation/appointments-copy";
import { listBranches } from "@/features/branches/application/branches.api";
import { usePreferences, useStrings } from "@/shared/preferences/PreferencesContext";

import branchStyles from "@/features/branches/presentation/branches.module.css";

type ListState = { items: AppointmentRow[]; nextCursor: string | null };

export function AppointmentsInboxSection() {
  const strings = useStrings();
  const { locale } = usePreferences();
  const t = strings.appointments;

  const [filters, setFilters] = useState<AppointmentFilters>(DEFAULT_APPOINTMENT_FILTERS);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [list, setList] = useState<ListState | null>(null);
  const [isListLoading, setIsListLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);

  const load = useCallback(
    async (current: AppointmentFilters) => {
      const request = buildListRequest(current);
      const id = ++requestRef.current;
      if (!request) {
        setIsListLoading(false);
        return;
      }
      setIsListLoading(true);
      try {
        const page = await listVendorAppointments(request);
        if (id !== requestRef.current) return;
        setList({ items: page.items, nextCursor: page.nextCursor });
        setError(null);
      } catch {
        if (id === requestRef.current) setError(t.loadError);
      } finally {
        if (id === requestRef.current) setIsListLoading(false);
      }
    },
    [t.loadError],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => void load(filters), 0);
    return () => window.clearTimeout(timer);
  }, [filters, load]);

  useEffect(() => {
    let cancelled = false;
    listBranches({ includeArchived: true })
      .then((items) => {
        if (!cancelled) setBranches(items.map((b) => ({ branchId: b.branchId, name: b.name })));
      })
      .catch(() => {
        // The branch filter stays at "All branches"; the list still loads.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function changePreset(preset: DatePreset) {
    setFilters((current) => {
      if (preset !== "custom") return { ...current, datePreset: preset, dateFrom: "", dateTo: "" };
      const prefill = cairoPresetRange(current.datePreset, Date.now()) ?? {
        from: current.dateFrom,
        to: current.dateTo,
      };
      return { ...current, datePreset: "custom", dateFrom: prefill.from, dateTo: prefill.to };
    });
  }

  async function loadMore() {
    if (!list?.nextCursor) return;
    const request = buildListRequest(filters, list.nextCursor);
    if (!request) return;
    const id = requestRef.current;
    setIsLoadingMore(true);
    try {
      const page = await listVendorAppointments(request);
      if (id !== requestRef.current) return;
      setList((prev) => ({
        items: [...(prev?.items ?? []), ...page.items],
        nextCursor: page.nextCursor,
      }));
    } catch (loadError) {
      setError(appointmentErrorMessage(loadError, strings));
    } finally {
      setIsLoadingMore(false);
    }
  }

  if (!list && isListLoading) return <AppointmentsInboxSkeleton />;

  return (
    <div className={branchStyles.stack}>
      {error ? (
        <div className={branchStyles.alertError} role="alert">
          {error}
          <div className={branchStyles.actions}>
            <button
              type="button"
              className={branchStyles.secondaryButton}
              onClick={() => void load(filters)}
            >
              {strings.common.retry}
            </button>
          </div>
        </div>
      ) : null}
      <section className={branchStyles.panel} aria-label={t.title}>
        <AppointmentsFilters
          filters={filters}
          branches={branches}
          strings={strings}
          onChange={setFilters}
          onPresetChange={changePreset}
        />
        {isListLoading ? (
          <AppointmentListSkeleton />
        ) : list ? (
          <AppointmentsList
            items={list.items}
            strings={strings}
            locale={locale}
            hasMore={list.nextCursor !== null}
            isLoadingMore={isLoadingMore}
            onLoadMore={() => void loadMore()}
          />
        ) : null}
      </section>
    </div>
  );
}
