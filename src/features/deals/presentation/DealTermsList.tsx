import { formatPercentValue } from "@/features/deals/presentation/deal-copy";
import type { DealTerms } from "@/features/deals/domain/types";
import { formatEgp } from "@/features/products/domain/currency";
import type { AppStrings } from "@/shared/i18n/types";

import styles from "./deals.module.css";

/** Fee type, fixed fee and percentage rows of one deal. */
export function DealTermsList({ terms, strings }: { terms: DealTerms; strings: AppStrings }) {
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
          <dd>{formatEgp(terms.fixedFeePerOrderPiastres)}</dd>
        </div>
      ) : null}
      {showPercent ? (
        <div className={styles.termRow}>
          <dt>{t.percentage}</dt>
          <dd>{formatPercentValue(terms.percentage)}</dd>
        </div>
      ) : null}
    </dl>
  );
}
