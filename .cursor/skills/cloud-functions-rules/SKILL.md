---
name: cloud-functions-rules
description: Use when a feature needs server-side timers, triggers or side effects (no-show checks, review prompts, balances, points).
---
# Cloud Functions rules

- The portal repo has no Cloud Functions. They live with the admin panel (`tinderpaws_panel`) unless decided otherwise.
- Needed functions: no-show eligibility and notification, post-visit review prompt, balance and ledger updates, points ledger, subscription renewal and grace reminders.
- Functions must be idempotent. Re-running the same trigger must not double credit money or points.
- Validate `vendorId` and appointment state inside the function. Never trust client payloads.
- Money in piastres, same helper as the portal.
- Deploy order: indexes, rules, functions, then mobile.
