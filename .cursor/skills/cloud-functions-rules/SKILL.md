---
name: cloud-functions-rules
description: Use when a feature needs server-side timers, triggers or side effects (no-show checks, review prompts, balances, points).
---
# Cloud Functions rules

- The portal repo has no Cloud Functions. They live in tinderpaws_panel/functions (existing: vendor_signup.js, vendors.js, orders_split.js, service_request.js, services.js). service_request.js and services.js are not required by functions/index.js. Whether those two are deployed is UNKNOWN. Vendor features that carry business rules are shared functions used by the portal and the vendor app (D15).
- Needed functions: no-show eligibility and notification, post-visit review prompt, balance and ledger updates, points ledger, payout recording, telehealth queue timeout. No vendor subscription renewal (D21).
- Functions must be idempotent. Re-running the same trigger must not double credit money or points.
- Validate `vendorId` and appointment state inside the function. Never trust client payloads.
- Money in piastres, same helper as the portal.
- Deploy order: indexes, rules, functions, then apps. Section 1.3.
- New functions needed: buyer eligibility by location, governorate resolution from lat and lng, suspension handling (put orders or appointments on hold and create a hold case, BR-9.3), checkout re-check.
