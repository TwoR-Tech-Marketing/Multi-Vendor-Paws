---
name: halo-and-platform-vendor
description: Use when touching Halo items, the platformVendor seller id, the isHalo field or admin created products.
---
# Halo and the platform vendor

- Halo items are sold by the admin (the platform), like Noon Express. They are separate from vendor items.
- The marketplace shows approved vendor items plus the admin Halo items.
- Seller id for the platform is platformVendor with store name "Tender Paws".
- Source of truth for "is Halo": vendorId equals platformVendor only (D28, answered O1). isHalo is no longer written or read; kept in documents for compatibility.
- Findings from code review (verify before relying on them): the products.isHalo boolean exists but the mobile badge and filter use platformVendor; no create path was found that sets isHalo true; the admin panel add product path does not stamp vendorId or isHalo (AB-10, fix in A2.3 / S2.8).
- Halo items are created only in the admin panel. Vendors cannot create or flip Halo.
- Halo delivery uses category to governorate by ID. Halo is not affected by vendor suspension.
- Halo is TenderPaws' own store for the single-vendor cart (D20).
