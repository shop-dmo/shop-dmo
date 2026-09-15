'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const crypto=require('crypto');
const source=fs.readFileSync(path.join(__dirname,'..','GoogleAppsScript.gs'),'utf8');
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}
function fixture(){
  const entries=new Map(),ttls=new Map();let uuid=0;
  const cache={get:key=>entries.get(key)||null,put(key,value,ttl){entries.set(key,value);ttls.set(key,ttl);},getAll(keys){return Object.fromEntries(keys.filter(key=>entries.has(key)).map(key=>[key,entries.get(key)]));},putAll(values,ttl){Object.entries(values).forEach(([key,value])=>cache.put(key,value,ttl));},remove:key=>entries.delete(key),removeAll:keys=>keys.forEach(key=>entries.delete(key))};
  const c={console,CacheService:{getScriptCache:()=>cache},Utilities:{getUuid:()=>`test-generation-${++uuid}`}};
  vm.createContext(c);vm.runInContext(source+'\nglobalThis.testHeaders=HEADERS;',c);
  c.output=value=>value;c.existingRows=()=>[];c.rowsFields=()=>[];c.ss=()=>({getSheetByName:()=>({getLastRow:()=>1})});c.stockUpdatedAt=()=>'';
  return{c,cache,entries,ttls};
}
test('late Dashboard read cannot repopulate after Archive/Restore invalidation',()=>{
  const {c}=fixture();let total=100,interleave=true;
  c.rowsFields=name=>{
    if(name==='Orders')return[{total,status:'COMPLETED'}];
    if(name==='Customers'&&interleave){interleave=false;total=0;c.invalidateAdminDashboardCaches();}
    return[];
  };
  assert.equal(c.dashboardSummary(false).salesTotal,100,'first reader should keep its snapshot');
  assert.equal(c.dashboardSummary(false).salesTotal,0,'late snapshot became current cache');
  total=900;assert.equal(c.dashboardSummary(false).salesTotal,0,'cache hit should avoid rereading');
  c.invalidateAdminDashboardCaches();assert.equal(c.dashboardSummary(false).salesTotal,900);
});
test('late Settings and Dashboard Settings fills use retired generations',()=>{
  const {c}=fixture();let name='old',interleave=true;
  c.existingRows=()=>{const data=[{key:'shopName',value:name},{key:'apiKey',value:'TEST-PRIVATE'}];if(interleave){interleave=false;name='new';c.invalidateAdminDashboardCaches();}return data;};
  assert.equal(c.cachedAdminDashboardSettings(false).shopName,'old');
  assert.equal(c.cachedAdminDashboardSettings(false).shopName,'new');
  assert(!('apiKey' in c.cachedAdminScopedSettings(false)));
});
test('late public catalog fill cannot undo stock/catalog invalidation',()=>{
  const {c,ttls}=fixture();let name='old',interleave=true;
  c.existingRows=sheet=>{if(sheet!=='Seals')return[];const records=[{id:'TEST',name,status:'ACTIVE',stock:5,reservedStock:1,price:100,costPrice:99,note:'PRIVATE'}];if(interleave){interleave=false;name='new';c.invalidatePublicCache();}return records;};
  assert.equal(c.readPublic().seals[0].name,'old');
  const result=c.readPublic();assert.equal(result.seals[0].name,'new');
  assert.equal(result.seals[0].availableStock,4);assert(!('costPrice' in result.seals[0]));assert(!('reservedStock' in result.seals[0]));
  assert([...ttls.values()].includes(75));
});
test('evicted generation never revives an old public snapshot',()=>{
  const {c,entries}=fixture();c.putCachedPublic({version:'old'});
  const key=[...entries.keys()].find(key=>key.endsWith('-generation'));entries.delete(key);
  assert.equal(c.getCachedPublic(),null);
});
test('cache failure after committed mutation does not turn success into failure',()=>{
  const {c}=fixture();let clears=0,writes=0;
  c.ensureDatabase=()=>{};c.getSession=()=>({userId:'test',role:'OWNER'});c.requireRole=()=>({role:'OWNER'});
  c.invalidatePublicCache=()=>{if(++clears===2)throw Error('CACHE_UNAVAILABLE');};c.invalidateAdminDashboardCaches=()=>{};
  c.upsert=()=>{writes++;return{ok:true};};
  const result=c.doPost({postData:{contents:JSON.stringify({action:'upsert',record:{id:'TEST'}})}});
  assert.equal(result.ok,true);assert.equal(writes,1);assert.equal(clears,2);
});
function sessionSheet(headers,rows){
  let fullReads=0;
  return{rows,headers,get fullReads(){return fullReads;},getDataRange(){return{getValues:()=>{fullReads++;return[headers,...rows].map(row=>row.slice());}};},getRange(row,column,height,width){return{getValues:()=>[rows[row-2].slice(column-1,column-1+width)],setValue:value=>{rows[row-2][column-1]=value;}};},getLastRow:()=>rows.length+1,appendRow:row=>rows.push(row.slice())};
}
test('session pointer still checks live status, expiry and moved rows',()=>{
  const {c,ttls}=fixture(),headers=Array.from(c.testHeaders.sessions),now=new Date(),future=new Date(Date.now()+3600000);
  c.sha256=value=>crypto.createHash('sha256').update(value).digest('hex');
  const sheet=sessionSheet(headers,[['TEST-TOKEN','test','OWNER',now,future,now,'ACTIVE']]);c.ss=()=>({getSheetByName:()=>sheet});
  assert.equal(c.getSession('TEST-TOKEN',false).userId,'test');assert.equal(sheet.fullReads,1);
  assert.equal(c.getSession('TEST-TOKEN',false).role,'OWNER');assert.equal(sheet.fullReads,1);
  sheet.rows.unshift(['OTHER','other','VIEWER',now,future,now,'ACTIVE']);assert.equal(c.getSession('TEST-TOKEN',false).userId,'test');assert.equal(sheet.fullReads,2);
  sheet.rows[1][6]='LOGGED_OUT';assert.equal(c.getSession('TEST-TOKEN',false),null);
  sheet.rows[1][6]='ACTIVE';sheet.rows[1][4]=new Date(0);assert.equal(c.getSession('TEST-TOKEN',false),null);
  assert([...ttls.values()].includes(21600));
});
test('successful login seeds a row pointer without skipping live session verification',()=>{
  const {c}=fixture(),headers=Array.from(c.testHeaders.users),user={userId:'TEST-USER',status:'ACTIVE',role:'OWNER',displayName:'Test',passwordAlgo:'ITERATED-HMAC-SHA256-6000',passwordFastHash:'test-only',passwordFastAlgo:'test-only'};
  const users={getDataRange:()=>({getValues:()=>[headers,headers.map(key=>user[key]||'')]})},sessions=sessionSheet(Array.from(c.testHeaders.sessions),[]);
  c.ss=()=>({getSheetByName:name=>name==='Users'?users:sessions});c.PropertiesService={getScriptProperties:()=>({getProperties:()=>({})})};c.passwordFastMatches=()=>true;c.sha256=value=>crypto.createHash('sha256').update(value).digest('hex');
  const result=c.login({adminId:'TEST-USER',password:'TEST-ONLY'});assert.equal(result.ok,true);
  assert.equal(c.getSession(result.token,false).userId,'TEST-USER');assert.equal(sessions.fullReads,0);
  sessions.rows[0][6]='LOGGED_OUT';assert.equal(c.getSession(result.token,false),null);
});
console.log(`Backend cache/session behavior: ${passed} PASS`);
