import type { Appointment, AppointmentAction } from "@/features/appointments/domain/types";
import { AppointmentBadges } from "@/features/appointments/presentation/AppointmentBadges";
import { NoShowPanel } from "@/features/appointments/presentation/NoShowPanel";
import {
  appointmentWhen,
  formatInstant,
  historyLine,
} from "@/features/appointments/presentation/appointments-copy";
import { formatEgp } from "@/features/products/domain/currency";
import type { AppStrings } from "@/shared/i18n/types";
import type { AppLocale } from "@/shared/preferences/domain/types";

import branchStyles from "@/features/branches/presentation/branches.module.css";
import styles from "./appointments.module.css";

type ViewProps = { appointment: Appointment; strings: AppStrings; locale: AppLocale };

type DetailProps = { label: string; value: string; ltr?: boolean };

function Detail({ label, value, ltr = false }: DetailProps) {
  if (!value) return null;
  return (
    <div className={styles.detailItem}>
      <dt>{label}</dt>
      <dd>{ltr ? <bdi dir="ltr">{value}</bdi> : value}</dd>
    </div>
  );
}

function SummaryPanel({ appointment: a, strings, locale }: ViewProps) {
  const t = strings.appointments;
  return (
    <section className={branchStyles.panel}>
      <div className={branchStyles.panelHeader}>
        <h2 className={branchStyles.panelTitle}>
          <bdi>{a.appointmentNumber}</bdi>
        </h2>
        <AppointmentBadges
          status={a.status}
          held={a.held}
          noShowState={a.noShowState}
          strings={strings}
        />
      </div>
      {a.held ? (
        <div className={styles.notice} role="status">
          {t.heldBanner}
        </div>
      ) : null}
      <dl className={styles.details}>
        <Detail label={t.detail.when} value={appointmentWhen(a, strings, locale)} />
        <Detail label={t.detail.branch} value={a.branchName} />
        <Detail label={t.detail.mode} value={t.mode[a.mode]} />
        <Detail label={t.detail.cancelReason} value={a.cancelReason ?? ""} />
      </dl>
      {a.completedAtMs !== null ? (
        <p className={branchStyles.muted}>
          {t.detail.completedAt.replace("{time}", formatInstant(a.completedAtMs, locale))}
        </p>
      ) : null}
      <p className={branchStyles.muted}>
        {t.detail.reschedules
          .replace("{buyer}", String(a.rescheduleCount.buyer))
          .replace("{provider}", String(a.rescheduleCount.provider))}
      </p>
    </section>
  );
}

function BuyerPanel({ appointment: a, strings }: ViewProps) {
  const t = strings.appointments.detail;
  return (
    <section className={branchStyles.panel}>
      <h2 className={branchStyles.panelTitle}>{t.buyer}</h2>
      <dl className={styles.details}>
        <Detail label={t.buyer} value={a.buyerName || a.buyerFirstName} />
        <Detail label={t.phone} value={a.buyerPhone} ltr />
        <Detail label={t.pet} value={a.petName ?? ""} />
        <Detail label={t.homeAddress} value={a.homeAddress?.text ?? ""} />
      </dl>
    </section>
  );
}

function ServicesPanel({ appointment: a, strings, locale }: ViewProps) {
  const t = strings.appointments.detail;
  return (
    <section className={branchStyles.panel}>
      <h2 className={branchStyles.panelTitle}>{t.services}</h2>
      <ul className={styles.lines}>
        {a.services.map((s) => (
          <li key={s.serviceId} className={styles.line}>
            <span>
              {locale === "ar" ? s.nameAr : s.nameEn}{" "}
              <span className={branchStyles.muted}>
                {t.duration.replace("{minutes}", String(s.durationMinutes))}
              </span>
            </span>
            <span>{formatEgp(s.pricePiastres, locale)}</span>
          </li>
        ))}
        <li className={styles.line}>
          <span>{t.items}</span>
          <span>{formatEgp(a.itemsPiastres, locale)}</span>
        </li>
        {a.homeVisitFeePiastres > 0 ? (
          <li className={styles.line}>
            <span>{t.homeVisitFee}</span>
            <span>{formatEgp(a.homeVisitFeePiastres, locale)}</span>
          </li>
        ) : null}
        {a.discountPiastres > 0 ? (
          <li className={styles.line}>
            <span>{t.discount}</span>
            <span>{formatEgp(-a.discountPiastres, locale)}</span>
          </li>
        ) : null}
        <li className={styles.lineTotal}>
          <span>{t.total}</span>
          <span>{formatEgp(a.totalPiastres, locale)}</span>
        </li>
      </ul>
    </section>
  );
}

function HistoryPanel({ appointment: a, strings, locale }: ViewProps) {
  const t = strings.appointments;
  return (
    <section className={branchStyles.panel}>
      <h2 className={branchStyles.panelTitle}>{t.detail.history}</h2>
      {a.statusHistory.length === 0 ? (
        <p className={branchStyles.muted}>{t.detail.historyEmpty}</p>
      ) : (
        <ol className={styles.timeline}>
          {a.statusHistory.map((entry, index) => (
            <li key={`${entry.atMs ?? 0}-${index}`} className={styles.timelineItem}>
              <span className={styles.rowText}>{historyLine(entry, strings)}</span>
              <span className={branchStyles.muted}>{formatInstant(entry.atMs, locale)}</span>
              {entry.reason ? (
                <span className={branchStyles.muted}>
                  {t.history.reason.replace("{reason}", entry.reason)}
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/** Read only appointment detail. Pure: driven by props. */
export function AppointmentDetailView({
  allowedActions = [],
  ...props
}: ViewProps & { allowedActions?: readonly AppointmentAction[] }) {
  return (
    <>
      <SummaryPanel {...props} />
      <BuyerPanel {...props} />
      <ServicesPanel {...props} />
      <NoShowPanel {...props} allowedActions={allowedActions} />
      <HistoryPanel {...props} />
    </>
  );
}
