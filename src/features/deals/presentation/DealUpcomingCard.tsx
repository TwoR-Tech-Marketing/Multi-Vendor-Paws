import { StatusBadge } from "@/components/ui/badge/StatusBadge";
import type { DealTerms } from "@/features/deals/domain/types";
import { DealTermsList } from "@/features/deals/presentation/DealTermsList";
import { formatCairoDate } from "@/features/financials/domain/statement-dates";
import type { AppStrings } from "@/shared/i18n/types";
import type { AppLocale } from "@/shared/preferences/domain/types";

import styles from "./deals.module.css";

type DealUpcomingCardProps = {
  deal: DealTerms;
  effectiveFromMs: number | null;
  strings: AppStrings;
  locale: AppLocale;
};

/** A deal set by the team that starts later. Its start date is a Cairo date. */
export function DealUpcomingCard({ deal, effectiveFromMs, strings, locale }: DealUpcomingCardProps) {
  const t = strings.deals;
  return (
    <article className={styles.card} aria-label={t.upcoming}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>{t.upcoming}</h2>
        {effectiveFromMs !== null ? (
          <StatusBadge
            tone="warning"
            label={t.upcomingFrom.replace("{date}", formatCairoDate(effectiveFromMs, locale))}
          />
        ) : null}
      </div>
      <DealTermsList terms={deal} strings={strings} locale={locale} />
    </article>
  );
}
