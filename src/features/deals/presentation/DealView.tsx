import Link from "next/link";

import { Routes } from "@/constants/routes";
import { hasBranchDeals, hasUpcomingDeal, type VendorDealView } from "@/features/deals/domain/types";
import { DealBranchesTable } from "@/features/deals/presentation/DealBranchesTable";
import { DealCurrentCard } from "@/features/deals/presentation/DealCurrentCard";
import { DealSkeleton } from "@/features/deals/presentation/DealSkeleton";
import { DealUpcomingCard } from "@/features/deals/presentation/DealUpcomingCard";
import type { AppStrings } from "@/shared/i18n/types";
import type { AppLocale } from "@/shared/preferences/domain/types";

import styles from "./deals.module.css";

export type DealViewProps = {
  strings: AppStrings;
  locale: AppLocale;
  deal: VendorDealView | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  /** Vendor type from the session, used to shape the skeleton before data arrives. */
  vendorType?: string;
};

function ErrorAlert({ strings, error, onRetry }: { strings: AppStrings; error: string; onRetry: () => void }) {
  return (
    <div className={styles.alertError} role="alert">
      <p>{error}</p>
      <button type="button" className={styles.retryButton} onClick={onRetry}>
        {strings.common.retry}
      </button>
    </div>
  );
}

function DealLinks({ strings }: { strings: AppStrings }) {
  return (
    <nav className={styles.linkRow} aria-label={strings.deals.title}>
      <Link href={Routes.vendor.earnings} className={styles.link}>
        {strings.deals.viewEarnings}
      </Link>
      <Link href={Routes.vendor.payouts} className={styles.link}>
        {strings.deals.viewStatement}
      </Link>
    </nav>
  );
}

/** Read only deal: today's fee, any upcoming deal and per branch fees. */
export function DealView({ strings, locale, deal, isLoading, error, onRetry, vendorType }: DealViewProps) {
  const t = strings.deals;
  if (isLoading) {
    return (
      <DealSkeleton label={strings.common.loading} withBranches={hasBranchDeals(vendorType ?? "")} />
    );
  }
  if (!deal) {
    return (
      <section className={styles.sectionStack}>
        <ErrorAlert strings={strings} error={error ?? t.loadError} onRetry={onRetry} />
        <DealLinks strings={strings} />
      </section>
    );
  }

  return (
    <section className={styles.sectionStack} aria-label={t.title}>
      {error ? <ErrorAlert strings={strings} error={error} onRetry={onRetry} /> : null}
      <DealLinks strings={strings} />
      <DealCurrentCard current={deal.current} defaultPercent={deal.defaultPercent} strings={strings} />
      {hasUpcomingDeal(deal) && deal.vendorDeal ? (
        <DealUpcomingCard
          deal={deal.vendorDeal}
          effectiveFromMs={deal.effectiveFromMs}
          strings={strings}
          locale={locale}
        />
      ) : null}
      {hasBranchDeals(deal.vendorType) ? (
        <DealBranchesTable branches={deal.branches} strings={strings} />
      ) : null}
    </section>
  );
}
