# Local security-build browser QA — 2026-09-20/21

Scope: PC1, loopback fixture ports 4176 (built artifact) and 4177 (readable source).
No Production data, Facebook menu/Worker/session, PC2, GitHub settings or deployments
were changed. Server startup explicitly authorized by the user succeeded; the prior
policy denial is no longer the startup blocker.
After QA, only the two identified fixture processes were stopped, both ports were
confirmed not listening, the test tab was closed and viewport override reset.

## Changes in this follow-up

- Corrected missing `kind` in fixture products (admin had labeled seals/services as
  items). This was a fixture defect, not evidence of a Production catalog defect.
- Correct manifest MIME and limit both fixture static roots to public shell files.
- Fixture CSP restricts connections and form submissions to its own origin and
  disables frames. This is test isolation only, not a deployed anti-copy mechanism.
- Added redacted request counters and explicit loopback-only contract tests.
- Added executable source/minified parity tests for modal dirty input and both
  cancel/confirm outcomes. No storefront, pricing, stock or Worker code changed.

## Actual browser observations

| Check | Result / limits |
|---|---|
| Built storefront | 28 seal fixtures rendered; item/service tabs usable |
| Mixed cart | Seal 100 at 5%, item 200 at 10%, service 300 at 0%; discount 25, net 575; D2 150; no 0% category detail |
| Copy button | Success toast displayed; browser clipboard read returned empty, so clipboard payload delivery is NOT verified here; text calculation parity passes in VM |
| Subcategories/mobile | At 390x844, Normal selected, 14 articles, document width 375 <= viewport 390; screenshot inspected |
| Login/Dashboard | Fixture login and dashboard loaded on source and build; no real credentials used |
| Admin startup requests | Before opening other menus, counters showed one login and one dashboard request per origin; no public catalog request for direct #admin startup |
| Admin sections | Catalog, categories, images, inventory, analytics, reports, orders, customers, promotions, trash, calculator, settings, security, integrity, automation and logs rendered; Facebook and external Wiki actions excluded |
| Empty sections | Orders/CRM/history/etc use empty fixtures: this checks rendering/navigation, NOT live business mutations or real database completeness |
| Settings/back-to-shop | Rechecked successfully after page finished loading; one earlier click during transition did not navigate, not reproduced as a persistent build defect |
| Modal backdrop | Clicking the visible backdrop left product modal open |
| Dirty modal confirmation | INCOMPLETE in browser: native confirmation handling/CDP timed out on readable source too; no reliable UI cancel/confirm result. VM regression verifies logic on both source and minified code |
| Console | No warn/error entries observed during the completed online menu checks; offline connection failures are expected during the deliberate outage test |
| Offline recovery | Stopped only local 4176 fixture process; reload still rendered storefront with Offline Cache (~2748 ms observed), then restarted server and manual refresh showed new fixture timestamp and online data badge |

### Performance sample (not Production performance)

Wall-clock browser automation measurements, three **warm cached Dashboard reloads**
with fixture backend; includes tool/control overhead. Source: 115 / 77 / 79 ms
(median 79). Build: 85 / 75 / 95 ms (median 85). These small samples do NOT establish
a speed gain, nor measure Apps Script latency. New menu observations ranged about
0.28–3.65 s including automation waits; one early click was interrupted by rerender
and succeeded after observing the completed page. No backend speed claim is made.

## Automated verification

- `npm test`: exit 0; Worker 79/79, Facebook GAS 30/30, recovery simulations 6/6,
  security 8/8, login transport 8/8, frontend races 14/14, backend races 7/7,
  migration 8/8, dynamic UX 15/15 and other existing suites PASS.
- Existing audit: 21 PASS, 0 FAIL, **8 live-GAS-only cases NOT RUN**.
- `npm run test:minified`: **9 PASS**, including new dirty-modal behavioral case.
- `npm run test:site-build` and rollback build test: PASS.
- `node tests/browser_smoke_contract.js`: PASS for both 4176 and 4177; actual local
  config, manifest MIME, CSP, fixture kinds, denied source/workbook paths, denied
  createOrder, no credential/token values in request counters. Requires the two
  approved local fixture servers already running; it never starts a Worker.
- Candidate remains `site-af78194fb7289c23cc83`; rollback remains
  `site-fe4d9b97d1f9e435f955`. Follow-up changes are tests/docs only.

## GitHub read-only check and deployment gates

Public API on 2026-09-20: `shop-dmo/shop-dmo`, visibility public, private false,
has_pages true, default branch main. Organization billing/eligible plan and exact
current Pages source setting have NOT been authenticated/verified this round.

Official documentation reviewed:
https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
https://docs.github.com/en/organizations/managing-organization-settings/managing-the-publication-of-github-pages-sites-for-your-organization

Free organization Pages requires a public repository. To keep this organization
repository private while continuing public Pages, an eligible Team/Enterprise plan
is needed. Private **website access** is different and is not desired for customers.
No plan purchase, visibility change, transfer or Pages setting change performed.

Owner decisions / remaining gates before deployment:

1. Keep public source/history knowingly, or verify/approve an eligible organization
   plan and private repository. Build-only Pages alone cannot hide GitHub source.
2. Supply/authorize a separate test GAS/database environment for the eight live
   integration cases. Do not use Production writes as a substitute.
3. Finish browser native-confirm/clipboard and installed-PWA upgrade testing; real
   offline fallback is verified, version-upgrade behavior currently has VM coverage.
4. Explicitly approve push, Pages Actions cutover and GAS deployment only after
   reviewing these results and the deployment runbook. URL remains unchanged.
