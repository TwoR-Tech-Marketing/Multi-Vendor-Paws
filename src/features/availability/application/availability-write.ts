import { mapConflicts } from "@/features/availability/application/availability.api";
import {
  conflictDetails,
  mapAvailabilityError,
  type AvailabilityErrorKey,
} from "@/features/availability/domain/errors";
import type {
  Availability,
  AvailabilityConflict,
  AvailabilityState,
  WeeklyPayload,
} from "@/features/availability/domain/types";

/**
 * Pure outcome handling for availability writes, so the editor keeps
 * unsaved weekly edits across exception writes, conflicts and reloads.
 */

export type WriteKind = "weekly" | "exception";

export type EditorData = {
  state: AvailabilityState;
  /** Weekly hours and capacities as edited, possibly unsaved. */
  draft: WeeklyPayload;
};

export type WriteFailure =
  | { type: "conflicts"; conflicts: AvailabilityConflict[]; kept: string[] }
  | { type: "versionChanged" }
  | { type: "error"; key: AvailabilityErrorKey };

export function payloadOf(a: Availability): WeeklyPayload {
  return {
    weekly: a.weekly,
    capacity: a.capacity,
    homeVisitWeekly: a.homeVisitWeekly,
    homeVisitCapacity: a.homeVisitCapacity,
  };
}

export function isDirty(draft: WeeklyPayload, availability: Availability): boolean {
  return JSON.stringify(draft) !== JSON.stringify(payloadOf(availability));
}

/**
 * After a successful write: the saved doc becomes the new state. A weekly
 * save resets the draft to what was saved; an exception write leaves the
 * draft alone so unsaved weekly edits survive.
 */
export function applySaved(kind: WriteKind, data: EditorData, saved: Availability): EditorData {
  return {
    state: { ...data.state, availability: saved },
    draft: kind === "weekly" ? payloadOf(saved) : data.draft,
  };
}

/**
 * After a refused write. Conflicts carry the ids already kept so the dialog
 * keeps them ticked on retry; nothing here touches the draft.
 */
export function classifyWriteError(error: unknown, kept: string[]): WriteFailure {
  const raw = conflictDetails(error);
  if (raw) return { type: "conflicts", conflicts: mapConflicts(raw), kept };
  const key = mapAvailabilityError(error);
  if (key === "versionChanged") return { type: "versionChanged" };
  return { type: "error", key };
}

/**
 * Reload after a version change: take the latest doc and version, but keep
 * a draft that had unsaved edits so the provider can review and save again.
 */
export function applyReload(previous: EditorData | null, loaded: AvailabilityState): EditorData {
  const keepDraft = previous !== null && isDirty(previous.draft, previous.state.availability);
  return {
    state: loaded,
    draft: keepDraft ? previous.draft : payloadOf(loaded.availability),
  };
}
