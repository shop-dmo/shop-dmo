# Copying resistance and security review — 2026-09-19

สถานะ: ชุดงานในเครื่อง ผ่าน automated regression ที่รันแล้ว; ยังไม่พร้อมอนุมัติ
Deploy จนกว่าจะตรวจ browser fixture และยืนยันขั้นตอน GitHub/Apps Script ครบ
Production ยังคง e4b9b33 / GAS v35 ตาม baseline ของงานนี้ ไม่มี push/deploy/แก้ข้อมูลจริง

## ขอบเขตและสิ่งที่ทำ

- สร้าง public build แบบ allowlist 10 ไฟล์ ย่อ JS/CSS/HTML ตัด comment/source map
  และเก็บ source สำหรับพัฒนาไว้เดิม ไม่แก้รูป/เพิ่มลายน้ำ/บล็อก F12 หรือคลิกขวา
- ไม่เผยแพร่ workbook, GAS source, Worker, tests, backup และเอกสารภายในผ่าน artifact
- เพิ่ม version จากเนื้อหา + release.json/checksums และ normalize LF/CRLF
  เพื่อให้ Windows/Linux สร้างจากข้อมูลข้อความเดียวกัน
- จำกัด Service Worker cache เฉพาะ shell ของเว็บ ไม่แคช API/ไฟล์ภายในที่ไม่อยู่
  ใน allowlist และไม่ส่ง HTML แทนไฟล์ JS ที่โหลดผิดพลาด
- เสริม session expiry/role validation, revoke session เมื่อแก้สิทธิ์/รหัสผ่าน,
  ปฏิเสธ hash ตั้งต้นเก่าที่รู้ว่าไม่ปลอดภัย และตรวจสิทธิ์ก่อน invalidate cache
- เตรียม workflow แบบ manual เท่านั้น (deploy=false เป็นค่าเริ่มต้น) และ rollback
  แบบ allowlisted baseline พร้อมคำแนะนำใน SECURITY-DEPLOY-RUNBOOK.md

## ผลตรวจ Read-only

| จุดตรวจ | ผลและขอบเขตหลักฐาน |
|---|---|
| Repository | Public; Pages endpoint ของ GoogleAppsScript.gs ตอบ 200 ระหว่าง audit แรก |
| Git history | 47 reachable commits / 263 text blobs ณ HEAD จุดพัก; 60 matches เป็น DOM attributes, 17 เป็น test fixtures/assertions; ไม่มี remaining review-required matches ตามรูปแบบที่สแกน |
| Workbook | มี hash ตั้งต้นเก่าใน Users; Settings ไม่มีค่า credential ที่ไม่ว่างตาม key pattern; ไม่พบ embedded parts หรือรูปแบบ provider token ที่สแกน |
| Workbook ข้อมูลร้าน | พบสินค้า/การตั้งค่า template; Orders/Customers/Sessions ไม่มีแถวที่มี identity ตามการตรวจโครงสร้าง ไม่ใช่การยืนยันว่าเซลล์ข้อความทุกช่องไม่มีข้อมูลส่วนตัว |
| Public API | GET หนึ่งครั้ง ok=true, 272 products, 5,225 ms; ไม่พบ private fields ที่ตรวจใน response; ไม่ได้ทดสอบ mutation บน Production |

ผล secret scan เป็น heuristic ไม่สามารถยืนยันว่าไม่มีความลับทุกประเภทใน history
ไม่มีการทดลองรหัสตั้งต้นกับ Production หรือ rotate credentials/history rewrite

## Verification

- `npm test`: PASS / exit 0; existing audit มี 8 live-only cases NOT RUN
- Security behavioral tests: 8 PASS
- Minified behavior differential tests: 8 PASS — 0/5/10%, mixed categories, D2,
  order presentation, themes, blank identity, dynamic categories, storefront HTML,
  18 admin section HTML outputs, login and duplicate-submit guard
- Build/SW checks: PASS ทั้ง candidate และ rollback artifact
- สร้าง candidate สองครั้งต่อกัน: ไฟล์ทุกไฟล์ byte-identical
- `git diff --check`: PASS
- Source app.js/app.css/price/discount/order calculation และ Worker source ไม่ถูกแก้

VM/HTML output comparison ไม่ใช่การทดสอบ browser layout, event interaction,
mobile หรือ browser timing จริง และไม่ได้แทนที่ live GAS tests

## ขนาดไฟล์และ Performance

หลัง normalize line endings: app.js 296,714 -> 239,030 bytes (~19.4%)
gzip 72,761 -> 61,556 bytes (~15.4%); CSS 48,950 -> 47,571 bytes
ไม่ได้เพิ่ม per-request Users scan, obfuscation runtime หรือ dependency ที่โหลดใน browser
ยังไม่มี before/after browser timing ที่ยืนยันได้สำหรับชุดนี้

## งานค้างก่อนขออนุมัติ Deploy

1. Browser fixture test / mobile / SW update/offline / actual page timings
   รอบก่อน automatic approval ปฏิเสธ Start-Process เปิด fixture ports 4176/4177
   (`blocked by policy`, ไม่ให้เหตุผลละเอียด); ยังไม่ได้เปิดหรือหลบข้อจำกัด
   ได้ส่งคำถามขออนุญาตลองใหม่ไว้ แต่ยังไม่ได้รับคำตอบ ณ รายงานนี้
2. Live Apps Script integration ต้องใช้ test database; ยังไม่ทำ 8 legacy live cases
3. CI workflow/Pages cutover ยังไม่ถูกเรียกจริง เพราะยังไม่ Push/Deploy
4. ตรวจแผนองค์กร GitHub และตัดสินใจเรื่อง Private repository ก่อนอ้างว่าซ่อน source
   ทั้งหมดได้ การเผยแพร่เฉพาะ dist ไม่ซ่อน source/history บน public github.com

## ข้อจำกัดที่ตกลงไว้

หน้าตา/รูป/ไฟล์ที่ส่งให้ browser และข้อมูล catalog สาธารณะยังคัดลอกหรือเรียกจาก
ภายนอกได้ การย่อโค้ดเพิ่มความยากในการอ่าน แต่ไม่ใช่ access control
ไม่ได้เพิ่ม browser secret หรือ origin check แล้วอ้างว่าป้องกันการเรียก API โดยตรง
ระบบหลังบ้านใช้ session/role ฝั่ง server; public order flow ยังใช้งานได้ตามเดิม
Facebook/PC2 ไม่ถูกแตะ และไม่มีการส่ง + หรือเปิด Scheduler จริง
