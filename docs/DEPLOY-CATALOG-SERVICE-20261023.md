# Catalog/service release — 2026-10-23

Owner explicitly approved deployment after local preview.

## Scope

- New storefront visits default to displayed price descending. Manual sort remains available.
- Normal seals compare their displayed pack price; split BASE_HARD/SUSA compare the displayed leaf price.
- Seal sets keep AT/HT/CT/HP/DS/DE/EV/BL grouping and sort descending within each group.
- SERVICE selection ignores stored inventory counts, hides remaining-count/stock-only controls, and asks customers to contact the shop for appointments.
- Explicit OUT_OF_STOCK/INACTIVE/HIDDEN service status remains respected.
- Existing quantity-input safety limits remain; unlimited means no inventory-based limit, not unbounded numeric input.
- No backend, live Sheets, credentials, product values or Facebook Worker changes.

## Verification before release

Passed: catalog_controls, service_catalog (including mock-Sheets server-side service pricing/no reservation/no deduction), frontend_refresh_races (14), seal_leaf_sales, site_security (8), site_build, minified_behavior (9), publication_privacy --candidate, syntax and diff whitespace checks.

Browser preview: production-minified build, default descending selection; real anonymous seal snapshot (256 products) starts at 1990/1400/1200 THB; SUSA displayed leaf prices descend. Synthetic service selection of 1000 succeeds beyond fixture inventory of 999; test cart removed afterwards. No real orders or chat messages submitted.

Known pre-existing test failure: v20_2_dynamic_ux manual-refresh static source assertion fails identically on parent commit 3809290; no refresh implementation changed. Dedicated refresh-race tests pass. This release is not a claim that every historic test passes.

## Rollback

Production before change: commit 38092904edb2d541be20dcd0881eb6cd1be27c49, release site-6ab72a9f406f4cae51ea.

Preserve branch backup/pre-catalog-service-20261023 at that exact commit. If post-release verification finds a significant regression, dispatch site-release.yml from that backup branch with deploy=true and package=candidate. This rebuilds the exact pre-change source; do not use the much older rollback-baseline option for this release. Do not revert or rewrite live product data. Preserve test evidence and existing untracked local directories.

Production checks and deployment run are to be recorded separately after publishing. Browser PWA checks do not prove every installed device has updated.
