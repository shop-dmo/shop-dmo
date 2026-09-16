# GUN SHOP DMO V20.1 — Stability & Security Final

Owner display: disabled

## V20.2.5 — Login transport feedback and validation

- Handle network/abort errors during response body reads as well as connection setup; keep the existing bounded request deadlines.
- Explicitly follow Apps Script redirects without ambient Google cookies or HTTP response caching. Credentials remain in POST bodies, never URLs.
- Reject incomplete/non-API JSON and incomplete login results before creating a browser session.
- Login errors remain visible inline, the ID survives a failed attempt in memory only, and passwords are cleared rather than stored. Enter and click share the duplicate-submit guard.
- No automatic replay of login or mutations; only the existing bounded read-only retry is retained.
- Added eight executable login/transport regressions. Production login and non-Facebook admin reads were verified before release; intermittent Google/network transport failures are not claimed to be eliminated.
- No Apps Script, credential, pricing, Facebook or PC2 changes in this frontend-only release.

## V20.2.4 — Cross-tab refresh and upload safety

- Retired cache generations prevent late Dashboard, Settings, or public catalog reads from repopulating a cache after Archive/Restore and other mutations.
- Successful non-Facebook mutations invalidate shared browser caches. Old in-flight responses are discarded, while unrelated page loads cannot erase an open form.
- Storefront tabs reuse genuinely newer snapshots and retain scroll/cart state; a refresh claim no longer masquerades as new data.
- Image preparation is tied to its exact input/record, all images are decoded, and upload saves snapshot the form before awaiting the upload and block duplicate clicks.
- Newly uploaded Drive files are moved to Trash if public sharing fails; the existing product image is preserved.
- Subcategory deletion also checks recoverable Trash, and category edits reject stale whole-list updates from another tab.
- Added executable frontend/backend race tests, with unchanged pricing, discount, D2, Facebook Worker and send logic.
- PWA assets advance to `stability-7`; no PC2 restart or session changes are performed by this release.

## V20.2.3 — Admin performance and reliability

- Admin sections now load independently, so a slow Dashboard request no longer blocks Orders, Customers, or Settings.
- Late responses are merged field-by-field and cannot overwrite newer Settings or Security data.
- Active admin sessions use a hashed, revalidated row-location cache while continuing to read the live status and expiry on every request.
- Repeated spreadsheet/header service calls were reduced and small operational sheets use one rectangular read where possible.
- Dashboard and safe shared Settings caches have bounded lifetimes and are invalidated by all relevant mutations, including archive/restore operations.
- Storefront background refresh runs only in a visible storefront tab and coordinates across tabs with a Web Lock plus timestamp fallback.
- Read-only requests have a 30-second total budget, clear errors, and retry only when enough time remains.
- PWA shell cache advanced to `admin-performance-6` so old frontend assets are replaced safely.
- Public catalog cache now survives one normal refresh interval, while post-mutation invalidation prevents a concurrent request from retaining stale product/stock data.
- Login seeds a six-hour row pointer for its new session; every request still revalidates the live token, status, and expiry before use.

## V20.1 Release Candidate — Order operations safety

- ปรับศูนย์ออเดอร์ให้อ่านง่ายขึ้น พร้อมค้นหาจาก Order ID ลูกค้า Facebook เซิร์ฟเวอร์ และสถานะ
- แปลตัวเลือกสถานะในหน้าจอเป็นภาษาไทย โดยคงรหัสสถานะภายในเดิม
- เพิ่ม soft archive สำหรับออเดอร์ พร้อมเหตุผล ผู้ดำเนินการ และวันเวลา
- จำกัดการเก็บและกู้คืนออเดอร์ไว้ที่ OWNER/ADMIN ทั้งหน้าเว็บและ API
- ออเดอร์ที่ยัง RESERVED จะถูกยกเลิกและคืน Reserved Stock ก่อนเก็บเพียงครั้งเดียว
- ออเดอร์ CANCELLED/RELEASED และ COMPLETED/DEDUCTED จะไม่เปลี่ยนสต๊อกซ้ำ
- การกู้คืนออเดอร์ไม่จอง คืน หรือตัดสต๊อกอัตโนมัติ
- เพิ่มการป้องกันกดคำสั่งออเดอร์ซ้ำระหว่างรอผลจาก Server
- เพิ่มหัวคอลัมน์ Orders: deletedAt, deletedBy, deleteReason แบบ additive

## Security

- Added explicit public product/settings/promotion DTO allow-lists.
- Public API no longer returns cost price, private notes, reserved-stock internals, low-stock settings, API keys, sessions, security data, CRM, or backup metadata.
- Admin data now loads by authenticated POST instead of a token-bearing GET URL.
- Removed automatic default OWNER credential creation.
- Known V20 default OWNER hash is migrated to `RESET_REQUIRED`.
- Added salted iterative HMAC-SHA256 password storage and legacy-hash migration after a successful non-default login.
- Added failed-login counters, temporary account lock, unknown-user throttling, and public-order throttling.
- Added safe public error responses.

## Orders and stock

- Server is authoritative for price, promotion, discount, final total, stock, and status.
- Added request IDs and `OrderRequests` for retry/idempotency protection.
- Order IDs now use `GUN-YYYYMMDD-HHMMSS-XXXXXXXX` and are checked for uniqueness.
- Order creation validates and groups items before mutation and rolls back local writes on failure.
- Added strict state flow: `NEW → CHECKING → PREPARING → READY → COMPLETED`; cancellation is allowed only before completion.
- Completion requires every OrderItem to be marked `PICKED`.
- Stock reserve/release/deduction is idempotent through status and `inventoryState` controls.
- Customer revenue totals are recalculated from `COMPLETED` orders only.

## Admin and reporting

- Added read-only Data Integrity Checker.
- Fixed current V20.1 statuses in Analytics.
- Fixed product matching through `productId` and `productName`.
- Revenue, cost, profit, CSV, and PDF data now use completed sales.
- Improved Picking Center completeness display.
- Added targeted Dark/Light contrast, dropdown, overflow, and small-screen fixes.

## Database

- Database version: `3.1.0`.
- Added `OrderRequests` sheet.
- Added `requestId`, `pricingJson`, and `inventoryState` to Orders.
- Added salted-password and login-lock fields to Users.
- Existing product records and formulas are preserved.
