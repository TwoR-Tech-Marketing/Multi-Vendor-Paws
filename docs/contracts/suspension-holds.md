# Contract: suspension-holds

## Today (AS-BUILT)

vendors-suspendVendor takes shouldSuspend and optional durationDays. No mode. No hold case. Permanent suspend disables Auth (AB-3). Ban sets isBanned with status suspended (AB-1).

## Target (S1.2 / A2.1)

### Extended suspendVendor

Request:

```
{
  vendorId: string,
  shouldSuspend: boolean,
  mode?: "hidden" | "view_only",  // required when shouldSuspend true
  reason?: string,
  durationDays?: number | null
}
```

Side effects when suspending: set suspension on vendor, put open orders (and appointments) on hold, create holdCases/{id}.

### holdCases/{id}

| Field | Type |
|---|---|
| vendorId | string |
| mode | "hidden" \| "view_only" |
| orderIds | string[] |
| appointmentIds | string[] |
| status | open \| resolved |
| createdAt | timestamp |

### unsuspendVendor

Lifts suspension and releases holds.

## Auth policy

O5 still open: recommendation is keep Auth enabled on suspend, disable only on ban. Contract must not lock Auth disable behavior until O5 is answered. S1.2 is blocked on that for permanent suspend Auth behavior.

## Rules needed

- holdCases: admin and functions only.
- Vendor may read own suspension reason and expiry (already needed by session).
