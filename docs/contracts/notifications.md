# Contract: notifications

## Vendor notifications inbox

Portal feature exists under `/notifications`. Vendor app: PC-3.

### Collection (existing pattern)

notifications or vendor-scoped inbox docs keyed by vendorId / uid. Exact field names follow the portal repository when S1.6 / PC-3 implement the shared path. Do not invent a second schema.

### Endpoints

| Name | Caller | Status |
|---|---|---|
| registerVendorFcmToken | Vendor | Planned S1.6 |
| Portal notifications BFF / client read | Portal | Live today |
| Shared inbox list callable or Firestore stream | Portal + app | S1.6 / PC-3. O18 covers stream vs function |

### registerVendorFcmToken

Request: token (string), platform (ios|android|web).
Auth: signed-in vendor.
Side effect: store token on users/{uid} or a device subcollection; clear on logout.

## Rules needed

- Vendor reads own notifications only.
- Token writes: owner only or through the callable.
