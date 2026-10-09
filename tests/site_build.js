'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {PUBLIC_FILES}=require('../scripts/build-site');
const root=path.resolve(__dirname,'..'),dist=path.join(root,process.argv.includes('--rollback')?'dist-rollback':'dist'),read=file=>fs.readFileSync(path.join(dist,file),'utf8');
async function main(){
  assert.deepEqual(fs.readdirSync(dist).sort(),PUBLIC_FILES.slice().sort(),'only explicit public files may ship');
  const release=JSON.parse(read('release.json'));
  for(const [name,info] of Object.entries(release.files)){
    const buffer=fs.readFileSync(path.join(dist,name));assert.equal(buffer.length,info.bytes);assert.equal(crypto.createHash('sha256').update(buffer).digest('hex'),info.sha256);
  }
  for(const name of ['app.js','config.js','sw.js']){const code=read(name);new vm.Script(code);assert(!code.includes('sourceMappingURL'));assert(!/\bdebugger\s*[;\n]/.test(code));}
  const html=read('index.html');assert(!html.includes('<!--'));
  for(const [,file] of html.matchAll(/(?:src|href)="([^"?#]+)(?:[^"#]*)"/g))assert(PUBLIC_FILES.includes(file),'asset escapes public package: '+file);
  for(const file of ['app.js','config.js','app.css'])assert(html.includes(file+'?v='+release.version));
  assert(read('sw.js').includes('gun-shop-dmo-'+release.version));assert.equal(JSON.parse(read('manifest.webmanifest')).start_url,'./');
  const sourceConfig={window:{}},builtConfig={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'config.js'),'utf8'),sourceConfig);vm.runInNewContext(read('config.js'),builtConfig);delete builtConfig.window.DMO_CONFIG.productImages;delete builtConfig.window.DMO_CONFIG.sealImageMatches;assert.equal(JSON.stringify(sourceConfig.window.DMO_CONFIG),JSON.stringify(builtConfig.window.DMO_CONFIG));
  console.log('PASS public allowlist, hashes, syntax, no maps, relative assets, cache version and unchanged config');
  const handlers={},cacheEntries=new Map(),deleted=[],puts=[];let requests=0,fail=false;
  const scope='https://example.test/shop-dmo/',cache={addAll:async entries=>{for(const e of entries)cacheEntries.set(new URL(e,scope).href,new Response('cached'));},match:async request=>cacheEntries.get(typeof request==='string'?request:request.url),put:async(request,response)=>{const key=typeof request==='string'?request:request.url;puts.push(key);cacheEntries.set(key,response);}};
  const context={URL,Set,Promise,Response,setTimeout,clearTimeout,location:{origin:'https://example.test'},self:{registration:{scope},addEventListener:(type,handler)=>handlers[type]=handler,skipWaiting:async()=>{},clients:{claim:async()=>{}}},caches:{open:async()=>cache,keys:async()=>['unrelated-app','gun-shop-dmo-old','gun-shop-dmo-'+release.version],delete:async key=>deleted.push(key)},fetch:async()=>{requests++;if(fail)throw Error('offline');return new Response('network');}};
  vm.runInNewContext(read('sw.js'),context);
  await new Promise((resolve,reject)=>handlers.install({waitUntil:p=>p.then(resolve,reject)}));
  await new Promise((resolve,reject)=>handlers.activate({waitUntil:p=>p.then(resolve,reject)}));
  assert.deepEqual(deleted,['gun-shop-dmo-old']);
  async function request(relative,{mode='cors',method='GET'}={}){let response;const background=[];handlers.fetch({request:{url:new URL(relative,scope).href,mode,method},respondWith:p=>response=p,waitUntil:p=>background.push(p)});const result=await response;await Promise.all(background);return result;}
  const before=requests;assert.equal(await(await request('app.js?v='+release.version)).text(),'cached');assert.equal(requests,before,'cache hit must not issue duplicate requests');
  for(const file of ['GoogleAppsScript.gs','private.json','api?token=PRIVATE','app.js.map','missing.js','https://script.google.com/macros/s/example/exec'])assert.equal(await request(file),undefined,'must not intercept '+file);
  assert.equal(await request('./',{method:'POST'}),undefined);
  assert.equal(await(await request('./?release=test',{mode:'navigate'})).text(),'network');
  fail=true;assert.equal(await(await request('./?release=test',{mode:'navigate'})).text(),'network','offline navigation must use stored shell');
  cacheEntries.delete(new URL('app.js?v='+release.version,scope).href);
  await assert.rejects(request('app.js?v='+release.version),/offline/,'failed JS must not return HTML');
  assert(puts.every(url=>url===new URL('index.html',scope).href));
  console.log('PASS built service worker: precache, scoped cleanup, no API/private caching, no redundant fetch, offline shell, no HTML for failed JS');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
