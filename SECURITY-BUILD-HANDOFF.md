# Security/build checkpoint — 2026-09-17

## Security remediation — 2026-09-21 (latest)

Owner authorized private backup and removal of the exposed legacy workbook, without
rewriting Git history or changing visibility. Backup verified byte-identical outside
the repository; tracked workbook removed from current local publication sources.
No runtime dependency on this workbook. See SECURITY-REMEDIATION.md.
New publication privacy guard runs in both candidate/rollback workflow paths.
Build, rollback, security 8/8, minified 9/9 and legacy audit 21 PASS rerun successfully.
Eight live cases and remaining browser checks are NOT completed.
STOP BEFORE PUSH/DEPLOY: owner must confirm legacy template accounts' credentials
and sessions replaced/revoked or accounts disabled. Historical/public remote copies
are not erased by this local removal. Never restore this workbook to a public path.

## Latest resume — 2026-09-21 (supersedes historical status below)

User explicitly authorized fixture servers 4176–4177; startup now succeeds.
See SECURITY-BROWSER-QA.md for real browser evidence and remaining gates.
Full automated regression PASS; minified behavior now 9 PASS. Both build artifacts
still pass. Browser storefront/cart/mobile/admin navigation and offline recovery
were tested using mock data only. Native confirmation control stalled on source
and build; clipboard payload and installed-PWA upgrade remain unverified in browser.
Fixed fixture product kinds/MIME/allowlist, added network-isolation CSP and redacted
request counts plus tests/browser_smoke_contract.js. Application pricing/UI and
Worker source remain unchanged in this follow-up. No Production access/writes,
push, deploy, visibility/Pages changes or PC2 action. See QA report for owner choices.
Fixture servers stopped at handoff; ports 4176/4177 have zero listeners.

## Resume update — 2026-09-19 (read this first)

Continued locally from a0ddb57. Current results: SECURITY-BUILD-REVIEW.md.
Deployment/rollback instructions: SECURITY-DEPLOY-RUNBOOK.md.
Added canonical LF build inputs, shared minifier settings, minified differential
tests (8 PASS), redacted audit classification/workbook scan and fixed-baseline
allowlisted rollback build. All automated suites run again successfully.
Candidate `site-af78194fb7289c23cc83`; rollback `site-fe4d9b97d1f9e435f955`.
Rebuild after commit for clean commit metadata in release.json.

User has resumed; earlier pause text below is historical. An async permission
question was sent for retrying fixture server startup on 4176/4177; no answer yet.
Do not interpret the elapsed time or generic continue messages as a specific answer.
No server retry, browser QA, remote changes, or Production mutations were performed.
Source/UI templates are unchanged and compared in VM; no real browser timing yet.
Do not rerun the whole audit from scratch: complete the outstanding items listed in
the new review document, then update that document with actual evidence.

## User pause and authorization

User is turning off PC1 and will return in 5–6 hours. Save and pause now.
Resume from this repository and branch; do not restart/rewrite.
Authorized scope: read-only exposure audit, conservative production minification,
API/session/role audit and targeted fixes, publish-only file allowlist, regression.
Watermarks/images/content-copy restrictions were explicitly removed from scope.
Production customers continue using the current deployed site throughout development.
**No push, deployment, repository visibility change or Pages setting change until owner approval.**
**Facebook/PC2 is paused. No Worker launch, browser/session/Pair changes, Scheduler or real comments.**
The source tests are allowed; they passed without using a Facebook session.

## Locations and rollback baseline

- Repository: `C:\Users\Gx\Documents\Codex\2026-08-08\dmo-backoffice-pro-phase-1-chatgpt\work\v20_2_production_repo`
- Branch: `security/site-build-review`
- Production frontend baseline: `e4b9b33c0a4848e734cdba5c8b53c17f3839e6c6`
- Production Apps Script: v35 from previous task; not changed in this task.
- Remote: `https://github.com/shop-dmo/shop-dmo.git`
- Public URL stays `https://shop-dmo.github.io/shop-dmo/`.
- Local generated candidate: `dist/` (ignored, reproducible).
- Existing unrelated untracked `.tmp-worker-package-validation-3f8a04d with space/`
  and `artifacts/` were preserved; do not stage or delete them.

## Verified exposure findings (read-only)

1. GitHub public API confirmed repository `public`, `has_pages=true`, main default.
2. GET of the Pages `GoogleAppsScript.gs` path returned HTTP 200, 162,973 bytes.
   Branch-root publishing currently exposes internal source files. New allowlisted
   artifact fixes the Pages publication surface only after deployment/configuration.
3. Git history scan covered 46 reachable commits and 250 unique text blobs.
   Script outputs only object/path/rule, never matched values. Heuristic candidates
   include fixture credentials, DOM field names and assertions; review/classification
   remains incomplete. No claim of an exhaustive secret scan or no historical leaks.
4. Tracked workbook contains one nonempty Users passwordHash matching the legacy
   insecure default marker already known to application migration code. Never print
   the hash/password or attempt it against Production. Candidate login rejects this
   record explicitly even if migration has not marked RESET_REQUIRED.
5. Workbook inspection showed no nonempty checked customer-contact/order-admin-note
   fields and no session rows. Many counted worksheet rows are preformatted template
   rows, not real populated records. Settings key/value secrets and embedded workbook
   content need further review; do not claim the complete workbook is clean.
6. One public API GET returned ok=true in 5,225 ms with 272 catalog products;
   recursive checked keys did not include costPrice, reservedStock, passwordHash,
   passwordSalt, token, apiKey, adminNote, customers, orders, sessions or backups.
   Public response contains catalog, promotions, allowlisted presentation settings.
   This is one observation, not a latency benchmark or proof of every endpoint.

## Changes prepared locally

- `scripts/build-site.js`: pinned Terser/CleanCSS/html-minifier-terser dev tooling;
  readable source untouched; moderate name mangling/whitespace/comment removal;
  no property mangling, unsafe math, eval wrapping or source maps. Fixed output
  directory rejects unknown files or symlinks instead of deleting them.
- Publishes exactly 10 allowlisted files: index, app JS/CSS, config, SW, manifest,
  two icons, .nojekyll, release.json. No GAS, Worker, workbook, tests or backups.
- Content-derived cache version and release.json containing commit/dirty marker,
  output SHA-256/size inventory. No timestamps, machine paths or secrets in manifest.
- `sw.js`: same-origin exact shell allowlist, no caching arbitrary source/API URLs,
  no duplicate network requests on versioned shell hits, cleanup limited to app cache
  prefix, bounded navigation fallback, failed JS never falls back to HTML.
- `GoogleAppsScript.gs`: reject unauthenticated admin actions before ensureDatabase;
  role checks before cache invalidation (archive/restore/integrity included);
  reject invalid expiry and unrecognized session role; deny known legacy default;
  invalidate existing user sessions before changing password/role/status, preserving
  sessions for display-name-only edits. No per-request Users scan added.
- `tests/site_security.js`: 8 executable cases covering these boundaries.
- `tests/site_build.js`: artifact allowlist/hash/syntax/path/config checks and actual
  built SW executed in VM, testing install/activate/offline/privacy/cache behavior.
- `.github/workflows/site-release.yml`: manually dispatched review/build pipeline,
  deploy defaults false, official actions pinned to checked commit SHAs, only `dist`
  uploaded. No remote workflow/settings changed. The current branch publishing mode
  MUST be switched safely to Actions during a later owner-approved cutover.
- Existing local smoke server can serve dist with DMO_SMOKE_BUILD=1 and fixture API;
  traversal containment was tightened. The smoke server was NOT successfully started.

## Latest verification before pause

`npm test`: exit 0. Includes Worker 79/79, Facebook GAS 30/30, reliability 6/6,
audit 21 pass with 8 live-only cases NOT RUN, dynamic UX 15/15, password compatibility,
subcategory deletion, image security, backend races 7/7, frontend races 14/14,
login transport 8/8, migration 8/8, new security 8/8.

`npm run build:site`: exit 0.
Candidate version before checkpoint commit: `site-5e1366f35e27b72180a6`.
Generated release still references baseline commit and dirty=true until rebuilt after
checkpoint. Rebuild on resume; do not mistake baseline commit for candidate release.

`npm run test:site-build`: exit 0 (artifact and built-SW behavioral checks).
`git diff --check`: passed; CRLF normalization warnings only.
`npm install` dependency audit at install: 0 known vulnerabilities (25 packages).

Measured file sizes (bytes, source -> output / gzip source -> output):

- app.js: 298347 -> 239030 / 73109 -> 61556 (~20% raw, ~16% gzip reduction)
- app.css: 49098 -> 47571 / 11262 -> 10535
- index.html: 791 -> 726 / 458 -> 436
- config.js: 253 -> 227 / 243 -> 225

These are transfer-size improvements, not measured end-user page speed.

## Explicit blocker, not a completed browser test

An attempt to launch two local fixture servers with PowerShell Start-Process
(hidden, ports 4176 and 4177) was rejected by automatic approval review:
`rejected: blocked by policy`. No detailed policy reason was returned.
Do not retry by disguising the command or bypassing the restriction.
Follow-up listener check returned no listeners for these two ports.
Actual browser smoke, before/after browser performance, mobile/layout and service
worker update transition remain NOT RUN for this candidate. Need user direction
or approved environment to run the fixture servers when resuming.

## Next work in order (after user resumes)

1. Read this checkpoint; git status/diff/log first. Preserve unrelated untracked work.
2. Finish source-exposure classification and workbook Settings checks without printing
   matched values. Prepare a concise redacted audit report; no secret rotation/history
   rewrite without owner authorization.
3. Review security diff for compatibility and add any missing meaningful tests. Ensure
   source changes don't pretend to prevent legitimate anonymous public API access.
4. Test minified application behavior, including cart/discount/D2/order text, admin
   login/menus, image flows and cross-tab races. Consider a differential VM harness
   with the exact minifier options, in addition to a real browser fixture when allowed.
5. Review build determinism across LF/CRLF and commit metadata; inspect CI workflow
   dependencies and release/rollback sequencing. Run tests after any material fixes.
6. Complete build/browser/PWA migration and performance checks, distinguishing source
   regression from actual minified browser behavior. Do not call 8 live GAS cases PASS.
7. Document rollback using an allowlisted baseline artifact, not re-exposing repo root.
8. Deliver concrete audit, candidate, test evidence and pending configuration decisions;
   wait for owner approval before push/deploy/Pages/visibility changes.

## Important limits and pending owner decision

Minification is copying friction, not access control. Browser-visible assets and
public catalog API can still be downloaded; copying them cannot be prohibited with
CORS, Referer checks, a hidden browser key or an origin-only JS check. Private admin
actions must rely on server authentication/roles. No fake domain lock was added.

Repository remains Public, so build-only Pages does not hide source/history on GitHub.
Private repository Pages for an organization requires an eligible GitHub plan (GitHub
Team/Enterprise per current docs); account plan was NOT inspected. Do not switch
visibility or purchase a plan during this paused task. Preserve current URL/history.
Source already copied while public cannot be recalled.

References consulted:
- https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://terser.org/docs/options/
