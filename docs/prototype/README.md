# Tender Paws — Vendor Portal Prototype

Interactive **vendor-only** HTML/CSS/JS prototype for Phase 3 client approval.

## Open

```bash
open docs/prototype/index.html
```

## Auth flow (Phase 3 · Section A)

| Screen | Purpose |
|--------|---------|
| **Landing** | Public home — sign in / create account |
| **Sign in** | Email + password |
| **Sign up** | 3-step wizard: account → store profile → review & submit |
| **Account status** | Pending / active / suspended (admin activation) |
| **Forgot password** | Demo reset UI |

Sign-up collects all approved vendor fields:

- Owner name, email, phone, password
- Store name, description, logo, address
- Contact phone & email
- Admin approval workflow → `pending` until activated

### Demo account

- Email: `vendor@happytails.com`
- Password: `password123`
- Status: **active** (full portal access)

New sign-ups get **pending** status and cannot access Products/Orders until approved (demo guard).

## Vendor portal (after sign-in)

- Dashboard, Account Status, Store Profile, Products, Orders, Earnings
- **Side menu** on tablet/desktop (≥768px)
- **Drawer** on mobile (<768px)

Admin governance is **not** in this site — it lives in the Tender Paws admin panel.

## Brand colors

Top bar: **Orange** (mobile app) or **Purple** (admin brand reference).

## Note

Auth uses **localStorage** for this prototype demo. Production `Multi-Vendor-Paws` Next.js app uses **Firebase Auth** (`pets-acd3f`).
