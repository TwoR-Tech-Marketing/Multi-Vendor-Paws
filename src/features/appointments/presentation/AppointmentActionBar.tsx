import {
  ACTION_BAR_ACTIONS,
  type ActionBarAction,
  type AppointmentAction,
} from "@/features/appointments/domain/types";
import type { AppStrings } from "@/shared/i18n/types";

import branchStyles from "@/features/branches/presentation/branches.module.css";

const BUTTON_CLASS: Record<ActionBarAction, string> = {
  complete: branchStyles.primaryButton,
  markCompleted: branchStyles.primaryButton,
  flagNoShow: branchStyles.secondaryButton,
  confirmNoShow: branchStyles.secondaryButton,
  reschedule: branchStyles.secondaryButton,
  cancel: branchStyles.dangerButton,
};

/** Action bar buttons among the server allowed actions, in a fixed order. */
export function actionBarActions(actions: readonly AppointmentAction[]): ActionBarAction[] {
  return ACTION_BAR_ACTIONS.filter((action) => actions.includes(action));
}

/** One button per server allowed action, nothing else. Pure. */
export function AppointmentActionBar({
  actions,
  strings,
  disabled,
  onAction,
}: {
  actions: readonly AppointmentAction[];
  strings: AppStrings;
  disabled: boolean;
  onAction: (action: ActionBarAction) => void;
}) {
  const t = strings.appointments.actions;
  const shown = actionBarActions(actions);
  return (
    <section className={branchStyles.panel} aria-label={t.title}>
      <h2 className={branchStyles.panelTitle}>{t.title}</h2>
      {shown.length === 0 ? (
        <p className={branchStyles.muted}>{t.none}</p>
      ) : (
        <div className={branchStyles.actions}>
          {shown.map((action) => (
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
