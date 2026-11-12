import type { DashboardPreset, ProviderDashboard } from "@/features/provider-dashboard/domain/types";
import { PresetTabs } from "@/features/provider-dashboard/presentation/PresetTabs";
import { ProviderStatCards } from "@/features/provider-dashboard/presentation/ProviderStatCards";
import { RatingCard } from "@/features/provider-dashboard/presentation/RatingCard";
import { ServiceShareChart } from "@/features/provider-dashboard/presentation/ServiceShareChart";
import type { AppStrings } from "@/shared/i18n/types";

import styles from "./providerDashboard.module.css";

type ProviderDashboardViewProps = {
  data: ProviderDashboard;
  preset: DashboardPreset;
  strings: AppStrings;
  locale: string;
  onPresetChange: (preset: DashboardPreset) => void;
};

/** Clinic and groomer dashboard sections. Pure. */
export function ProviderDashboardView({
  data,
  preset,
  strings,
  locale,
  onPresetChange,
}: ProviderDashboardViewProps) {
  return (
    <div className={styles.stack}>
      <PresetTabs value={preset} strings={strings} onChange={onPresetChange} />
      <ProviderStatCards visits={data.visits} newPatients={data.newPatients} strings={strings} />
      <div className={styles.twoColumns}>
        <section className={styles.card} aria-labelledby="provider-services-title">
          <h2 id="provider-services-title" className={styles.cardTitle}>
            {strings.dashboard.provider.services}
          </h2>
          <ServiceShareChart services={data.services} strings={strings} locale={locale} />
        </section>
        <RatingCard rating={data.rating} strings={strings} />
      </div>
    </div>
  );
}
