import type { ErrorStateKind } from "@/components/ui/error-state/ErrorState";
import type { AppStrings } from "@/shared/i18n/types";
import { isNetworkError } from "@/shared/lib/network-error";

export type LoadErrorView = {
  kind: ErrorStateKind;
  title: string;
  description: string;
};

/**
 * Maps a failed load to the copy of the error state: the offline copy when the
 * connection dropped, else the screen's own message (or the generic one).
 */
export function toLoadErrorView(
  error: unknown,
  strings: AppStrings,
  description: string = strings.states.errorDescription,
  offline?: boolean,
): LoadErrorView {
  if (isNetworkError(error, offline)) {
    return {
      kind: "offline",
      title: strings.states.offlineTitle,
      description: strings.states.offlineDescription,
    };
  }
  return { kind: "error", title: strings.states.errorTitle, description };
}
