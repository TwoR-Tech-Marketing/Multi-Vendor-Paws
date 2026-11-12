import Link from "next/link";

import { Routes } from "@/constants/routes";
import type { HomeVisitInfo } from "@/features/availability/domain/types";
import { formatEgp } from "@/features/products/domain/currency";
import type { AppStrings } from "@/shared/i18n/types";

import branchStyles from "@/features/branches/presentation/branches.module.css";

type HomeVisitSummaryProps = {
  branchId: string;
  homeVisit: HomeVisitInfo;
  strings: AppStrings;
};

/** Fee and radius come from the branch and are edited in the branch form. */
export function HomeVisitSummary({ branchId, homeVisit, strings }: HomeVisitSummaryProps) {
  const t = strings.availability;
  const km = (homeVisit.radiusMeters / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 });
  return (
    <div className={branchStyles.stack}>
      {homeVisit.enabled ? (
        <div className={branchStyles.badgeRow}>
          <span className={`${branchStyles.badge} ${branchStyles.badgeAccent}`}>
            {t.homeVisitFee.replace("{amount}", formatEgp(homeVisit.feePiastres))}
          </span>
          <span className={branchStyles.badge}>{t.homeVisitRadius.replace("{km}", km)}</span>
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
