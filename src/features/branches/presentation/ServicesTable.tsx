import Image from "next/image";

import type { BranchService } from "@/features/branches/domain/types";
import {
  formatServicePrice,
  serviceDisplayName,
} from "@/features/branches/presentation/branch-copy";
import type { AppStrings } from "@/shared/i18n/types";

import styles from "./branches.module.css";

type ServicesTableProps = {
  services: BranchService[];
  strings: AppStrings;
  locale: string;
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
    return <p className={styles.muted}>{t.empty}</p>;
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">{t.fields.photo}</th>
            <th scope="col">{t.title}</th>
            <th scope="col">{t.fields.price}</th>
            <th scope="col">{t.fields.duration}</th>
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
                <td>{serviceDisplayName(service, locale)}</td>
                <td dir="ltr">{formatServicePrice(service.pricePiastres, strings)}</td>
                <td>{t.durationMinutes.replace("{count}", String(service.durationMinutes))}</td>
                <td>
                  <span
                    className={`${styles.badge} ${archived ? styles.badgeArchived : styles.badgeActive}`}
                  >
                    {archived ? strings.branches.archivedBadge : strings.branches.activeBadge}
                  </span>
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
