---
name: ponytail-audit
description: Whole-repo audit for over-engineering — ranked delete/simplify/stdlib/native list. Use when the user says "ponytail audit", "audit for over-engineering", "find bloat", or "what can I delete from this repo".
disable-model-invocation: true
---

# Ponytail Audit

Like ponytail-review, but scans the entire codebase instead of a diff. Rank findings biggest cut first.

## Tags

Same as ponytail-review:

- `delete:` dead code, unused flexibility, speculative feature.
- `stdlib:` hand-rolled thing the standard library ships.
- `native:` dependency or code the platform already provides.
- `yagni:` abstraction with one implementation, config nobody sets, layer with one caller.
- `shrink:` same logic, fewer lines.

## Hunt for

Deps the stdlib or platform already ships, single-implementation interfaces, factories with one product, wrappers that only delegate, files exporting one thing, dead flags and config, hand-rolled stdlib.

## Output

One line per finding, ranked: `path:L..-L.. tag: finding. replacement.`

End with: `net: -N lines, -M deps possible.`

Nothing to cut: `Lean already. Ship.`

## Boundaries

Over-engineering and complexity only. Lists findings; applies nothing. Respects project-required patterns (i18n, security layers, loading states) — do not flag those as bloat.
