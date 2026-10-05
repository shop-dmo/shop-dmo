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
3. Finish browser native-confirm/clipboard and installed-PWA upgrade testing.
   Browser-tab service-worker version upgrade and offline fallback are verified below;
   this does not establish separately installed Windows PWA behavior.
4. Explicitly approve push, Pages Actions cutover and GAS deployment only after
   reviewing these results and the deployment runbook. URL remains unchanged.

## Follow-up: actual browser service-worker upgrade (2026-09-21)

Local-only fixture at 127.0.0.1:4176/shop-dmo/, with mock data and local API:
- Loaded rollback shell site-fe4d9b97d1f9e435f955, verified script URLs in DOM.
- Replaced only the fixture server with candidate site-af78194fb7289c23cc83.
- Reload rendered candidate script URLs and the mock storefront.
- Stopped the fixture server, then reloaded: candidate script URLs remained and
  storefront rendered 28 mock products. Offline reload took about 4.24 seconds
  including browser-tool overhead; not a Production performance measurement.
- Fixture processes were stopped. No Production cache/session/data was changed.

Fixture runner now accepts a fixed `DMO_SMOKE_BUILD=rollback` option, in addition
to 0 (source) and 1 (candidate), and rejects other values.

## Real Apps Script/Sheets integration (2026-09-24)

After owner-granted authorization, editor run QA35ef1b80 completed from 14:22:26
to 14:24:26 Asia/Bangkok on an isolated private copy: 8 PASS, 0 FAIL.
Candidate GAS source was copied unchanged; an editor-only isolation harness used
new QA-prefixed tables, not original rows. Verified cases:
- Normal mixed-category order: server ignores forged totals, 600 minus 25 = 575;
  saved pricing snapshot remains unchanged after changing the test discount setting.
- Insufficient stock rejects without partial Orders/OrderItems/reservation writes.
- Duplicate request returns the same order without another order row.
- Repeated request reserves stock exactly once.
- Cancellation releases reserved stock once, including repeat cancellation.
- Picking state writes and repeat picking is idempotent.
- Completion deducts stock once through valid transitions, including repeat completion.
- Real session rows enforce OWNER/ADMIN/STAFF/VIEWER role checks and revocation.

These are real GAS engine + Spreadsheet service integration tests, not a deployed
HTTP/browser end-to-end flow. The local v20_1 audit's eight NOT TESTED labels refer
to that separate E2E coverage and are not converted into unconditional PASS claims.
The harness cleans up its main reservation and revokes synthetic test sessions.
No Production orders/stock/users or Facebook/PC2 actions were used.

Clipboard recheck: copy success toast displayed, but browser automation's virtual
clipboard read returned empty and its Paste operation reported no data. Manual
owner copy/paste verification requested on local mock cart (one mock seal, net 95).
This is unresolved, not a demonstrated application defect or a PASS.

### Clipboard manual verification resolved (2026-09-24)

Owner supplied a screenshot of the copied mock order pasted into Windows Notepad.
Verified visible content: mock seal 1, quantity 1, subtotal 100 THB, seal discount
5 percent / 5 THB, total discount 5 THB, net 95 THB, D2 eligible subtotal 100 THB
and reward 150. Thai text, line breaks and the order disclaimer are readable.
Clipboard copy/paste for this case: PASS, based on owner-performed real paste and
screenshot evidence. The empty automation virtual clipboard is not evidence of an
application failure. Other browser/E2E/installed-PWA checks remain separate gates.

## Remaining-gate follow-up (2026-09-25)

Previously recorded PASS cases were not rerun. Added `test:confirmations`: 10 PASS
on actual extracted source/minified handlers. Archive, restore, category deletion
and stock adjustment cancellation make zero API calls; acceptance makes one call;
cancelled or blank reasons block archive/stock mutations. This is offline handler
simulation, not a claim of native-dialog/browser or live HTTP coverage.

Local fixture login and category edit opened in browser. After editing a category
label and clicking Cancel, browser control timed out on Input.dispatchMouseEvent;
getJsDialog returned undefined and the next snapshot timed out on
Emulation.setFocusEmulationEnabled. No repeated click or Production action was
attempted. Owner verification of the visible native dialog was requested.

Windows app inventory did not expose an installed SHOP DMO PWA window. Requested
that the owner open the installed app or approve a local-only test PWA installation.
No app was installed and no installed-PWA upgrade PASS is claimed.

Release gates remain: native dialogs, installed-PWA upgrade, and deployed test
HTTP/browser E2E (the eight real GAS/Sheets integration cases already passed).
No Production data, Facebook, PC2, Worker, push or deployment was touched.

### Owner manual category-confirm check (2026-09-25)

After instructions to edit a local mock category, cancel closing, and cancel the
unsaved-changes confirmation, the owner reported completing the steps without
problems. This specific manual flow is PASS based on owner attestation, not an
automated observation. Do not rerun it solely because browser control timed out.
This does not establish acceptance/discard, other destructive dialogs, installed
PWA upgrade, or test HTTP/browser E2E coverage; those gates remain separate.

### Remaining native-dialog check: inconclusive

On the localhost Chrome tab, the category-delete control opened an actual
`confirm` dialog. Control then reported `No dialog is showing` while attempting
to dismiss it. One resulting request was denied by the fixture with
`LOCAL_SMOKE_READ_ONLY`; the category list remained unchanged. A second distinct
category produced the same dialog-control mismatch. Stop further native-dialog
attempts; neither cancellation nor acceptance is counted as PASS from this run.
No application defect is established by this automation mismatch.

Native Windows window discovery exposed no SHOP DMO/local-test Chrome window;
the visible Chrome/Edge windows were unrelated, including Facebook and remote
desktop. They were not activated or manipulated. Installed-PWA verification must
wait for a targetable local-test window or owner-operated install/open step.
The private QA GAS harness remains editor-only and explicitly must not be
published as a web app; HTTP staging still requires a separately isolated setup.

### Installed PWA: manual upgrade baseline prepared

Owner screenshot shows LOCAL SMOKE running in a standalone app window. Native
window enumeration still cannot target that window; do not substitute unrelated
Chrome/Facebook/remote-desktop windows. Added optional fixture-only release badge
(`DMO_SMOKE_RELEASE_BADGE=1`), leaving build artifacts and app/SW logic unchanged.
Stopped verified fixture PID 20912 only, started baseline fixture PID 25156 on
127.0.0.1:4176/shop-dmo with DMO_SMOKE_BUILD=rollback. HTTP 200 verifies the badge
and app.js query both identify site-fe4d9b97d1f9e435f955. Await owner normal reload
in installed app and screenshot of baseline badge, then switch fixture to candidate
site-af78194fb7289c23cc83 to test upgrade. No installed upgrade PASS yet.

Owner subsequently confirmed the baseline badge matched exactly after reload.
Switched only the verified local fixture process from PID 25156 to candidate
PID 5748, retaining browser cache and the installed app. HTTP 200 confirms
candidate badge and app.js query site-af78194fb7289c23cc83. Await installed-app
normal reload and owner verification; server response alone is not upgrade PASS.

Owner confirmed the installed app displayed `LOCAL PWA QA:
site-af78194fb7289c23cc83` after the candidate switch and normal reload, following
the earlier exact baseline confirmation. Installed-app shell upgrade: PASS by
owner attestation, with no cache deletion or reinstall. The owner also reported
normal operation; this does not independently prove every cached asset or offline
launch. Do not repeat the baseline/candidate manual upgrade flow.

Installed-app offline check pending: stopped verified fixture PID 5748 only and
verified no listener on 4176. Owner to normally reload the installed app and report
whether candidate badge/shell remain available without server. Restore the local
candidate fixture (build=1, base=shop-dmo, port=4176, release badge=1) after evidence;
do not mistake the deliberately offline fixture for a Production outage.

Owner confirmed normal operation after the installed-app offline instructions
(including a follow-up explicit Thai confirmation). Installed-app offline smoke:
PASS by owner attestation, not automated cache inspection. The supplied screenshot
was of the in-app browser and is not itself installed-app evidence. Restored the
candidate fixture on port 4176, PID 7552. No need to repeat this manual smoke flow.

## HTTP staging safety review (2026-09-26)

Do not publish the existing copied integration workbook/project directly as a test
web API. Source review found `ensureDatabase()` invokes `migrateLegacy()`, which
reads the literal sheet name `Prices` rather than a prefixed SHEETS mapping. Merely
prefixing the tables in a HTTP harness is insufficient isolation when startup
migration runs. This is a staging-design risk, not evidence of a new Production
exposure or of a failed application test. The editor-only integration harness did
not run that full initialization path and must remain editor-only.

Recommended HTTP staging: a separate empty workbook with synthetic fixtures only
and a separate test Apps Script deployment, no copied user/session/customer rows,
no Production endpoint/config, and no Facebook operations. No HTTP deployment or
live sheet mutation was performed during this review. Await owner confirmation of
creating those additional test resources before proceeding with this safer setup.

## Synthetic HTTP staging checkpoint (2026-09-28)

Owner authorized a new empty workbook and separate bound script. Created workbook
`13k78wFEQ9GZ4YDrbiv9buG_S26Foil1WYomtrKYCtVQ`, project
`1SU586D0jlf7Oiw8MS1Z5dIS3y6o9vR_992K8P4zra6Eo0-rvd0u4-6tR`, title
`DMO HTTP E2E SYNTHETIC ONLY 2026-09-26`. No Production data was copied.
Manifest uses spreadsheets.currentonly; the adapter validates exact project,
workbook ID and title and replaces ss() and initialization. Facebook routes are
not exposed. Bootstrap adaptation is NOT a test of original full migration.
Owner granted Google authorization; initialization log confirmed three synthetic
products, four synthetic roles, and successful completion at 21:26:12.
No test web-app deployment has been opened yet.

An editor automation mis-target displayed synthetic test config in prior tool
output. Treat BOTH test gate and password as disclosed. Do not reproduce them.
Local config rotation now completed with random replacements outside repository.
Exact-value scan: no old values in private staging files; no old/new credentials
in tracked publication sources or the intended new confirmation test. Historic
chat/tool output cannot be erased by repository cleanup. Cloud credential/session
rotation and current deploy-artifact scan remain required before Test API opens.

Terminal CreateProcess error 5 reproduced on 2026-09-27. On 2026-09-28 explicit
Windows PowerShell with login=false successfully ran Get-Location, Git and ACL
reads. No ACL, execution policy, antivirus, elevation or security setting changed.
The earlier launcher failure's exact root cause is not established; do not claim
folder-permission repair. Pending changes and prior PASS evidence were preserved.

### Rotation verified, then test-only credential exposure recurred

Owner ran rotateSyntheticQaCredentials. Cloud log at 21:00:08 confirmed all four
synthetic credentials rotated, sessions revoked and QA_EXPIRES closed. No values
were logged by that function. Added editor-only openSyntheticQaWindow with a
rotation-ID precondition, but it has NOT run. Created isolated test deployment v1,
then browser automation targeting the TestHarness option instead selected
TestConfig and disclosed the new synthetic config in tool output. Treat this
second set as compromised too. Do NOT reproduce either credential set.

Immediately removed that test-only deployment using clasp undeploy (success).
No HTTP business-route tests were performed. No Production deployment or data
change. Before resuming, rotate again and prevent editor content from reaching
tool output: inspect only bounded non-secret controls, never whole editor AX/DOM
or screenshots when config may be selected. The browser targeting mismatch is a
tooling security blocker, not an established application defect. Old tool history
cannot be scrubbed by file edits. All pending HTTP/E2E gates remain NOT RUN.

### 2026-09-29 containment follow-up

Generated another random synthetic credential set locally and uploaded only the
four allowlisted files to the separate test project. No values printed. Local
exact-value scan again found no previous set in staging files and no old/new set
in tracked repo sources/intended confirmation test. Rotation helper now persists
QA_PRIVATE_CONFIG in Script Properties after updating the synthetic users and
revoking sessions. Owner must run this updated helper before switching source to
property-only configuration. Do NOT inspect TestConfig/editor snapshots.

After successful owner run, set DMO_QA_CONFIG_MODE=properties and execute private
prepare-test.cjs, verify TestConfig has no literal credentials, then push the test
project before any editor navigation/deployment. Do not repeat credential rotation
just to resume. Private test-rotation.cjs passed local mock checks for targeted
updates, session clearing, property persistence, idempotence, mismatch fail-closed
and lock release; this is not HTTP/E2E evidence. Test web deployment remains
removed; Production is unchanged.

### Synthetic HTTP 8/8 PASS; browser relay launch blocked

Owner rotation log at 02:26:01 confirmed private config stored, four synthetic
credentials rotated, sessions revoked, gate closed. Rebuilt TestConfig.gs to read
QA_PRIVATE_CONFIG only; verified no current gate/password literals in any of the
three uploaded .gs files. Test-only clasp push confirmed at 10:57:07. Opened the
four-hour test window at 10:57:38; no credential change involved in this step.
Created separate test deployment v2 (property-only configuration). Production
deployment/config/data untouched. Test window expires automatically after four
hours; do not describe it as manually closed.

Private http-preflight.cjs: missing gate rejected, synthetic OWNER login and logout
PASS. Private http-regression.cjs completed 8 PASS / 0 FAIL across 34 POST requests
plus public GET: (1) authoritative mixed 5/10/0 pricing with forged browser total,
(2) reservation without deduction, (3) duplicate request idempotence, (4) insufficient
stock without partial mutation, (5) cancellation/release idempotence and unchanged
pricing snapshot, (6) pick/completion idempotence and exactly-once deduction,
(7) VIEWER/STAFF restrictions and revoked logout session, (8) public response
protected-field exclusion. Synthetic records only. Sessions logged out in runner
cleanup. Detailed redacted results/timings: private staging http-regression-result.json.
Do not rerun these successful cases unnecessarily.

Prepared private browser-relay.cjs for candidate dist on localhost 4177, strict
static allowlist, same-origin CSP and only the exact synthetic API upstream.
Synthetic UI login alias maps privately to the test password, so this UI adapter
does not prove browser password handling against the raw endpoint (HTTP login was
tested separately). Relay launch did NOT occur: Windows again rejected process
creation with Access is denied / os error 5, even using explicit PowerShell and
login=false. No elevation/security changes or alternate-process bypass attempted.
Browser E2E/remaining dialogs and final deploy gates remain pending. No commit,
Git push, Production deployment or rollback executed in this continuation.

### 2026-09-30 / 2026-10-01 browser HTTP continuation

After owner restarted Codex, explicit PowerShell worked again without ACL/security
changes. Started the isolated relay on 127.0.0.1:4177. Renewed only the existing
four-hour synthetic test window (latest 2026-10-01 03:25:46 Bangkok); no credential
rotation. PWA and completed HTTP 8/8 were not rerun.

Actual candidate browser -> isolated GAS observations:
- Public catalog rendered the synthetic seal at 100, stock 49. Cart showed 5%
  discount (5), net 95, D2 150. Clear-cart empties immediately by existing design;
  it is not a native-confirmation test.
- Submitted one synthetic browser order, GUN-20261001-032618-D3E21CE1. Success UI
  showed backend total 95 and emptied cart; submit was disabled while pending.
- QA-OWNER alias login succeeded. Dashboard and Orders scopes loaded. Orders
  displayed the same new order and its 100/5/95 pricing snapshot.
- Relay timings (single samples, not Production): public refresh 4615 ms,
  createOrder 14992 ms, login 2445 ms, dashboard 7438 ms, orders 5188 ms.
- Clicking this order's archive button timed out in browser Input dispatch;
  getJsDialog returned none and AX/screenshot did not expose the native dialog.
  No archive request appeared in relay metrics. Archive/restore native UI coverage
  remains pending; do not mark it PASS from the handler simulation. Presented the
  synthetic tab for owner assistance. The order still holds its test reservation;
  finish archive/cancel cleanup when browser interaction is available.

No Production, Facebook, Worker or PC2 actions; no push/deploy/rollback. Existing
dirty changes preserved. Remaining deployment gates have not been waived.

Owner later confirmed clicking archive in IAB produced no dialog. This is a FAIL
for visible confirmation in that browser, not yet an identified application root
cause. Actual handler invokes native confirm before prompt/API. On resumption,
the page had auto-locked and QA_REQUEST_REJECTED indicated the expired test gate;
renewed the same synthetic window at 2026-10-01 12:27:23 Bangkok. No credentials
changed. Need comparison in owner's ordinary Chrome, without touching any Worker
browser/profile, before deciding whether a UI change is justified.

Follow-up clarification: owner said cancel did not archive, then said accept did
not work. Inspection showed the synthetic browser order's status is CANCELLED;
relay metrics show updateOrder success, not archiveOrder. This supports status
cancellation rather than proven native-dialog cancellation. Withdraw the earlier
conversational PASS interpretation for the native cancel path: it remains
UNVERIFIED. Archive bin still zero. Do not infer an archive API failure from this.

### 2026-10-01 to 2026-10-03 archive/restore fix and new date gate

Changed only order archive/restore confirmation UX to an in-page HTML dialog,
using textContent for dynamic text, explicit cancel/close/submit, required trimmed
reason for archive, duplicate-dialog prevention, and session-token guard after
the asynchronous decision. Render closes the dialog after logout/navigation.
Backend business logic and Facebook code remain unchanged.

Actual Chrome + synthetic HTTP checks: dialog renders, blank archive reason cannot
submit, cancel leaves order unchanged, archive moves target order into bin (1),
reason saved, restore cancel retains it, accepted restore returns it to active
orders. API archive 5057 ms, restore 4706 ms in these samples. Read-only follow-up
verified one restored target, CANCELLED/RELEASED, total 95, seal stock 49 and reserved
0. This is not Production timing or testing. HTTP 8/8 and installed PWA were not
rerun unnecessarily.

Found additional real UX issue: restore API succeeded but subsequent orders read
timed out at 26 seconds, leaving stale archived row and actionable restore button.
Fix: after confirmed archive/restore success, retire loaded orders scope until
fresh read succeeds. Failure now uses the existing retry view and explicitly says
the mutation succeeded; no blind mutation retry. Handler regression verifies this
on source/minified code, along with session changes during dialog. Latest build
site-86a1a0825639fb6c029c observed in Chrome script URLs. Browser later confirmed
restored order visible and bin 0. Actual forced read-timeout UI on this latest build
has not yet been exercised; handler/state regression passed.

Relevant verification: confirmation handler simulations 14 PASS, minified behavior
9 PASS, frontend races 14 PASS, backend cache/session 7 PASS (preceding follow-up),
site build + SW contract PASS, diff check PASS. No Git commit/push or Production
deploy during this continuation. Local changes remain uncommitted.

NEW DEPLOY GATE: createdAt display shifted across synthetic status/archive/restore
operations. Do not claim date preservation or blame frontend without diagnosis.
Uploaded editor-only inspectSyntheticOrderDates helper to the exact isolated test
project (presence verified after interrupted CLI session). Its read-only execution
2026-10-03 03:41:23 showed Sheet America/Los_Angeles vs script Asia/Bangkok, Date
value ISO 2026-09-29T23:26:18.337Z for target created by browser at 2026-10-01
03:26 Bangkok. This is more than a single display offset; establish date round-trip
behavior and test environment configuration before deployment. No date repair,
timezone setting change, Production inspection/mutation or history rewrite done.
Helper is private staging only, not part of website/repository. Test API's last
four-hour window was opened 2026-10-02 21:24:38 and is now expired, not manually
closed. Restarted app lost prior shell sessions/browser handles; don't assume the
relay remains live without checking its port/process.

### 2026-10-03 synthetic timezone alignment — PASS

Owner explicitly authorized fixing the Sheet/Apps Script mismatch. Created a
native backup of only the synthetic workbook; metadata verified owner-only access.
Immediately before the setting change, the Sheets connector reported Etc/GMT
(different from the earlier editor observation). Set only spreadsheet timeZone
to Asia/Bangkok; readback and Apps Script execution both confirm Asia/Bangkok.
No production spreadsheet settings, existing cell values, credentials or sharing
were edited. No attempt was made to repair historical synthetic timestamps by
guessing an offset. A timezone setting change does not undo old timestamp drift.

Private editor-only scratch-tab test: native Date 2026-10-03T00:26:18.000Z survives
three getValues/setValues cycles with the same epoch; Sheet displays
2026-10-03 07:26:18. PASS observed at 09:28:07. Native Sheet visual inspection
confirmed the probe values and readable columns.

Targeted real Apps Script integration on a NEW synthetic service-only order:
GUN-20261003-155443-13F83A7D. cancel -> archive -> restore -> archive-cleanup PASS
at 15:55:08. Native createdAt epoch and pricingJson unchanged at every step;
all pre-existing order rows and seal/item product rows unchanged. Final new test
order CANCELLED / RELEASED / archived; no stock was reserved or deducted for the
service-only fixture. Test API gate was not reopened; no credentials rotated.
This is editor-executed backend integration, not a new HTTP/browser E2E result.

The isolated environment's timezone/date-transition gate is resolved for new
records. Historical test date drift remains documented, not silently repaired.
No production timezone claim is made. No website/backend business code changed
in this correction, so already-passed PWA/HTTP suites were not rerun. No commit,
Git push, Production deploy, Facebook, Worker or PC2 action in this correction.

### Production timezone preflight — BLOCKED (2026-10-03)

Owner requested read-only Production timezone verification and explicitly required
stopping if incorrect. Checked metadata only on the production workbook ID grounded
in current source. Live Sheet reports America/Los_Angeles, while the expected
timezone and saved pre-v35 Apps Script manifest are Asia/Bangkok. Current live
Apps Script manifest was not revalidated, so do not claim both live settings were
read. No Production values, settings, user records or credentials were accessed
or changed. No timezone correction, timestamp repair or deployment performed.

Stopped as instructed before the new browser forced-timeout test, final security/
artifact/rollback audit and commit. Earlier PASS results remain recorded; these
remaining release gates are not waived. Requires owner-approved backup and impact
review before changing Production timezone; do not apply guessed historical date
offsets. No Git push, Facebook/PC2/Worker action or rollback required.

### 2026-10-04 authorized Production timezone correction

Owner explicitly approved private backup, live Apps Script inspection and targeted
timezone correction. Created owner-only native database backup outside Public
Repository; downloaded script HEAD and exact deployed v35 into private backup
directories. Both actual manifests confirm Asia/Bangkok. Changed only Production
spreadsheet property timeZone from America/Los_Angeles to Asia/Bangkok; connector
readback PASS. Narrow date-only cell samples from Orders and Sessions retained
identical userEnteredValue, number format and display after the change. This is
a sample check, not a complete database equality claim. No tokens/hashes read.

Old numeric-date session expiry can be interpreted earlier; owner informed that
fresh login may be necessary. No session extension, credential change, row write
or historical date repair. No Apps Script code deploy was necessary for this
configuration correction. Native backup and exact code versions retained privately.
No Facebook menu, Scheduler, PC2 or Worker action. Other final release gates remain.

### 2026-10-05 final synthetic browser timeout gate — PASS

Actual browser against isolated synthetic HTTP relay, candidate
site-86a1a0825639fb6c029c. One storefront submission returned an order ID and a
persistent success panel with backend total 95; cart cleared and submit disabled.
Injected non-forwarded orders-read delay exceeded the real 26-second client
deadline. Admin showed a read error and retry control, no misleading zero totals
or stale order actions. After fault disabled, retry loaded the same single order,
100 before discount / 5 discount / 95 total, without another create request.

Next, archived that same synthetic order once. Successful archive response followed
by injected read timeout visibly rendered: mutation succeeded but latest list could
not load, with read-only retry. No archived row/action remained visible during the
failure. Disabled fault and retried the read only. Relay metrics confirm exactly
one successful createOrder and one successful archiveOrder. Backend readback
confirmed one matching archived CANCELLED/RELEASED order, snapshot total 95 and
category discount 5, seal stock 49 and reserved 0. No blind mutation retry.
Synthetic session used for independent verification was logged out. Test window
renewed after normal four-hour expiry; no credentials changed. Prior HTTP 8/8 and
installed PWA PASS cases were not replayed.

Final candidate/rollback publication-privacy checks PASS. Known current synthetic
password/gate literal scan of 68 tracked/intended files found zero matches; no
values printed. No tracked workbook, CSV, ZIP, env or log files in filename audit.
Unrelated untracked artifacts/package-validation directory excluded from commit.
Public source/history remains public by owner instruction, not an anti-copy claim.

DEPLOY HANDOFF: GitHub Pages settings page is logged out (Sign in + 404). Cannot
verify Pages source or execute approved cutover until owner logs in. Do not push
an intermediate release or change production deployment while this gate is open.
Production timezone correction is complete; web and Apps Script code remain on
previous deployed versions. Private backups retained. No rollout/rollback executed.
