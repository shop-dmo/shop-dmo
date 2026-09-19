# Reviewed build deployment and rollback

Status: prepared locally; NOT pushed or deployed. Owner approval is required.
Production URL stays https://shop-dmo.github.io/shop-dmo/.

## What this release can and cannot protect

Only the 10 allowlisted files in `dist/` are website artifacts. Apps Script,
workbook, Worker, tests, internal documents and backups are not uploaded to Pages.
Minification removes comments and internal identifier readability; no source maps.
No watermark, right-click blocking, F12 blocking, domain-locked JavaScript or new
customer authentication is introduced.

The browser must receive public assets and catalog information; these remain
copyable. CORS is not authentication and this release does not block deliberate
requests to an anonymous public API. Admin actions require valid server sessions
and roles. The existing server-authoritative price/discount/stock logic is preserved.

**A public source repository still exposes source and history on github.com.**
Build-only Pages does not change this. To hide future source while retaining this
repository/history/URL, verify the organization has an eligible GitHub Pages plan
for private repositories before changing visibility. GitHub Team/Enterprise supports
this per GitHub documentation; organization billing was not inspected. No plan is
purchased or settings changed by the prepared workflow. Already downloaded source
cannot be recalled. Do not rewrite Git history or rotate credentials automatically.

## Before approving production

1. Confirm code-review results and all automated suites, then complete fixture browser
   QA including login, storefront/cart, menus, mobile, cache update/offline and timing.
2. Review the exposed legacy workbook hash finding; candidate login rejects that
   known legacy default. Do not try the password on Production. No evidence was
   obtained that current Production users use that legacy record.
3. Confirm repository plan/visibility decision and owner approval for Push, Pages
   workflow cutover and Apps Script deployment. Do not push while branch-root Pages
   might publish an intermediate source change before the planned cutover.
4. Record current Pages source and GAS deployment version. Current baseline recorded
   for this task is frontend e4b9b33 and GAS v35; verify again at cutover.
5. Commit approved changes and build clean artifacts with Node 24:
   `npm ci --ignore-scripts`, `npm test`, `npm run test:minified`,
   `npm run build:site`, `npm run test:site-build`.
6. Build rollback before publishing: `npm run build:rollback`,
   `node tests/site_build.js --rollback`. Retain release.json with SHA-256 inventory
   outside the website. This rollback uses baseline frontend files plus the new
   conservative minifier and restricted SW; it is not a byte-identical old deploy.

## Approved cutover sequence

1. Change GitHub Pages source to GitHub Actions in the owner-approved window. The
   current published site should be checked throughout; do not promise zero downtime.
2. Push the reviewed commit/workflow. No workflow runs on push; only manual dispatch.
3. Run `Review and release public site` with deploy=false, package=candidate, on
   the reviewed revision. Inspect successful regression and the Pages artifact.
4. Configure/verify protected `github-pages` environment approval where available.
5. Deploy reviewed Apps Script code to the EXISTING deployment URL, after staging
   verification. Keep v35 available for rollback. No schema/data rewrite required.
   Existing properly formed sessions are retained; future admin changes to an
   account's role/status/password revoke that account's sessions intentionally.
6. Manually dispatch the same reviewed revision with deploy=true, package=candidate.
   The workflow uploads only dist and needs pages:write/id-token:write solely in
   the deployment job. Official actions are pinned to inspected commit SHAs.
7. Verify root/#admin HTTP 200, release.json version/checksums, config/API endpoint,
   manifest/icon paths, PWA update, existing-session reload and owner login.
   Verify `.gs`, workbook, tests, Worker and internal docs return 404 from Pages
   without fetching credentials or exposing private content in reports.
8. Read-only Production check: public field allowlists, catalog/pricing display,
   admin menu data. Do not create real orders, alter Stock, enable Facebook Scheduler,
   launch PC1 Worker or contact PC2. Verify repository source visibility separately.

## Rollback

- Frontend: dispatch reviewed workflow with package=rollback-baseline, deploy=true
  after owner approval. Output is `dist-rollback`, with a distinct SW/cache version.
  It contains only the public allowlist, never repository-root files.
- Backend: if the new authentication/session behavior causes a verified regression,
  repoint the existing GAS deployment to recorded v35 after owner approval. Keep URL
  unchanged. Revoked sessions cannot be resurrected; users sign in again if needed.
- No rollback step deletes or rewrites orders, stock, customers, profiles or backups.
- Do not revert Pages to branch-root publishing as a casual rollback; it re-exposes
  the workbook/internal files this task is meant to remove from the website.

## Evidence limits

The current automated checks exercise actual built Service Worker code and minifier
settings, but a VM fixture is not browser/mobile testing. Eight legacy audit cases
still require a separate live Apps Script test database. Do not mark these PASS
without executing them in a safe test environment.

References:
- https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
