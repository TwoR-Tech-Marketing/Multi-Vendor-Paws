---
name: ponytail-debt
description: Harvest all ponytail: comments into a debt ledger — shortcuts deferred with ceiling and upgrade path. Use when the user says "ponytail debt", "list the shortcuts", "ponytail ledger", or "what did ponytail defer".
disable-model-invocation: true
---

# Ponytail Debt

Collect every deliberate `ponytail:` comment into one ledger so deferrals don't rot into "later means never".

## Scan

Search the repo for comment markers, skipping `node_modules`, `.git`, and build output:

`grep -rnE '(#|//) ?ponytail:' .`

Each hit is one ledger row.

## Output

One row per marker, grouped by file:

`path:L.. ceiling: .. upgrade: ..`

Flag `no-trigger` when a comment names no upgrade path or trigger — those rot silently.

End with: `N markers, M with no trigger.`

Nothing found: `No ponytail: debt. Clean ledger.`

## Boundaries

Reads and reports only; changes nothing unless the user asks to write the ledger to a file (e.g. `PONYTAIL-DEBT.md`).
