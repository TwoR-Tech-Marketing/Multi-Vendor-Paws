import { ErrorState } from "@/components/ui/error-state/ErrorState";
import type { LoadErrorView } from "@/components/ui/error-state/load-error";
import type { AppStrings } from "@/shared/i18n/types";

type LoadErrorStateProps = {
  view: LoadErrorView;
  strings: AppStrings;
  onRetry: () => void;
  /** Inline variant above content that is still shown. */
  compact?: boolean;
  headingLevel?: 2 | 3 | 4;
};

/** Error or offline state for a failed load, with the shared retry label. */
export function LoadErrorState({
  view,
  strings,
  onRetry,
  compact = false,
  headingLevel = 2,
}: LoadErrorStateProps) {
  return (
    <ErrorState
      kind={view.kind}
      title={view.title}
      description={view.description}
      retryLabel={strings.common.retry}
      retryingLabel={strings.states.retrying}
      onRetry={onRetry}
      headingLevel={headingLevel}
      compact={compact}
    />
  );
}
