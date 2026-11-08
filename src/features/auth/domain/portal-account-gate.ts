import { Routes } from "@/constants/routes";

export type PortalPostLoginDestination = "dashboard" | "profile" | "reject";

/**
 * Maps a shared session kind to the portal post-login destination.
 * Kind only — never derive from profile fields (Gate C / S1.1).
 */
export function portalPostLoginDestination(
  kind: string | null | undefined,
): PortalPostLoginDestination {
  if (kind === "active") return "dashboard";
  if (
    kind === "pending" ||
    kind === "rejected" ||
    kind === "suspended" ||
    kind === "banned"
  ) {
    return "profile";
  }
  return "reject";
}

export function portalPostLoginHref(kind: string | null | undefined): string | null {
  const destination = portalPostLoginDestination(kind);
  if (destination === "dashboard") return Routes.vendor.dashboard;
  if (destination === "profile") return Routes.vendor.profile;
  return null;
}

/** Session kinds that may hold a portal cookie / status screens. */
export function isAllowedPortalSessionKind(kind: string): boolean {
  return (
    kind === "active" ||
    kind === "pending" ||
    kind === "rejected" ||
    kind === "suspended" ||
    kind === "banned"
  );
}
