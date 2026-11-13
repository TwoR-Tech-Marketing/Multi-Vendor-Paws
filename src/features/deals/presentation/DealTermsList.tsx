import { formatPercentValue } from "@/features/deals/presentation/deal-copy";
import type { DealTerms } from "@/features/deals/domain/types";
import { formatEgp } from "@/features/products/domain/currency";
import type { AppStrings } from "@/shared/i18n/types";
import type { AppLocale } from "@/shared/preferences/domain/types";

import styles from "./deals.module.css";

/** Fee type, fixed fee and percentage rows of one deal. */
type DealTermsListProps = { terms: DealTerms; strings: AppStrings; locale: AppLocale };

export function DealTermsList({ terms, strings, locale }: DealTermsListProps) {
  const t = strings.deals;
  const showFixed = terms.type === "fixed" || terms.type === "both";
  const showPercent = terms.type === "percentage" || terms.type === "both";
  return (
    <dl className={styles.terms}>
      <div className={styles.termRow}>
        <dt>{t.feeType}</dt>
        <dd>{t.type[terms.type]}</dd>
      </div>
      {showFixed ? (
        <div className={styles.termRow}>
          <dt>{t.fixedFee}</dt>
          <dd className={styles.figure}>{formatEgp(terms.fixedFeePerOrderPiastres, locale)}</dd>
        </div>
      ) : null}
      {showPercent ? (
        <div className={styles.termRow}>
          <dt>{t.percentage}</dt>
          <dd className={styles.figure}>
            <bdi>{formatPercentValue(terms.percentage)}</bdi>
          </dd>
        </div>
      ) : null}
    </dl>
  );
}
