# Items inquiries and mid-data — approved 2026-10-25

Owner approved checking and deploying eggs, evolution-unlock inquiries, and nine mid-data products. Existing static HTML/CSS/Vanilla JS/GAS/Sheets/Pages/PWA architecture retained.

## Scope

- Two ITEM subcategories INQUIRY_EGG and INQUIRY_UNLOCK use customer-provided, unchanged game screenshots. Compact All-items shortcuts; full images, stock-image disclaimer and text box below each poster. Drafts live only in memory and are independent by category. Explicit copy, feedback/manual fallback and Messenger links; no auto-send, fake availability lookup, price, SKU or cart for these inquiry pages.
- MID_DATA is an ordinary ITEM subcategory backed by existing authenticated catalog writes. Nine requested names, initial price 1 THB/อัน, stock999. No frontend price/stock fixture ships. Server pricing/stock validation remains authoritative.
- Eleven public image assets go through the existing content-addressed public asset allowlist and checksum verification. No database, backup, credential or internal fields in the release.
- No GAS change/deploy, new framework, Auto Bump, PC2 or customer/order writes.

## Backup / rollback

Remote backup/pre-item-inquiries-20261025 is exactly dc04d1cf76f73052df53e047fa21f9b23a09ce09 (pre-change website). Dispatch site-release.yml candidate with deploy=true on that branch to rebuild the exact prior frontend. Do not use the ancient rollback-baseline package.

Whole database copied before new categories/items; verified native Sheets type and owner-only permissions. Backup metadata is kept outside public source/artifact. Never restore the whole backup automatically: it could overwrite later customer/order data. Catalog changes are additive, and original products are not edited. If data rollback is required, review only the newly added MID_DATA product IDs and hide them through authenticated catalog actions; do not delete/rewrite old products or history.

## Verification

Preflight: syntax; item_inquiries (readable and production-minified); site_build; minified_behavior; catalog_controls; service_catalog; frontend_refresh_races; site_security; publication_privacy. Build contains explicit public files only. Existing known historic refresh-source assertion is not used to claim the entire old suite green.

Built browser preview4192: live read-only catalog/settings, both exact user screenshots load at678×368 and368×367, copy message actually matches Clipboard without sending, form below poster, mobile390px no horizontal overflow. Relevant cart/service/pricing tests use mocks, not real order mutations.

Public baseline and final readback checks stored outside repository: require exactly nine additions, all existing public product fields and unrelated settings identical, each added item price1/available999/statusACTIVE/unitอัน/categoryMID_DATA. Release/workflow/live checks recorded separately after deployment.
