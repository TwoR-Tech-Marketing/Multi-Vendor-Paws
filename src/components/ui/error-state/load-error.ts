import type { ErrorStateKind } from "@/components/ui/error-state/ErrorState";
import type { AppStrings } from "@/shared/i18n/types";
import { isNetworkError } from "@/shared/lib/network-error";

export type LoadErrorView = {
  kind: ErrorStateKind;
  title: string;
  /** Second line, offline only; a server error is one sentence. */
  description?: string;
};

/**
 * Maps a failed load to the copy of the error state: the offline title and
 * line when the connection dropped, else the screen's own one sentence (or the
 * generic one).
 */
export function toLoadErrorView(
  error: unknown,
  strings: AppStrings,
  message: string = strings.errors.generic,
  offline?: boolean,
): LoadErrorView {
  if (isNetworkError(error, offline)) {
    return {
      kind: "offline",
      title: strings.states.offlineTitle,
      description: strings.states.offlineDescription,
    };
  }
  return { kind: "error", title: message };
}
