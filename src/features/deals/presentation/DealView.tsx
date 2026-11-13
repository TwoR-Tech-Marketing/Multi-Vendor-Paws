import Link from "next/link";

import { LoadErrorState } from "@/components/ui/error-state/LoadErrorState";
import { toLoadErrorView, type LoadErrorView } from "@/components/ui/error-state/load-error";
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
  /** Load failure: full state without a deal, compact above a kept one. */
  error: LoadErrorView | null;
  onRetry: () => void;
  /** Vendor type from the session, used to shape the skeleton before data arrives. */
  vendorType?: string;
};

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
        <DealLinks strings={strings} />
        <article className={styles.card}>
          <LoadErrorState
            view={error ?? toLoadErrorView(null, strings, t.loadError, false)}
            strings={strings}
            onRetry={onRetry}
          />
        </article>
      </section>
    );
  }

  return (
    <section className={styles.sectionStack} aria-label={t.title}>
      {error ? <LoadErrorState view={error} strings={strings} onRetry={onRetry} compact /> : null}
      <DealLinks strings={strings} />
      <DealCurrentCard
        current={deal.current}
        defaultPercent={deal.defaultPercent}
        strings={strings}
        locale={locale}
      />
      {hasUpcomingDeal(deal) && deal.vendorDeal ? (
        <DealUpcomingCard
          deal={deal.vendorDeal}
          effectiveFromMs={deal.effectiveFromMs}
          strings={strings}
          locale={locale}
        />
      ) : null}
      {hasBranchDeals(deal.vendorType) ? (
        <DealBranchesTable branches={deal.branches} strings={strings} locale={locale} />
      ) : null}
    </section>
  );
}
