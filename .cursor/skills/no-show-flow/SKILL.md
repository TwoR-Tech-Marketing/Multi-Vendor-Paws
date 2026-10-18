---
name: no-show-flow
description: Use when building the no-show flag, user confirmation notification, dispute handling or its timers.
---
# No-show flow

## Spec rules
- The clinic can mark no-show only after the appointment time has passed AND 120 more minutes.
- The user then receives: "The clinic marked this appointment as a no-show. Is this correct?"
- User answers: "Yes, I did not attend" | "No, I attended" | "I arrived late" | "Report an issue"

## Rules
- The 120 minute check is enforced on the server (BFF and Cloud Function). Never trust the UI button state.
- Use the `notifications` collection for the user prompt.
- Record the user's answer in `statusHistory`.
- Needs a Cloud Function or scheduled check (this portal repo has none). See cloud-functions-rules.

## OPEN
- What does each answer do (charge, refund, flag the clinic, admin review)?
- Does "I arrived late" reopen the appointment?
- What does "Report an issue" create, and who handles it?
- What if the user never answers?
