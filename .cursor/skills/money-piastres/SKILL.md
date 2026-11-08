---
name: money-piastres
description: Use whenever money, prices, totals, commissions, balances or percentages appear in code.
---
# Money in piastres

- New money is an integer in piastres (1 EGP = 100). The buyer app uses float EGP today. Convert at the boundary and migrate (S2.3, section 1.1). Do not add new float EGP storage.
- Use helpers in `src/features/products/domain/currency.ts` (or a shared money module). No ad hoc math.
- Convert to EGP only for display, in presentation.
- Percentages use one shared integer rounding function. Rounding mode is half up (D28, answered O17). Calendar weeks start Saturday. Western digits.
- Ledger entries, deals, points and appointment totals all use the same helper.
- Fees apply to items only, never delivery (D22).
