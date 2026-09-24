# Workbook exposure remediation — 2026-09-21

User authorized backup outside the public repository, removal of the exposed
workbook from current publication sources, no history rewrite and no visibility
change. Deployment remains conditional on clearing owner-managed credential risk
and completing the outstanding integration/browser checks.

## Completed locally

- Preserved the original workbook byte-for-byte outside the repository and outside
  the website build directories; SHA-256 comparison matched before removal.
- Removed the tracked workbook from the current tree and ignored its old filename.
- No application runtime source references the workbook. The website uses its
  existing Apps Script API; no replacement data service or schema change is needed.
- Candidate and rollback public artifacts exclude workbooks/internal files.
- Workbook audit now requires an explicitly supplied private input path, rather
  than assuming the sensitive workbook belongs inside the repository.
- Added publication_privacy.js to prevent this snapshot/fingerprint from returning
  to the public tree/artifacts. This is a regression guard, not credential revocation.

## Remaining exposure / stop before deployment

The previously confirmed public repository/main still contains the old file until
an approved push/cutover. The existing Git history also retains its original blob.
Removing the current file cannot retract copies or erase that historical exposure.
This task does not rewrite history or make the repository private.

The workbook includes a legacy password hash. We have NOT tried the password,
verified its use against Production, or confirmed the corresponding credential and
all existing sessions have been revoked. Do not report the credential as harmless
or inactive without that evidence. No credential values are included here.

Owner action required: confirm that any shop account created from the old template
has had its password replaced with a unique current password and old sessions
invalidated, or that the corresponding account was disabled/removed. If that password
was reused elsewhere, change it at those services too. Do not send passwords/tokens
in chat. Preserve a working owner account when managing access.

The server-side known-unsafe credential fingerprint is retained solely as a denylist
to reject the exposed legacy credential; deleting that guard would weaken safety.
It is not a usable seeded credential and is excluded from public site assets.

## Audit scope

Redacted history scan: 49 reachable commits / 280 unique text blobs; 60 matches were
DOM attributes and 17 test fixtures/assertions; one historical workbook object.
No remaining review-required match under the configured token/credential patterns.
This heuristic result does not prove arbitrary secrets/personal information absent.
Historical workbook review found no identified Orders/Customers/Sessions records;
it does contain shop/template data and a password hash, so it must not be republished.

## Rollback / production

No Production data, repository visibility, remote history, Facebook/PC2/Worker or
Scheduler state was changed. No Push/Deploy performed while the risk is unresolved.
Retain the private backup for owner recovery; NEVER restore it to the public branch
or publish repository-root files as a frontend rollback. Use the already-tested
allowlisted rollback artifact and the recorded GAS deployment rollback procedure.

Native-confirm/clipboard/PWA upgrade and eight live Apps Script staging cases remain
outstanding; tests already passed are recorded in SECURITY-BROWSER-QA.md. Resume those
after the owner-managed credential risk is cleared, without using customer data.

## Owner follow-up (2026-09-21/22)

Owner reports changing their OWNER password through Settings and successfully
logging in with the new password. This is user-confirmed, not an independent
Production credential check. No password or hash was requested or displayed.

Metadata-only inspection of the private workbook's Users sheet found one account
record, role OWNER, historical status RESET_REQUIRED; no other account records.
The identifier is deliberately not copied into this public report. Current
Production user-list comparison is still pending: the browser is auto-locked.
Do not infer current account status from the historical workbook or mark the
security gate cleared until the sanitized Production list is checked.

### Sanitized Production UI comparison (2026-09-23)

The owner opened Security Center. Its visible user list shows two accounts:
one ACTIVE OWNER (the signed-in account) and one ACTIVE ADMIN. Neither visible
user ID matches the single historical workbook account ID. No credential fields,
hashes, tokens or session contents were inspected, and no account was changed.
Identifiers are intentionally omitted from this public repository document.

This metadata comparison does not establish whether a renamed account reused a
historical password, nor whether the remaining ADMIN is still authorized. Ask the
owner to confirm that ADMIN is recognized and still needed before clearing the
account review. OWNER password rotation remains user-confirmed. Its normal Settings
code path invalidates sessions for that OWNER, not for other accounts. Do not claim
all accounts' sessions were revoked or all security/deployment tests passed.

### Owner authorization and regression checkpoint (2026-09-23)

Owner confirmed both visible Production users are authorized and should remain.
No account modification is required based on that membership review. This is not
proof of password non-reuse or revocation of every historical session.

Owner authorizes deployment only after verification. Reran `npm test` (exit 0),
candidate build, site-build checks, minified behavior (9 PASS), and publication
privacy checks (PASS). The main audit still explicitly reports eight live GAS
cases NOT TESTED; exit 0 must not be treated as completion of those cases.
No configured, verified staging deployment was located in the reviewed repository.
Need the separate test Apps Script deployment/project, linked to its test database,
before running those mutations. Never substitute Production order/stock writes.
Native-browser confirmation/clipboard and installed-PWA checks also remain open.
Current local build is marked dirty because QA documentation/fixture changes are
uncommitted. No Push, Deploy, live data mutation or Facebook/PC2 action performed.

### Isolated staging preparation (2026-09-24)

Located the existing TEST spreadsheet and its bound script through the spreadsheet
Extensions menu. Cloned its source and manifest to private local backup storage;
recorded existing TEST deployment version 37. No original TEST code was overwritten.
Created a separate private Drive backup and another private isolated QA copy.
Both copies were verified to differ from Production and the original TEST file.

Cloned the isolated copy's bound script for rollback, then uploaded the exact local
candidate GAS source plus an editor-only test harness to that isolated script only.
The harness checks both script ID and spreadsheet ID, requires no project triggers,
uses new QA-prefixed non-Facebook tabs with mock products/customers, and generates
short-lived synthetic session tokens without logging them. It never calls the full
database initializer or Facebook routes. No web-app deployment was created.

Execution is blocked by Google authorization for the new isolated project. Opened
Review permissions but did not grant access. Eight cases remain NOT RUN, not PASS.
The planned harness covers live GAS/Sheets integration, not HTTP/browser E2E;
the latter and outstanding browser checks must still be reported separately.
Production deployment remains on hold. Private backup paths and QA IDs are not
included in public artifacts.

Owner subsequently granted QA authorization. Real isolated GAS/Sheets integration
finished with 8 PASS / 0 FAIL (QA35ef1b80, 2026-09-24). See browser QA for precise
coverage and remaining HTTP/browser, clipboard, native-confirm and installed-PWA
limits. No Production deployment has occurred. Local fixture on port 4176 remains
available solely for the requested manual mock Clipboard check.

Actual browser-tab service-worker upgrade/offline test passed; see browser QA.
Native confirmation, clipboard, installed-PWA behavior and the eight live staging
Apps Script cases still require completion. Push/Deploy remain on hold.
