---
name: i18n-rtl
description: Use for any user-facing copy, date, number, calendar or chart in the portal (English and Arabic, LTR and RTL).
---
# i18n and RTL

- No hardcoded copy. English source of truth is `src/constants/strings.ts`, Arabic in `src/shared/i18n/locales/ar.ts`. Use `useStrings()`.
- Every new string is added to both languages in the same change.
- RTL: mirror chevrons, calendar direction, chart axes and paddings. Use logical CSS properties (`margin-inline-start`, etc.).
- Times shown in Africa/Cairo.
- Loading states use shimmer skeletons, not spinners.

## OPEN
- Calendar week start day (Saturday or Sunday)?
- Western or Arabic-Indic numerals in Arabic UI?
