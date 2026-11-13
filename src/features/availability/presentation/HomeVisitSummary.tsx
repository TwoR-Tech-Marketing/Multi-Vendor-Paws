import Link from "next/link";

import { StatusBadge } from "@/components/ui/badge/StatusBadge";
import { Routes } from "@/constants/routes";
import type { HomeVisitInfo } from "@/features/availability/domain/types";
import { formatEgp } from "@/features/products/domain/currency";
import type { AppStrings } from "@/shared/i18n/types";
import type { AppLocale } from "@/shared/preferences/domain/types";

import branchStyles from "@/features/branches/presentation/branches.module.css";

type HomeVisitSummaryProps = {
  branchId: string;
  homeVisit: HomeVisitInfo;
  strings: AppStrings;
  locale: AppLocale;
};

/** Fee and radius come from the branch and are edited in the branch form. */
export function HomeVisitSummary({ branchId, homeVisit, strings, locale }: HomeVisitSummaryProps) {
  const t = strings.availability;
  const km = (homeVisit.radiusMeters / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 });
  return (
    <div className={branchStyles.stack}>
      {homeVisit.enabled ? (
        <div className={branchStyles.badgeRow}>
          <StatusBadge
            tone="success"
            label={t.homeVisitFee.replace("{amount}", formatEgp(homeVisit.feePiastres, locale))}
          />
          <StatusBadge tone="neutral" label={t.homeVisitRadius.replace("{km}", km)} />
        </div>
      ) : (
        <p className={branchStyles.muted}>{t.homeVisitOff}</p>
      )}
      <div className={branchStyles.actions}>
        <Link className={branchStyles.linkButton} href={Routes.vendor.branchDetail(branchId)}>
          {t.editBranch}
        </Link>
      </div>
    </div>
  );
}
