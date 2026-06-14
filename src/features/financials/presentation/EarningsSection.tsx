"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchVendorEarningsFromApi } from "@/features/financials/application/earnings.api";
import type {
  VendorEarningsEntry,
  VendorEarningsSummary,
} from "@/features/financials/domain/types";
import { EarningsSkeleton } from "@/features/financials/presentation/EarningsSkeleton";
import { formatEgp } from "@/features/products/domain/currency";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./earnings.module.css";

function formatDate(date: Date): string {
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function EarningsSection() {
  const strings = useStrings();
  const [summary, setSummary] = useState<VendorEarningsSummary | null>(null);
  const [entries, setEntries] = useState<VendorEarningsEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEarnings = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const page = await fetchVendorEarningsFromApi();
      setSummary(page.summary);
      setEntries(page.entries);
    } catch {
      setError(strings.earnings.loadError);
    } finally {
      setIsLoading(false);
    }
  }, [strings.earnings.loadError]);

  useEffect(() => {
    void loadEarnings();
  }, [loadEarnings]);

  if (isLoading) return <EarningsSkeleton />;

  return (
    <section className={styles.sectionStack}>
      {error ? <div className={styles.alertError}>{error}</div> : null}

      <div className={styles.statsGrid}>
        <article className={styles.statCard}>
          <span className={styles.statLabel}>{strings.earnings.summarySales}</span>
          <p className={styles.statValue}>
            {formatEgp(summary?.totalSalesPiastres ?? 0)}
          </p>
        </article>
        <article className={styles.statCard}>
          <span className={styles.statLabel}>{strings.earnings.summaryCommission}</span>
          <p className={styles.statValue}>
            {formatEgp(summary?.totalCommissionPiastres ?? 0)}
          </p>
        </article>
        <article className={`${styles.statCard} ${styles.statCardHighlight}`}>
          <span className={styles.statLabel}>{strings.earnings.summaryNet}</span>
          <p className={styles.statValue}>
            {formatEgp(summary?.netEarningsPiastres ?? 0)}
          </p>
        </article>
        <article className={styles.statCard}>
          <span className={styles.statLabel}>{strings.earnings.summaryPending}</span>
          <p className={styles.statValue}>
            {formatEgp(summary?.pendingPayoutPiastres ?? 0)}
          </p>
        </article>
      </div>

      <article className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2>{strings.earnings.ledgerTitle}</h2>
        </div>
        {entries.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>{strings.earnings.emptyTitle}</h3>
            <p>{strings.earnings.emptyDescription}</p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>{strings.earnings.tableDate}</th>
                  <th>{strings.earnings.tableType}</th>
                  <th>{strings.earnings.tableDescription}</th>
                  <th>{strings.earnings.tableAmount}</th>
                  <th>{strings.earnings.tableCommission}</th>
                  <th>{strings.earnings.tableNet}</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.entryId}>
                    <td>{formatDate(entry.createdAt)}</td>
                    <td>{strings.earnings.typeLabels[entry.type]}</td>
                    <td>{entry.description ?? "—"}</td>
                    <td>{formatEgp(entry.amountPiastres)}</td>
                    <td>{formatEgp(entry.commissionPiastres)}</td>
                    <td>{formatEgp(entry.netPiastres)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
}
