# Multi-Vendor Paws — Website UI Prototype

Static HTML/CSS/JS prototype for **client approval** of the Multi-Vendor **web portal** (not the mobile app).

## Open locally

Open `index.html` in a browser, or from project root:

```bash
open docs/prototype/index.html
```

## Brand color options (client choice)

Use the top bar to switch:

| Option | Source | Primary colors |
|--------|--------|----------------|
| **Orange — Mobile App** | `tinder_paws` | `#F45726` → `#F42664` |
| **Purple — Admin Panel** | `tinderpaws_panel` | `#6366F1` → `#8B5CF6` |

Selection is remembered in `localStorage`.

## Screens (Phase 3 scope)

| Section | Screens |
|---------|---------|
| **A** Onboarding | Login, Registration, Store Setup, Account Status |
| **B** Products | Product list, Add/Edit product |
| **D** Orders | Vendor orders, Order detail & status |
| **F** Financial | Earnings & payout-ready entries |
| **E** Admin | Vendors, Products oversight, Orders monitoring, Audit log |
| **G** Security | Roles & permissions |

**Note:** Section **C** (buyer marketplace, Halo labeling, multi-store browse) is **mobile app only** — called out on the overview screen.

## Navigation

**Inside the website UI (what the client approves):**
- **Tablet & desktop (768px+):** fixed **portal side menu** (Dashboard, Products, Orders, Admin…)
- **Mobile (<768px):** same menu as a **drawer** — tap ☰ in the top bar

**Prototype helper (top dark bar only):**
- **Prototype screen** dropdown — jump between all demo pages while reviewing

**In-page:** overview cards, tables, and buttons navigate between screens instantly.
- **URL hash:** each page has a link like `#/dashboard` (shareable, browser back works)
- **Keyboard:** ← → between screens, `Esc` closes mobile drawer
- Sign in on login → Vendor Dashboard
