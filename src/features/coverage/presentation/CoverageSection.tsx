"use client";

import { useCallback, useEffect, useState } from "react";

import { LoadErrorState } from "@/components/ui/error-state/LoadErrorState";
import { toLoadErrorView, type LoadErrorView } from "@/components/ui/error-state/load-error";

import {
  fetchGovernoratesForCoverage,
  fetchMyDeliveryCoverage,
  saveMyDeliveryCoverage,
} from "@/features/coverage/application/coverage.api";
import type {
  CoverageMode,
  DeliveryCoverage,
  GovernorateOption,
} from "@/features/coverage/domain/types";
import {
  MAX_RADIUS_METERS,
  MIN_RADIUS_METERS,
} from "@/features/coverage/domain/types";
import { CoverageMap } from "@/features/coverage/presentation/CoverageMap";
import { CoverageModeToggle } from "@/features/coverage/presentation/CoverageModeToggle";
import { CoverageSkeleton } from "@/features/coverage/presentation/CoverageSkeleton";
import { usePreferences, useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./coverage.module.css";

const DEFAULT_ZONE = {
  lat: 30.0444,
  lng: 31.2357,
  radiusMeters: 5000,
};

export function CoverageSection() {
  const strings = useStrings();
  const { locale } = usePreferences();
  const t = strings.coverage;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<LoadErrorView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [vendorType, setVendorType] = useState("store");
  const [mode, setMode] = useState<CoverageMode>("zone");
  const [lat, setLat] = useState(DEFAULT_ZONE.lat);
  const [lng, setLng] = useState(DEFAULT_ZONE.lng);
  const [radiusMeters, setRadiusMeters] = useState(DEFAULT_ZONE.radiusMeters);
  const [governorateIds, setGovernorateIds] = useState<string[]>([]);
  const [governorates, setGovernorates] = useState<GovernorateOption[]>([]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    setError(null);
    try {
      const [mine, govs] = await Promise.all([
        fetchMyDeliveryCoverage(),
        fetchGovernoratesForCoverage(),
      ]);
      setVendorType(mine.vendorType || "store");
      setGovernorates(govs);
      const coverage = mine.deliveryCoverage;
      if (coverage?.mode === "zone" && coverage.zone) {
        setMode("zone");
        setLat(coverage.zone.lat);
        setLng(coverage.zone.lng);
        setRadiusMeters(coverage.zone.radiusMeters);
      } else if (coverage?.mode === "governorates") {
        setMode("governorates");
        setGovernorateIds(coverage.governorateIds || []);
      }
    } catch (cause) {
      setLoadError(toLoadErrorView(cause, strings, t.loadError));
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

  function buildPayload(): DeliveryCoverage | null {
    if (mode === "zone") {
      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        !Number.isFinite(radiusMeters) ||
        radiusMeters < MIN_RADIUS_METERS ||
        radiusMeters > MAX_RADIUS_METERS
      ) {
        setError(t.radiusInvalid);
        return null;
      }
      return {
        mode: "zone",
        zone: { lat, lng, radiusMeters: Math.trunc(radiusMeters) },
        governorateIds: [],
      };
    }
    if (governorateIds.length < 1) {
      setError(t.governoratesRequired);
      return null;
    }
    return {
      mode: "governorates",
      zone: null,
      governorateIds,
    };
  }

  async function onSave() {
    setSuccess(null);
    setError(null);
    const payload = buildPayload();
    if (!payload) return;
    setIsSaving(true);
    try {
      await saveMyDeliveryCoverage(payload);
      setSuccess(t.saveSuccess);
    } catch {
      setError(t.saveError);
    } finally {
      setIsSaving(false);
    }
  }

  function toggleGovernorate(id: string) {
    setGovernorateIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  if (isLoading) return <CoverageSkeleton />;

  if (loadError) {
    return (
      <div className={styles.sectionStack}>
        <section className={styles.panel}>
          <LoadErrorState view={loadError} strings={strings} onRetry={() => void load()} />
        </section>
      </div>
    );
  }

  if (vendorType && vendorType !== "store") {
    return (
      <div className={styles.sectionStack}>
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>{t.title}</h2>
          <p className={styles.hint}>{t.notForVendorType}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.sectionStack}>
      <div className={styles.panel}>
        <h2 className={styles.panelTitle}>{t.title}</h2>
        <p className={styles.hint}>{t.subtitle}</p>

        {error ? (
          <div className={styles.alertError} role="alert">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className={styles.alertSuccess} role="status">
            {success}
          </div>
        ) : null}

        <CoverageModeToggle mode={mode} strings={strings} onChange={setMode} />

        {mode === "zone" ? (
          <>
            <CoverageMap
              lat={lat}
              lng={lng}
              radiusMeters={radiusMeters}
              onPick={(nextLat, nextLng) => {
                setLat(nextLat);
                setLng(nextLng);
              }}
            />
            <div className={styles.fieldGrid}>
              <div>
                <label className={styles.fieldLabel} htmlFor="coverage-lat">
                  {t.latLabel}
                </label>
                <input
                  id="coverage-lat"
                  className={styles.input}
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(Number(e.target.value))}
                />
              </div>
              <div>
                <label className={styles.fieldLabel} htmlFor="coverage-lng">
                  {t.lngLabel}
                </label>
                <input
                  id="coverage-lng"
                  className={styles.input}
                  type="number"
                  step="any"
                  value={lng}
                  onChange={(e) => setLng(Number(e.target.value))}
                />
              </div>
              <div>
                <label className={styles.fieldLabel} htmlFor="coverage-radius">
                  {t.radiusLabel}
                </label>
                <input
                  id="coverage-radius"
                  className={styles.input}
                  type="number"
                  min={MIN_RADIUS_METERS}
                  max={MAX_RADIUS_METERS}
                  value={radiusMeters}
                  onChange={(e) => setRadiusMeters(Number(e.target.value))}
                />
              </div>
            </div>
          </>
        ) : (
          <div className={styles.govList}>
            {governorates.map((g) => {
              const label = locale === "ar" ? g.nameAr : g.nameEn;
              const checked = governorateIds.includes(g.id);
              return (
                <label key={g.id} className={styles.govItem}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleGovernorate(g.id)}
                  />
                  <span>{label}</span>
                </label>
              );
            })}
          </div>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryButton}
            disabled={isSaving}
            onClick={() => void onSave()}
          >
            {isSaving ? t.saving : t.save}
          </button>
        </div>
      </div>
    </div>
  );
}
