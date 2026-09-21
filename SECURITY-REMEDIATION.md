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
