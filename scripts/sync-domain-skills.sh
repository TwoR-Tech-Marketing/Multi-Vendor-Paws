#!/usr/bin/env bash
# Overwrite the domain skills in the sibling repos with the WEB copies (WEB .cursor/skills is canonical, T0.18).
# Edit domain skills in WEB only. Repo-specific skills (speckit, ponytail, design) are never touched.
# Usage: scripts/sync-domain-skills.sh [--dry-run]
set -euo pipefail
WEB="$(cd "$(dirname "$0")/.." && pwd)"
PARENT="$(dirname "$WEB")"
DOMAIN="appointments-domain delivery-zones-geo money-piastres no-show-flow single-release-rollout vendor-suspension-modes vendor-type-architecture deals-and-billing firestore-multitenant-rules halo-and-platform-vendor points-and-coupons provider-onboarding cloud-functions-rules admin-panel-contract"
FLAGS="-a --delete"
[ "${1:-}" = "--dry-run" ] && FLAGS="$FLAGS -n -i"
for repo in tender_paws_partner tinder_paws tinderpaws_panel; do
  for s in $DOMAIN; do
    src="$WEB/.cursor/skills/$s"; dst="$PARENT/$repo/.cursor/skills/$s"
    # Only overwrite skills that already exist in the target repo.
    [ -d "$src" ] && [ -d "$dst" ] || continue
    echo "sync $repo/$s"
    rsync $FLAGS --exclude .DS_Store "$src/" "$dst/"
  done
done
