'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const workbook='GUN-SHOP-DMO-V20-FINAL-Database.xlsx';
assert.equal(fs.existsSync(path.join(root,workbook)),false,'Legacy database snapshot must not be in the public working tree');
assert.ok(fs.readFileSync(path.join(root,'.gitignore'),'utf8').split(/\r?\n/).includes('/'+workbook),'Ignore the retired snapshot to prevent accidental restaging');
const runtime=['index.html','app.js','app.css','config.js','sw.js','manifest.webmanifest','GoogleAppsScript.gs'];
for(const file of runtime)assert.ok(!fs.readFileSync(path.join(root,file),'utf8').includes(workbook),`${file} must not depend on the retired snapshot`);
const gas=fs.readFileSync(path.join(root,'GoogleAppsScript.gs'),'utf8');
const fingerprint=gas.match(/KNOWN_INSECURE_OWNER_HASH\s*=\s*['"]([^'"]+)['"]/);
assert.ok(fingerprint,'Keep the server-side denylist for known unsafe legacy credentials');
const directories=process.argv.includes('--rollback')?['dist-rollback']:process.argv.includes('--candidate')?['dist']:['dist','dist-rollback'];
for(const directory of directories){
  assert.ok(fs.existsSync(path.join(root,directory)),'Build both candidate and rollback before this check');
  for(const file of fs.readdirSync(path.join(root,directory))){
    assert.ok(!/\.(xlsx|gs|zip|env|map)$/i.test(file),'Private/archive file must not be published');
    if(!file.endsWith('.png'))assert.ok(!fs.readFileSync(path.join(root,directory,file),'utf8').includes(fingerprint[1]),'Legacy credential fingerprint must not reach public assets');
  }
}
console.log('PASS retired workbook absent/ignored, no runtime dependency, candidate and rollback exclude private files and legacy credential fingerprint');
console.log('NOTE public Git history remains unchanged; this test does not certify historic credentials are revoked');
