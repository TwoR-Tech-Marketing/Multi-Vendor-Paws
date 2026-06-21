---
name: ponytail-review
description: Review diffs for over-engineering only — what to delete, stdlib/native replacements, YAGNI cuts. Use when the user says "ponytail review", "review for over-engineering", "what can we delete", "is this over-engineered", or "simplify review".
disable-model-invocation: true
---

# Ponytail Review

Review diffs for unnecessary complexity. One line per finding: location, what to cut, what replaces it. The diff's best outcome is getting shorter.

## Format

`path:L..-L.. tag: finding. replacement.`

Tags:

- `delete:` dead code, unused flexibility, speculative feature. Replacement: nothing.
- `stdlib:` hand-rolled thing the standard library ships. Name the function.
- `native:` dependency or code doing what the platform already does. Name the feature.
- `yagni:` abstraction with one implementation, config nobody sets, layer with one caller.
- `shrink:` same logic, fewer lines. Show the shorter form.

## Examples

- `src/utils/email.ts:L12-38 stdlib: 27-line validator class. "@" in email, 1 line.`
- `src/format.ts:L4 native: date lib imported for one format call. Intl.DateTimeFormat, 0 deps.`
- `repo.py:L88 yagni: AbstractRepository with one implementation. Inline until a second exists.`

## Scoring

End with: `net: -N lines possible.`

If nothing to cut: `Lean already. Ship.`

## Boundaries

Scope: over-engineering and complexity only. Correctness, security, and performance are out of scope — route to a normal review. Does not apply fixes; lists only. Respects project rules for i18n, security, and architecture when judging what is bloat vs required.
