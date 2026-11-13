"use client";

import { useCallback, useEffect, useState } from "react";

import { StatusBadge } from "@/components/ui/badge/StatusBadge";
import type { AppStrings } from "@/shared/i18n/types";

import {
  fetchMyVendorDocuments,
  fetchVendorDocumentRequirements,
  type VendorDocumentRequirement,
  type VendorDocumentRow,
} from "@/features/vendor/infrastructure/vendor-documents.api";
import {useStrings} from "@/shared/preferences/PreferencesContext";

import styles from "./profile.module.css";

type VendorDocumentsSectionProps = {
  vendorType?: string;
};

const DOCUMENT_TONES = {
  approved: "success",
  pending: "warning",
  rejected: "danger",
} as const;

/** Text badge for one document: approved, under review, needs a new file or missing. */
export function DocumentStatusBadge({
  status,
  strings,
}: {
  status: "pending" | "approved" | "rejected" | null;
  strings: AppStrings;
}) {
  const t = strings.accountStatus;
  if (!status) return <StatusBadge tone="neutral" label={t.documentsMissing} />;
  const labels = {
    approved: t.documentApproved,
    pending: t.documentPending,
    rejected: t.documentRejected,
  };
  return <StatusBadge tone={DOCUMENT_TONES[status]} label={labels[status]} status={status} />;
}

export function VendorDocumentsSection({
  vendorType = "store",
}: VendorDocumentsSectionProps) {
  const strings = useStrings();
  const [requirements, setRequirements] = useState<VendorDocumentRequirement[]>(
    [],
  );
  const [documents, setDocuments] = useState<VendorDocumentRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [reqs, docs] = await Promise.all([
      fetchVendorDocumentRequirements(vendorType),
      fetchMyVendorDocuments(),
    ]);
    setRequirements(reqs);
    setDocuments(docs);
  }, [vendorType]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void reload().catch(() => {
        setError(strings.accountStatus.documentsLoadError);
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [reload, strings.accountStatus.documentsLoadError]);

  async function onFileChange(
    requirement: VendorDocumentRequirement,
    file: File | null,
  ) {
    if (!file) return;
    setBusyId(requirement.id);
    setError(null);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("requirementId", requirement.id);
      form.set("vendorType", vendorType);
      const response = await fetch("/api/vendor/documents/upload", {
        method: "POST",
        body: form,
      });
      if (!response.ok) {
        throw new Error("upload_failed");
      }
      await reload();
    } catch {
      setError(strings.accountStatus.documentsSubmitError);
    } finally {
      setBusyId(null);
    }
  }

  if (!requirements.length) {
    return null;
  }

  return (
    <section
      className={styles.panel}
      aria-label={strings.accountStatus.documentsTitle}
    >
      <h2>{strings.accountStatus.documentsTitle}</h2>
      <p>{strings.accountStatus.documentsSubtitle}</p>
      {error ? (
        <p className={styles.errorText} role="alert">
          {error}
        </p>
      ) : null}
      <ul className={styles.documentsList}>
        {requirements.map((requirement) => {
          const row = documents.find((d) => d.requirementId === requirement.id);
          const label =
            typeof document !== "undefined" &&
            document.documentElement.lang === "ar"
              ? requirement.nameAr
              : requirement.nameEn;
          return (
            <li key={requirement.id} className={styles.documentsItem}>
              <div>
                <strong>{label}</strong>
                <DocumentStatusBadge status={row?.status ?? null} strings={strings} />
                {row?.status === "rejected" && row.rejectionReason ? (
                  <span>
                    {strings.accountStatus.reason}: {row.rejectionReason}
                  </span>
                ) : null}
              </div>
              <label className={styles.documentsUpload}>
                <span>
                  {busyId === requirement.id
                    ? strings.common.loading
                    : strings.accountStatus.documentsUpload}
                </span>
                <input
                  type="file"
                  accept={requirement.acceptedTypes?.join(",") || undefined}
                  disabled={busyId === requirement.id}
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    void onFileChange(requirement, file);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
