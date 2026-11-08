# Contract: telehealth

Status: stub. Locked in tickets TH-1 and TH-2.

## Model (BM-3, D27)

- Doctor is a vendor type using the portal and the vendor app with a chat inbox.
- Price is configurable by the admin.
- One payment buys one chat; when the doctor ends it, a new chat needs a new payment.
- A paid chat enters a queue; any available doctor accepts; no acceptance in 15 minutes flags support for a manual refund.
- Photos allowed, no video. Reuses the buyer app chat.
- Doctors paid through deals and payouts. Doctor pay terms remain an owner detail.

## Endpoints

| Name | Caller | Status |
|---|---|---|
| Telehealth: start paid chat, accept, end, queue timeout | Buyer, doctor, system | Planned TH-1, TH-2 |
