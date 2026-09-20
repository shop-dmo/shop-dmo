'use strict';
// Explicit opt-in: checks only the two user-approved, already-running fixture servers.
const assert=require('node:assert/strict');
async function main(){
  for(const port of [4176,4177]){
    const base=`http://127.0.0.1:${port}/shop-dmo/`;
    const get=path=>fetch(base+path,{signal:AbortSignal.timeout(5000)});
    const index=await get('');assert.equal(index.status,200);
    assert.equal(index.headers.get('content-security-policy'),"connect-src 'self'; form-action 'self'; frame-src 'none'");
    const config=await(await get('config.js')).text();assert.ok(config.includes(base+'api'));assert.ok(!config.includes('script.google.com'));
    const manifest=await get('manifest.webmanifest');assert.equal(manifest.status,200);assert.equal(manifest.headers.get('content-type'),'application/manifest+json');
    const data=await(await get('api')).json();assert.equal(data.settings.shopName,'SHOP DMO — LOCAL SMOKE');assert.equal(data.settings.allowOrderSave,'FALSE');
    for(const [rows,kind] of [[data.seals,'SEAL'],[data.gameItems,'ITEM'],[data.services,'SERVICE']])assert.ok(rows.length&&rows.every(row=>row.kind===kind));
    for(const path of ['GoogleAppsScript.gs','package.json','tests/browser_smoke_server.js','.git/config','GUN-SHOP-DMO-V20-FINAL-Database.xlsx'])assert.equal((await get(path)).status,404,path);
    const mutation=await fetch(base+'api',{method:'POST',body:JSON.stringify({action:'createOrder',items:[]}),signal:AbortSignal.timeout(5000)});
    assert.deepEqual(await mutation.json(),{ok:false,error:'LOCAL_SMOKE_READ_ONLY'});
    const metrics=await(await get('__smoke_metrics')).json();assert.equal(metrics.fixture,true);assert.ok(!/password|token|fixture-user/i.test(JSON.stringify(metrics)));
    console.log(`PASS ${port}: local config, network guard, typed fixtures, manifest MIME, private-path deny, mutation deny, redacted counts`);
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
