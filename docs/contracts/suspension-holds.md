# Contract: suspension-holds

Locked by S1.2 (2026-11-08). Auth policy from D28 (O5 answered).

## Extended suspendVendor

Callable: `vendors-suspendVendor` (existing).

Request:

```
{
  vendorId: string,
  shouldSuspend: boolean,
  mode?: "hidden" | "view_only",  // when suspending; default "hidden" if omitted (best practice)
  reason?: string,                 // required when shouldSuspend true
  durationDays?: number | null
}
```

Side effects when suspending:

- Sets `vendors.status` suspended and `suspension { mode, reason, at, expiresAt }`
- Mirrors reason/expiry on `users`
- Puts open `vendorOrders` (pending, confirmed, shipped) on `holdState: "held"`
- Creates `holdCases/{id}`
- Does **not** disable Auth (D28). Only a permanent ban disables login. Existing suspended vendors keep their current Auth state (no backfill).

When `shouldSuspend` is false: lifts suspension, clears `suspension`, releases open hold cases and order holdState.

`liftExpiredVendorRestrictions` also releases holds when an expired suspend is lifted.

## holdCases/{id}

| Field | Type |
|---|---|
| vendorId | string |
| mode | "hidden" \| "view_only" |
| orderIds | string[] |
| appointmentIds | string[] |
| status | open \| resolved |
| createdAt | timestamp |
| createdBy | string \| null |
| resolvedAt | timestamp \| null |

## Vendor clients (S1.14 with S1.2)

Session profile includes `suspensionMode`. Portal and vendor app show mode, reason, and expiry on the suspended status screen.

## Rules needed

- holdCases: admin and functions only.
- Vendor may read own suspension reason and expiry (session callable).
