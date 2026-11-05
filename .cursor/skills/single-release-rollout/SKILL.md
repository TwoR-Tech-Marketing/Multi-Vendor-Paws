---
name: single-release-rollout
description: Use when planning deploys, migrations or compatibility, because the whole services and zones update ships to production in one release.
---
# Single release rollout

- No early fixes. The whole update ships to production together.
- Deploy order: indexes, rules, functions, then apps. Section 1.3.
- Old app versions already in users hands still read the legacy catalog and do not know zones, suspension modes or new fields.
- Migrations (governorate IDs, vendor coverage, Halo stamping) must be idempotent scripts, tested against a copy of production data first.
- Keep legacy collections and rules working until old versions are retired.
- Shared data changes stay additive until the forced update (BR-14.1).

## OPEN
- Staging environment and test data plan
- Release date and Apple review lead time
