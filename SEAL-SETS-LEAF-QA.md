# Seal sets and leaf sales — preview checkpoint

Status: local preview only. No production sheet migration, push or deployment for this changeset.

## Implemented
- Thai seal-set names and category colors; prices derived from shop product prices.
- Admin-configurable set membership, visibility and optional images.
- Compact cart with grouped sets and editable category discounts.
- Per-seal split-sale checkbox; local initial selection covers 84 starter-set members.
- Leaf-stock representation while preserving canonical spreadsheet price/unit fields.
- Additive stock migration with explicit confirmation, separate backup, formula checks and rollback.

## Evidence already passed
- Catalog controls, set validation/security, leaf sales, server-authoritative pricing and stock transitions.
- Confirmation safety, site security, minified behavior and relevant dynamic UX checks.
- Local browser save/reload: split sales OFF shows pack price; ON shows leaf price without changing stock.
- Local browser settings save/reload: AT set 194 at 10% gives 174.60; restored to 5%.
- Migration simulation: backup before writes, injected failure rollback, formula preservation/rejection and idempotent rerun.

Local HTTP tests execute the current Apps Script functions against in-memory sheet fixtures. They do not prove live Apps Script persistence or production deployment.

## Still required before production
- Production conversion completed and independently verified: 252 seals, 84 selected split-sale members, zero pack-price differences and zero available-leaf differences. Initial inherited BOOLEAN validation on the new stockUnit column caused a deferred error; repaired ONLY validation/marker column after verifying every stock/reservation against the immediate pre-migration backup. No migration rerun or second multiplication. Added flush-before-success/flush-on-rollback plus deferred-error regression, and boolean checkbox idempotence regression. Frontend deployment still pending at this checkpoint.
- 2026-10-13 latest evidence supersedes earlier pending notes: real synthetic Apps Script release QA 8/8 PASS after OAuth grant; private backup created before migration; duplicate request/cancel stock tested. Additional real-sheet partial-edit preservation regression PASS. Local reordered-header regression PASS. User pasted clipboard output and confirmed correct quantities/subtotal/category discount/net/D2.
- Production stock migration and backend/frontend deployment NOT yet performed. Private full-sheet pre-deploy copy verified owner-only; rollback branch preserves 80f7c5a. New allowSplitSale checkboxes in Production currently default FALSE; explicit initial membership selection must be handled without overwriting owner choices.
- Test project Candidate now contains the latest source, with doGet/doPost renamed to candidateGet/candidatePost, ensureDatabase renamed to candidateEnsureDatabase and ss() restricted to qaDatabase(). Release QA runner is first in Candidate so its menu selection can be verified. Original Candidate source retained in CUA variable candidateBackupText. No live shop code was changed.
- Real synthetic test stopped BEFORE stock conversion: SpreadsheetApp.create lacked spreadsheets scope. Owner authorized adding scope; test manifest changed from spreadsheets.currentonly to spreadsheets. Google now shows "จำเป็นต้องให้สิทธิ์"; "ตรวจสอบสิทธิ์" was clicked but no OAuth tab appeared in IAB. User authorization UI still pending; do not count real 8-case QA as PASS.
- Browser local budget-title edit/save/reload/refresh verified persisted title "🌟 ให้ร้านจัดซีลตามงบของคุณ". Preview server restarted with latest mock adapter, session 41867. Production remains undeployed/unmigrated.
- 2026-10-13: added editable budget title/description/button/template in Settings, escaped public rendering, sheet-text sanitization and explicit public-field allowlist. Local backend adapter permits these four fields. Browser shows latest refresh confirmation and +1,000 leaf button; one click after refresh completion yielded exactly 1,000 leaves, 40 subtotal, 2 discount and 38 net. Clipboard exact readback and budget-setting save/reload still pending.
- Existing separate synthetic Apps Script project located: 1SU586D0jlf7Oiw8MS1Z5dIS3y6o9vR_992K8P4zra6Eo0-rvd0u4-6tR; Candidate.gs/TestConfig.gs/TestHarness.gs visible. Latest source has NOT yet been uploaded or executed there. Verify test sheet binding before replacing Candidate source or running harness.
- Test current Apps Script changes on a separate synthetic sheet/deployment.
- Confirm backup and explicitly authorize production leaf-stock conversion; follow SEAL-LEAF-STOCK-MIGRATION.md.
- Review final source/artifact, then separately authorize push/deployment and read-only production checks.

Production data, Auto Bump, Facebook, PC2 and Worker were not used for mutations or testing.
