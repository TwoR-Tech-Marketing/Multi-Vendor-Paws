"use client";

import {useEffect, useState} from "react";

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

  async function reload() {
    const [reqs, docs] = await Promise.all([
      fetchVendorDocumentRequirements(vendorType),
      fetchMyVendorDocuments(),
    ]);
    setRequirements(reqs);
    setDocuments(docs);
  }

  useEffect(() => {
    void reload().catch(() => {
      setError(strings.accountStatus.documentsLoadError);
    });
  }, [vendorType, strings.accountStatus.documentsLoadError]);

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
                <span>
                  {row?.status
                    ? `${strings.accountStatus.status}: ${row.status}`
                    : strings.accountStatus.documentsMissing}
                </span>
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
