# Starmon / Gotsumon set quantities

Owner-approved correction: HT-NORMAL-47 (Starmon, HT) and DE-NORMAL-170 (Gotsumon, DE) belong to SUSA and sell by1,000-leaf pack. Preserve their existing pack price and leaf-storage stock; disable split sales only for these two records. No category/ID/name/stock conversion or global purchase cap.

Set composition includes these exact SUSA exceptions alongside ordinary NORMAL members; no other SUSA or BASE_HARD products become eligible. Starter and full sets include1 pack for each exception. Other full-set members retain3 packs. Applies to configured sets, default sets, admin member picker and all-line sets. Backend validates exceptions with the same exact allowlist while retaining category/pack/price guards and stripping untrusted fields.

Display, computed set price, stock check, actual cart quantities, compact group representation and group quantity changes use the same per-member multiplier. Prices derive from existing server-provided pack/unit prices; the server remains authoritative for order pricing and reservation. Cart group signatures include quantities to prevent incompatible compositions from merging.

Regression: `node tests/seal_set_quantity_caps.js`, `node tests/seal_sets_security.js`, `node tests/catalog_controls.js`, `node tests/seal_leaf_sales.js`, `node tests/catalog_header_mapping.js`. Production mangling parity in `tests/minified_behavior.js` includes these SUSA exceptions. Site security/build/publication-privacy tests remain required. Unit fixtures do not substitute for live readback and browser checks after release.

Deployment sequence: back up current backend and confirm matching deployment; deploy compatible backend, publish frontend, then update only the two catalog records via authenticated owner UI. Preserve all unrelated records/settings and verify unit/pack price/available leaves before/after. Do not run stock migrations. Rollback requires the compatible frontend/backend pair while either record remains SUSA; do not restore old strict NORMAL-only validation blindly.
