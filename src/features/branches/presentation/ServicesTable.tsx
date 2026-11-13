import Image from "next/image";

import { StatusBadge } from "@/components/ui/badge/StatusBadge";
import { EmptyState } from "@/components/ui/empty-state/EmptyState";
import type { BranchService } from "@/features/branches/domain/types";
import {
  formatServicePrice,
  serviceDisplayName,
} from "@/features/branches/presentation/branch-copy";
import type { AppStrings } from "@/shared/i18n/types";
import type { AppLocale } from "@/shared/preferences/domain/types";

import styles from "./branches.module.css";

type ServicesTableProps = {
  services: BranchService[];
  strings: AppStrings;
  locale: AppLocale;
  readOnly: boolean;
  onEdit: (service: BranchService) => void;
  onArchive: (service: BranchService) => void;
  onRestore: (service: BranchService) => void;
};

export function ServicesTable({
  services,
  strings,
  locale,
  readOnly,
  onEdit,
  onArchive,
  onRestore,
}: ServicesTableProps) {
  const t = strings.services;

  if (services.length === 0) {
    return <EmptyState headingLevel={3} title={t.emptyTitle} description={t.emptyDescription} />;
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">{t.fields.photo}</th>
            <th scope="col">{t.title}</th>
            <th scope="col" className={styles.numeric}>
              {t.fields.price}
            </th>
            <th scope="col" className={styles.numeric}>
              {t.fields.duration}
            </th>
            <th scope="col">{t.status}</th>
            {!readOnly ? <th scope="col">{t.actions}</th> : null}
          </tr>
        </thead>
        <tbody>
          {services.map((service) => {
            const archived = service.status === "archived";
            return (
              <tr key={service.serviceId} data-service-id={service.serviceId}>
                <td>
                  {service.photoUrl ? (
                    <Image
                      className={styles.thumb}
                      src={service.photoUrl}
                      alt={t.photoAlt}
                      width={48}
                      height={48}
                      unoptimized
                    />
                  ) : (
                    <span className={styles.thumbEmpty} aria-hidden />
                  )}
                </td>
                <td className={styles.nameCell}>
                  <span title={serviceDisplayName(service, locale)}>
                    {serviceDisplayName(service, locale)}
                  </span>
                </td>
                <td className={styles.numeric}>
                  {formatServicePrice(service.pricePiastres, strings, locale)}
                </td>
                <td className={styles.numeric}>
                  {t.durationMinutes.replace("{count}", String(service.durationMinutes))}
                </td>
                <td>
                  <StatusBadge
                    tone={archived ? "neutral" : "success"}
                    label={archived ? strings.branches.archivedBadge : strings.branches.activeBadge}
                    status={service.status}
                  />
                </td>
                {!readOnly ? (
                  <td>
                    <div className={styles.actions}>
                      {archived ? (
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          onClick={() => onRestore(service)}
                        >
                          {t.restore}
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            className={styles.secondaryButton}
                            onClick={() => onEdit(service)}
                          >
                            {t.edit}
                          </button>
                          <button
                            type="button"
                            className={styles.dangerButton}
                            onClick={() => onArchive(service)}
                          >
                            {t.archive}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
