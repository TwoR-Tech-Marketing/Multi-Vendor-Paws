import type { AppointmentAction } from "@/features/appointments/domain/types";
import type { AppStrings } from "@/shared/i18n/types";

import branchStyles from "@/features/branches/presentation/branches.module.css";

const BUTTON_CLASS: Record<AppointmentAction, string> = {
  complete: branchStyles.primaryButton,
  reschedule: branchStyles.secondaryButton,
  cancel: branchStyles.dangerButton,
};

/** One button per server allowed action, nothing else. Pure. */
export function AppointmentActionBar({
  actions,
  strings,
  disabled,
  onAction,
}: {
  actions: AppointmentAction[];
  strings: AppStrings;
  disabled: boolean;
  onAction: (action: AppointmentAction) => void;
}) {
  const t = strings.appointments.actions;
  return (
    <section className={branchStyles.panel} aria-label={t.title}>
      <h2 className={branchStyles.panelTitle}>{t.title}</h2>
      {actions.length === 0 ? (
        <p className={branchStyles.muted}>{t.none}</p>
      ) : (
        <div className={branchStyles.actions}>
          {actions.map((action) => (
            <button
              key={action}
              type="button"
              className={BUTTON_CLASS[action]}
              disabled={disabled}
              onClick={() => onAction(action)}
            >
              {t[action]}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
