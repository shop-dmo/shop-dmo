'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'GoogleAppsScript.gs'),'utf8');
let passed=0;
function test(name,run){run();passed++;console.log('PASS '+name);}
function fixture(){
  const c={console,Date,Map,Set,CacheService:{getScriptCache:()=>({get:()=>null,put(){},remove(){}})}};
  vm.createContext(c);vm.runInContext(source+'\nglobalThis.headers=HEADERS;globalThis.legacyHash=KNOWN_INSECURE_OWNER_HASH;',c);
  const writes=[];c.output=x=>x;c.ensureDatabase=()=>writes.push('schema');c.sha256=value=>crypto.createHash('sha256').update(String(value)).digest('hex');
  c.invalidatePublicCache=()=>writes.push('public-cache');c.invalidateAdminDashboardCaches=()=>writes.push('dashboard-cache');c.securityLog=()=>{};c.withLock=fn=>fn();
  return{c,writes};
}
const post=(c,body)=>c.doPost({postData:{contents:JSON.stringify(body)}});
test('all private action routes deny anonymous requests before database readiness or cache mutation',()=>{
  const {c,writes}=fixture();c.getSession=()=>null;
  const actions=[...source.matchAll(/case'([^']+)'/g)].map(x=>x[1]);
  for(const action of actions){assert.equal(post(c,{action,token:'FAKE'}).ok,false,action);}
  assert.equal(writes.length,0);assert(actions.length>40);
});
test('read-only VIEWER cannot write inventory, orders, settings, users, backups or invalidate caches',()=>{
  const {c,writes}=fixture();c.getSession=()=>({userId:'viewer',role:'VIEWER'});
  for(const action of ['upsert','setStock','saveSettings','updateOrder','archiveOrder','restoreArchivedOrder','saveSecurityUser','restoreBackup','runIntegrityCheck']){
    assert.equal(post(c,{action,token:'VIEWER'}).ok,false,action);
  }
  assert(!writes.some(x=>x.endsWith('cache')));
});
test('STAFF can reach order handling but cannot alter settings or archive',()=>{
  const {c,writes}=fixture();c.getSession=()=>({userId:'staff',role:'STAFF'});let calls=0;c.updateOrder=()=>{calls++;return{ok:true};};
  assert.equal(post(c,{action:'updateOrder',token:'STAFF'}).ok,true);assert.equal(calls,1);
  assert.equal(post(c,{action:'saveSettings',token:'STAFF'}).ok,false);
  assert.equal(post(c,{action:'archiveOrder',token:'STAFF'}).ok,false);
});
test('expired, invalid-date, inactive and unknown-role sessions fail closed',()=>{
  for(const [expiry,status,role] of [['bad-date','ACTIVE','OWNER'],['','ACTIVE','OWNER'],[new Date(0),'ACTIVE','OWNER'],[new Date(Date.now()+60000),'LOGGED_OUT','OWNER'],[new Date(Date.now()+60000),'ACTIVE','ROOT']]){
    const {c}=fixture(),h=Array.from(c.headers.sessions),row=['TOKEN','test',role,new Date(),expiry,new Date(),status];
    c.ss=()=>({getSheetByName:()=>({getDataRange:()=>({getValues:()=>[h,row]}),getRange:()=>({setValue(){}})})});
    assert.equal(c.getSession('TOKEN',false),null);
  }
});
test('known exposed legacy password record is rejected before password verification',()=>{
  const {c}=fixture(),h=Array.from(c.headers.users),user={userId:'test',status:'ACTIVE',passwordHash:c.legacyHash};
  c.ss=()=>({getSheetByName:()=>({getDataRange:()=>({getValues:()=>[h,h.map(k=>user[k]||'')]})})});
  c.PropertiesService={getScriptProperties:()=>({getProperties:()=>({})})};c.passwordMatches=()=>{throw Error('must not verify exposed password');};
  assert.throws(()=>c.login({adminId:'test',password:'anything'}),/ตั้งรหัสผ่านใหม่/);
});
function userFixture(){
  const {c,writes}=fixture(),h=Array.from(c.headers.users),row=h.map(k=>({userId:'target',role:'ADMIN',status:'ACTIVE',displayName:'Old'})[k]||'');
  c.requireRole=()=>({userId:'owner',role:'OWNER'});c.sheet=()=>({getDataRange:()=>({getValues:()=>[h,row]}),getRange:(r,col)=>({setValue:value=>{writes.push('write');row[col-1]=value;}})});
  c.invalidateUserSessions=id=>{assert.equal(id,'target');writes.push('revoke');};c.securePasswordRecord=()=>({hash:'TEST',salt:'TEST',algo:'TEST',fastHash:'TEST',fastAlgo:'TEST'});
  return{c,writes,row,h};
}
test('permission, status and password changes revoke sessions before changing user fields',()=>{
  for(const changed of [{role:'VIEWER'},{status:'INACTIVE'},{password:'test-password-only'}]){
    const {c,writes}=userFixture();assert.equal(c.saveSecurityUser({token:'OWNER',user:{userId:'target',role:'ADMIN',status:'ACTIVE',...changed}},{userId:'owner'}).ok,true);assert.equal(writes[0],'revoke');
  }
  const {c,writes}=userFixture();c.saveSecurityUser({token:'OWNER',user:{userId:'target',role:'ADMIN',status:'ACTIVE',displayName:'New'}},{userId:'owner'});assert(!writes.includes('revoke'));
});
test('failed session revocation prevents user mutation',()=>{
  const {c,writes}=userFixture();c.invalidateUserSessions=()=>{throw Error('storage unavailable');};
  assert.throws(()=>c.saveSecurityUser({token:'OWNER',user:{userId:'target',role:'VIEWER'}},{userId:'owner'}),/storage unavailable/);assert.equal(writes.length,0);
});
test('public catalog allowlist strips planted private fields on every product and setting',()=>{
  const {c}=fixture();c.getCachedPublic=()=>null;c.putCachedPublic=()=>{};c.readCacheKey=()=>'';c.stockUpdatedAt=()=>'';
  c.existingRows=name=>name==='Settings'?['apiKey','passwordHash','session','backupRetention','facebookBumpWorkerToken','shopName'].map(key=>({key,value:'SENTINEL'})):['Seals','Items','Services'].includes(name)?[{id:name,name:'Test',status:'ACTIVE',price:20,stock:5,reservedStock:1,costPrice:10,note:'PRIVATE',passwordHash:'SECRET',session:'SECRET'}]:[];
  const result=c.readPublic();assert.equal(result.settings.shopName,'SENTINEL');assert.equal(Object.keys(result.settings).length,1);
  for(const item of [...result.seals,...result.gameItems,...result.services]){assert.equal(item.availableStock,4);for(const key of ['costPrice','reservedStock','note','passwordHash','session'])assert(!(key in item));}
});
console.log(`Site security: ${passed} PASS`);
