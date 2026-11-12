"use client";

import { useState, type FormEvent } from "react";

import {
  parseBranchForm,
  type BranchFormField,
  type BranchFormValues,
} from "@/features/branches/domain/schemas";
import {
  BRANCH_LIMITS,
  DEFAULT_BRANCH_LOCATION,
  type Branch,
  type BranchPayload,
} from "@/features/branches/domain/types";
import { CoverageMap } from "@/features/coverage/presentation/CoverageMap";
import { piastresToEgp } from "@/features/products/domain/currency";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./branches.module.css";

type BranchFormProps = {
  branch?: Branch | null;
  isSaving: boolean;
  serverError: string | null;
  onSubmit: (payload: BranchPayload) => void;
  onCancel: () => void;
};

export function initialBranchValues(branch?: Branch | null): BranchFormValues {
  const location = branch?.location ?? DEFAULT_BRANCH_LOCATION;
  const homeVisit = branch?.homeVisit;
  return {
    name: branch?.name ?? "",
    address: branch?.address ?? "",
    lat: String(location.lat),
    lng: String(location.lng),
    phone: branch?.phone ?? "",
    homeVisitEnabled: homeVisit?.enabled ?? false,
    homeVisitFeeEgp: homeVisit?.enabled ? String(piastresToEgp(homeVisit.feePiastres)) : "",
    homeVisitRadiusMeters: homeVisit?.enabled
      ? String(homeVisit.radiusMeters)
      : String(BRANCH_LIMITS.minRadiusMeters * 6),
  };
}

export function BranchForm({ branch, isSaving, serverError, onSubmit, onCancel }: BranchFormProps) {
  const strings = useStrings();
  const t = strings.branches;
  const [values, setValues] = useState<BranchFormValues>(() => initialBranchValues(branch));
  const [errors, setErrors] = useState<Partial<Record<BranchFormField, true>>>({});

  function set<K extends keyof BranchFormValues>(key: K, value: BranchFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = parseBranchForm(values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    onSubmit(result.payload);
  }

  const lat = Number(values.lat);
  const lng = Number(values.lng);
  const mapLat = Number.isFinite(lat) ? lat : DEFAULT_BRANCH_LOCATION.lat;
  const mapLng = Number.isFinite(lng) ? lng : DEFAULT_BRANCH_LOCATION.lng;
  const radius = values.homeVisitEnabled ? Number(values.homeVisitRadiusMeters) || 0 : 0;

  function inputClass(field: BranchFormField) {
    return errors[field] ? `${styles.input} ${styles.inputInvalid}` : styles.input;
  }

  function fieldError(field: BranchFormField) {
    return errors[field] ? (
      <p className={styles.fieldError} role="alert">
        {t.validation[field]}
      </p>
    ) : null;
  }

  return (
    <form className={`${styles.panel} ${styles.form}`} onSubmit={handleSubmit} noValidate>
      <h2 className={styles.panelTitle}>{branch ? t.edit : t.add}</h2>
      {serverError ? (
        <div className={styles.alertError} role="alert">
          {serverError}
        </div>
      ) : null}

      <div className={styles.fieldGrid}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="branch-name">
            {t.fields.name}
          </label>
          <input
            id="branch-name"
            className={inputClass("name")}
            value={values.name}
            maxLength={BRANCH_LIMITS.nameMax}
            onChange={(e) => set("name", e.target.value)}
          />
          {fieldError("name")}
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="branch-phone">
            {t.fields.phone}
          </label>
          <input
            id="branch-phone"
            className={inputClass("phone")}
            type="tel"
            dir="ltr"
            value={values.phone}
            maxLength={BRANCH_LIMITS.phoneMax}
            onChange={(e) => set("phone", e.target.value)}
          />
          {fieldError("phone")}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="branch-address">
          {t.fields.address}
        </label>
        <input
          id="branch-address"
          className={inputClass("address")}
          value={values.address}
          maxLength={BRANCH_LIMITS.addressMax}
          onChange={(e) => set("address", e.target.value)}
        />
        {fieldError("address")}
      </div>

      <div className={styles.mapBlock}>
        <span className={styles.label}>{t.fields.location}</span>
        <p className={styles.muted}>{t.mapHint}</p>
        <CoverageMap
          lat={mapLat}
          lng={mapLng}
          radiusMeters={radius}
          onPick={(nextLat, nextLng) => {
            setValues((prev) => ({ ...prev, lat: String(nextLat), lng: String(nextLng) }));
          }}
        />
        <div className={styles.fieldGrid}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="branch-lat">
              {t.latitude}
            </label>
            <input
              id="branch-lat"
              className={inputClass("location")}
              inputMode="decimal"
              dir="ltr"
              value={values.lat}
              onChange={(e) => set("lat", e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="branch-lng">
              {t.longitude}
            </label>
            <input
              id="branch-lng"
              className={inputClass("location")}
              inputMode="decimal"
              dir="ltr"
              value={values.lng}
              onChange={(e) => set("lng", e.target.value)}
            />
          </div>
        </div>
        {fieldError("location")}
      </div>

      <label className={styles.checkboxRow}>
        <input
          type="checkbox"
          checked={values.homeVisitEnabled}
          onChange={(e) => set("homeVisitEnabled", e.target.checked)}
        />
        <span>{t.fields.homeVisit}</span>
      </label>

      {values.homeVisitEnabled ? (
        <div className={styles.fieldGrid}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="branch-home-fee">
              {t.fields.homeVisitFee}
            </label>
            <input
              id="branch-home-fee"
              className={inputClass("homeVisitFee")}
              inputMode="decimal"
              dir="ltr"
              value={values.homeVisitFeeEgp}
              onChange={(e) => set("homeVisitFeeEgp", e.target.value)}
            />
            {fieldError("homeVisitFee")}
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="branch-home-radius">
              {t.fields.homeVisitRadius}
            </label>
            <input
              id="branch-home-radius"
              className={inputClass("homeVisitRadius")}
              inputMode="numeric"
              dir="ltr"
              value={values.homeVisitRadiusMeters}
              onChange={(e) => set("homeVisitRadiusMeters", e.target.value)}
            />
            {fieldError("homeVisitRadius")}
          </div>
        </div>
      ) : null}

      <div className={styles.actions}>
        <button type="submit" className={styles.primaryButton} disabled={isSaving}>
          {isSaving ? t.saving : t.save}
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={onCancel}
          disabled={isSaving}
        >
          {strings.common.cancel}
        </button>
      </div>
    </form>
  );
}
