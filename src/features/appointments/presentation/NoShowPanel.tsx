import {
  noShowAvailableAtMs,
  noShowQuestionKey,
  showNoShowTooEarly,
} from "@/features/appointments/domain/no-show";
import type { Appointment, AppointmentAction } from "@/features/appointments/domain/types";
import { formatInstant } from "@/features/appointments/presentation/appointments-copy";
import type { AppStrings } from "@/shared/i18n/types";

import branchStyles from "@/features/branches/presentation/branches.module.css";
import styles from "./appointments.module.css";

type NoShowPanelProps = {
  appointment: Appointment;
  allowedActions: readonly AppointmentAction[];
  strings: AppStrings;
  locale: string;
};

function Detail({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className={styles.detailItem}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

/**
 * No-show state, what the customer was asked (clinic or groomer wording) and
 * their answer. Before a flag, explains when the server will allow it. Pure.
 */
export function NoShowPanel({ appointment: a, allowedActions, strings, locale }: NoShowPanelProps) {
  const t = strings.appointments.noShow;

  if (!a.noShow) {
    if (!showNoShowTooEarly(a, allowedActions)) return null;
    return (
      <section className={branchStyles.panel}>
        <h2 className={branchStyles.panelTitle}>{t.title}</h2>
        <p className={branchStyles.muted}>
          {t.tooEarly.replace("{time}", formatInstant(noShowAvailableAtMs(a.startMs), locale))}
        </p>
      </section>
    );
  }

  const noShow = a.noShow;
  const instant = (template: string, ms: number | null) =>
    ms === null ? "" : template.replace("{time}", formatInstant(ms, locale));

  return (
    <section className={branchStyles.panel}>
      <div className={branchStyles.panelHeader}>
        <h2 className={branchStyles.panelTitle}>{t.title}</h2>
        <span className={`${styles.badge} ${styles.toneError}`}>{t.state[noShow.state]}</span>
      </div>
      {noShow.state === "late_returned" ? (
        <div className={styles.notice} role="status">
          {t.lateHint}
        </div>
      ) : null}
      {noShow.state === "disputed" ? (
        <div className={styles.notice} role="status">
          {t.disputedHint}
        </div>
      ) : null}
      <p className={branchStyles.muted}>{instant(t.flaggedAt, noShow.flaggedAtMs)}</p>
      {noShow.state === "awaiting_buyer" ? (
        <p className={branchStyles.muted}>{instant(t.answerDueAt, noShow.answerDueAtMs)}</p>
      ) : null}
      {noShow.confirmedBy && noShow.state === "confirmed" ? (
        <p className={styles.rowText}>{t.confirmedBy[noShow.confirmedBy]}</p>
      ) : null}
      <div className={styles.quote}>
        <h3 className={styles.quoteTitle}>{t.customerSaw}</h3>
        <p className={styles.rowTitle}>{t.prompt.title}</p>
        <p className={styles.rowText}>{t.prompt[noShowQuestionKey(a.vendorType)]}</p>
      </div>
      <dl className={styles.details}>
        <Detail
          label={t.customerAnswer}
          value={noShow.answer ? t.answer[noShow.answer] : t.noAnswerYet}
        />
        <Detail label={t.customerNote} value={noShow.buyerNote ?? ""} />
      </dl>
      {noShow.answeredAtMs !== null ? (
        <p className={branchStyles.muted}>{instant(t.answeredAt, noShow.answeredAtMs)}</p>
      ) : null}
    </section>
  );
}
