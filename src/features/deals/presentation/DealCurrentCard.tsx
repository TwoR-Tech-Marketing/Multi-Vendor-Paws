import { formatDealPercent } from "@/features/deals/domain/percent";
import type { CurrentDeal } from "@/features/deals/domain/types";
import { DealTermsList } from "@/features/deals/presentation/DealTermsList";
import { dealSourceLabel } from "@/features/deals/presentation/deal-copy";
import type { AppStrings } from "@/shared/i18n/types";

import styles from "./deals.module.css";

type DealCurrentCardProps = {
  current: CurrentDeal;
  defaultPercent: number;
  strings: AppStrings;
};

/** The fee that applies to orders placed today. */
export function DealCurrentCard({ current, defaultPercent, strings }: DealCurrentCardProps) {
  const t = strings.deals;
  return (
    <article className={`${styles.card} ${styles.cardHighlight}`} aria-label={t.current}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>{t.current}</h2>
        <span className={`${styles.badge} ${styles.badgeAccent}`}>
          {dealSourceLabel(current.source, strings)}
        </span>
      </div>
      <DealTermsList terms={current} strings={strings} />
      <div className={styles.notes}>
        <p className={styles.note}>
          {current.feeBase === "order_total" ? t.legacyNote : t.itemsOnlyNote}
        </p>
        {current.source === "default" ? (
          <p className={styles.note}>
            {t.defaultNote.replace("{percent}", formatDealPercent(defaultPercent))}
          </p>
        ) : null}
        <p className={styles.muted}>{t.branch.hint}</p>
      </div>
    </article>
  );
}
