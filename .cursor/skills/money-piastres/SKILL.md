---
name: money-piastres
description: Use whenever money, prices, totals, commissions, balances or percentages appear in code.
---
# Money in piastres

- All money is an integer in piastres (1 EGP = 100). Never store or compute float EGP.
- Use helpers in `src/features/products/domain/currency.ts` (or a shared money module). No ad hoc math.
- Convert to EGP only for display, in presentation.
- Percentages use one shared integer rounding function. Define the rounding mode once.
- Ledger entries, deals, points and appointment totals all use the same helper.

## OPEN
- Rounding mode for percentage commissions (half up, floor?)
