# Owner-approved shop improvements release — 3 November 2026

Owner approved resizing the combined rare set to normal-card size, checking the
system and deployment of the reviewed improvements. Retain existing Pages,
Apps Script URL, Sheets, PWA and all product data; no credentials or scopes change.

## Reviewed changes

- Explicit seal pack/leaf prices; owner-editable egg/unlock poster URLs/text;
  genuine manual stock-check provenance; basic-only ascending budget suggestion;
  read-only recovery plan and combined BASE_HARD/SUSA one-leaf quote + new poster.
- Combined rare card now uses the SAME `seal-set-grid`, `seal-set-card` and
  `seal-set-image` classes as ordinary sets. No oversized680px card or360px
  poster override. Desktop QA measured both cards455px wide, poster180px high,
  no horizontal overflow. Details collapse; stock/unit exceptions retained.
- Combined quote is separate from ordinary cart. Server sums public per-leaf
  prices, rounds up once to whole baht; fixed pack-only products are excluded.
  No messages, orders or stock reservations are executed by the quote tool.
- New public cache namespace prevents a previous deployment's catalog payload
  omitting the new derived quote. No manual sync/stock timestamp write is used.

## Safety / verification

Full npm suite, focused readable/minified shop/quote tests, catalog/quantity-cap,
seal-leaf stock/order mocks, service/inquiry/security/cache regressions, built
artifact/PWA and publication privacy checks pass locally. The legacy audit
still labels8 real Apps Script order/stock/role cases live-only; this is not a
claim those were executed on production. No real order/payment/message test.

Backend source and deployment40 are retained before updating the existing
production deployment. Facebook module/manifest are unchanged. Data verification
uses anonymous before/after snapshots outside the public repository and compares
all existing products, settings and promotions; only a derived public quote is
new. No destructive recovery test or automatic timestamp backfill is performed.

## Release / rollback procedure

Use the existing site-release.yml manual workflow on the reviewed main commit,
candidate/deploy=true, only after backend update/read-only checks pass. Verify
workflow success, actual release commit/version and built shell/poster hashes.
Keep the pre-release69346e5 baseline as an exact backup ref; retain
Apps Script40. Actual deployment identifiers, results and screenshot evidence
are recorded in the private task checkpoint, not in public backup metadata.

If rollback is needed, obtain owner direction before any data operation. The
prior frontend can run with the additive backend; use the retained source ref,
not the ancient rollback-baseline package. Do not delete new columns/settings,
overwrite the workbook, reset credentials or restart Auto Bump/DATS.
