# Shop improvements — local candidate, 3 November 2026

This candidate preserves the static HTML/CSS/Vanilla JS + Apps Script + Google
Sheets + GitHub Pages/PWA architecture. It has not been pushed, deployed or
applied to a live spreadsheet. Production credentials and product values have
not been changed. DATS and Auto Bump are outside this change.

## Five improvements

1. Seal cards show pack price, pack leaf count and split-sale price together.
   Existing prices, price sorting and the 1,000-leaf Starmon/Gotsumon exceptions
   are unchanged.
2. Admin Settings adds HTTPS poster URLs and heading/hint/example text for egg
   and evolution-unlock inquiries. Blank settings keep the original asset/text.
   The existing service poster controls remain in place. These new poster
   controls accept URLs; they are not new file-upload controls.
3. Seal/item product edit forms add an unchecked "I checked stock now" checkbox.
   Only an explicit authenticated confirmation stamps `stockVerifiedAt` with
   server time. Reloading the catalog or editing unrelated text does not stamp
   a new check. Missing dates remain unverified, and dates older than 24 hours
   receive a warning. Services remain unlimited and show no stock-check label.
4. The seal budget tool proposes at most 250 distinct NORMAL basic products, one
   1,000-leaf pack each, cheapest first within the selected line and gross
   budget. It uses only ACTIVE, sufficient-stock records checked in the previous
   24 hours, and refuses offline data. It is not an optimal character build,
   promotion quote, purchase, reservation or automatic Messenger send. Copying
   recomputes from current data. Initially no previously unverified live record
   will qualify; the owner must actually check stock first.
5. Automation/Backup adds a recovery checklist and an OWNER/ADMIN-only read-only
   preview of backup/current table row counts. No file IDs, URLs or record data
   are returned by the new preview endpoint. Users/Sessions/Backups are excluded.
   Preview does not create a backup, run schema migration or perform a restore.
   It does not prove recovery works; an isolated restore rehearsal is still due.

## Follow-up: basic budget and combined rare one-leaf set

The owner subsequently confirmed one combined BASE_HARD + SUSA set, one leaf
per included species, plus a new Digimon-themed poster. See
`RARE-LEAF-SET-20261103.md`. Budget suggestions now exclude all SUSA (including
the two old starter/full-set exceptions) and BASE_HARD, use NORMAL packs only,
and continue cheapest to dearest until the next full pack is unaffordable.

## Additive schema and public/private boundary

- `Seals` and `Items`: append `stockVerifiedAt` using the existing header-name
  migration; do not replace existing columns or backfill dates from `updatedAt`.
- Settings (created only when saved): `eggPosterUrl`, `eggHeading`, `eggHint`,
  `eggExample`, `unlockPosterUrl`, `unlockHeading`, `unlockHint`, `unlockExample`.
- Only the above display content and stock-check timestamp are added to public
  allowlists. Costs, reserved-stock internals, notes, sessions, security data,
  CRM and backup metadata remain private.
- The timestamp means the last explicit human check, not the last stock
  transaction or catalog fetch. Other stock actions do not claim a fresh human
  check. A stock/status/unit/pack change saved through the product edit form
  without reconfirmation clears its date.
- Forged client `stockVerifiedAt` is ignored by product upsert. All existing
  server price/order/stock calculations and role checks remain authoritative.

## Local verification

Run `npm run test:shop-improvements`, the catalog/inquiry/seal-set/service/security
regressions, `npm run test:minified`, `npm run build:site`,
`npm run test:site-build` and `node tests/publication_privacy.js --candidate`.
The new suite covers readable/minified behavior, budget bounds and freshness,
unit handling, URL refusal and text escaping, validation before settings writes,
server-only stock timestamps, and a non-mutating backup-count preview.

A loopback-only synthetic preview is stored outside the production source in
the task output directory. It never calls the production API, accepts no writes,
and serves only release-allowlisted public assets. Admin previews there are
static snapshots, not functional saves or live backup checks.

## Still required before publication

Publication/live sheet work requires a separate explicit owner request.

1. Take and verify a recovery copy before any authorized live migration.
2. Rehearse on a separate test spreadsheet and Apps Script deployment first.
3. Check new column headers, cell types and inherited validation. Preserve
   existing data and validation; adjust only the newly appended timestamp
   column if it inherited an incompatible rule. Do not auto-clear old rules.
4. Confirm checkbox OFF preserves/clears dates as documented; ON records server
   time and does not change price, stock or reserved quantity by itself.
5. Save egg/unlock content and verify public output, fallback and service poster
   compatibility. Verify unauthorized users cannot save or inspect backups.
6. Use a known READY test backup to compare counts; rehearse actual restoration
   only in an isolated copy. Reconcile orders created after the backup before
   considering a real restore. Row counts alone are not an integrity proof.
7. Verify real API responses, cache refresh/PWA behavior and mobile layout after
   any approved backend/frontend deployment. The local VM tests are not live
   Apps Script, Drive permission or spreadsheet validation tests.

## Rollback

Redeploy the previous known-good frontend/backend through the normal release
workflow if explicitly authorized. Leave additive columns/settings in place;
the previous version ignores them. Do not delete records, erase dates, change
credentials or restore the production spreadsheet automatically. The existing
real Restore operation remains owner-confirmed and potentially destructive;
the new preview does not execute or certify it.
