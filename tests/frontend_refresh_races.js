'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
const functionsSource=source.slice(0,source.indexOf('function touchAdminActivity'));
const storage=()=>{const data=new Map();return{getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,String(value)),removeItem:key=>data.delete(key)};};
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};};
function fixture(shared=storage(),session=storage()){
  const controls=new Map(),drafts=[],messages=[],requests=[];
  const form={querySelectorAll:()=>[...controls.values()].filter(control=>control.dataset),querySelector:selector=>controls.get(selector.slice(1))||null};
  let now=100000;
  class Clock extends Date{static now(){return now;}}
  const context={console,Date:Clock,URL,URLSearchParams,Map,Set,WeakMap,AbortController,setTimeout,clearTimeout,crypto:{randomUUID:()=> 'test-request'},location:{hash:'#admin'},navigator:{},localStorage:shared,sessionStorage:session,performance:{now:()=>now},requestAnimationFrame:fn=>fn(),window:{DMO_CONFIG:{sheetsUrl:'https://example.invalid'},scrollX:0,scrollY:25,scrollTo:()=>{}},document:{getElementById:id=>id==='app'?form:controls.get(id)||null,querySelectorAll:()=>drafts,querySelector:()=>null,activeElement:null,visibilityState:'visible',body:{dataset:{},classList:{add(){},remove(){}}}},renderCount:0};
  vm.createContext(context);
  context.window.addEventListener=()=>{};
  vm.runInContext(functionsSource+`;render=()=>{renderCount++};toast=message=>messages.push(message);globalThis.subject={state,loadAdmin,loadData,restoreAdminShellCache,saveAdminShellCache,restorePublicCache,autoRefreshPublicUnlocked,invalidateReadCaches,adminHasOpenDraft,selectAdminImage,saveRecordAction,saveSettingsAction,prepareAdminImage,closeStateModal,apiPost,setApiPost:fn=>apiPost=fn,setApiGet:fn=>apiGet=fn,setPrepare:fn=>prepareAdminImage=fn,setUpload:fn=>uploadPreparedImage=fn,setLoadAdmin:fn=>loadAdmin=fn,setFileData:fn=>fileDataUrl=fn,setImageDecode:fn=>imageFromUrl=fn};`,Object.assign(context,{messages}));
  const api=context.subject;
  api.setFetch=fn=>{context.mockFetch=fn;vm.runInContext('fetchApiJson=mockFetch',context);};
  api.state.adminToken='test-session';api.state.loading=false;
  return{api,context,controls,drafts,messages,requests,shared,session,advance:milliseconds=>now+=milliseconds,form};
}
const tests=[];
const test=(name,run)=>tests.push({name,run});
test('late unrelated admin response preserves current view and settings drafts',async()=>{
  const f=fixture(),dashboard=deferred(),orders=deferred();
  f.api.setApiPost(payload=>payload.scope==='dashboard'?dashboard.promise:orders.promise);
  const first=f.api.loadAdmin(false,'dashboard');f.api.state.adminView='orders';const second=f.api.loadAdmin(false,'orders');
  orders.resolve({orders:[{orderId:'new'}]});await second;const rendered=f.context.renderCount;
  dashboard.resolve({dashboardSummary:{orders:1}});await first;
  assert.equal(f.context.renderCount,rendered);assert.equal(f.api.state.adminData.orders[0].orderId,'new');
  f.api.state.adminView='settings';f.drafts.push({value:'unsaved',defaultValue:'saved',tagName:'INPUT'});
  f.api.setApiPost(async()=>({settings:{shopName:'server'}}));await f.api.loadAdmin(true,'settings');
  assert.equal(f.context.renderCount,rendered);assert.equal(f.drafts[0].value,'unsaved');
});
test('mutation blocks stale in-flight Dashboard and starts a fresh request immediately',async()=>{
  const f=fixture(),oldRead=deferred(),freshRead=deferred();let calls=0;
  f.api.setApiPost(()=>++calls===1?oldRead.promise:freshRead.promise);
  const first=f.api.loadAdmin(true,'dashboard');f.api.invalidateReadCaches();const second=f.api.loadAdmin(true,'dashboard');assert.equal(calls,2);
  freshRead.resolve({dashboardSummary:{orders:2}});await second;oldRead.resolve({dashboardSummary:{orders:9}});await first;
  assert.equal(f.api.state.adminData.dashboardSummary.orders,2);
  assert.equal(JSON.parse(f.session.getItem('dmo_admin_shell_v1')).dashboardSummary.orders,2);
});
test('loading another section cannot extend Dashboard shell cache age',async()=>{
  const f=fixture();f.api.setApiPost(async payload=>payload.scope==='dashboard'?{dashboardSummary:{orders:2}}:{orders:[]});
  await f.api.loadAdmin(false,'dashboard');const before=f.session.getItem('dmo_admin_shell_v1');f.advance(40000);await f.api.loadAdmin(false,'orders');assert.equal(f.session.getItem('dmo_admin_shell_v1'),before);
  f.api.invalidateReadCaches();await f.api.loadAdmin(true,'orders');assert.equal(f.session.getItem('dmo_admin_shell_v1'),null);
});
test('another tab mutation invalidates saved shell on reload without sharing private data',async()=>{
  const shared=storage(),f=fixture(shared);f.session.setItem('dmo_admin_token','test-session');f.api.state.adminData={dashboardSummary:{orders:3},settings:{shopName:'shop'}};f.api.saveAdminShellCache(f.api.state.adminData);
  fixture(shared).api.invalidateReadCaches();const reload=fixture(shared,f.session);assert.equal(reload.api.restoreAdminShellCache(),null);
  assert.match(shared.getItem('dmo_data_invalidation_v1'),/^\d+-/);assert.equal(shared.getItem('dmo_admin_token'),null);
});
test('refresh gate cannot repeatedly render the same cache or lose cart state',async()=>{
  const f=fixture();f.api.state.page='shop';f.api.state.publicLoadedAt=90000;f.api.state.cart=[{id:'keep',quantity:2}];
  f.shared.setItem('dmo_public_cache',JSON.stringify({savedAt:90000,data:{seals:[],settings:{}}}));f.shared.setItem('dmo_public_refresh_gate_v1','100000');
  await f.api.autoRefreshPublicUnlocked();await f.api.autoRefreshPublicUnlocked();assert.equal(f.context.renderCount,0);
  f.shared.setItem('dmo_public_cache',JSON.stringify({savedAt:99000,data:{seals:[{id:'fresh',name:'fresh'}],settings:{}}}));
  await f.api.autoRefreshPublicUnlocked();await f.api.autoRefreshPublicUnlocked();assert.equal(f.context.renderCount,1);assert.equal(f.api.state.cart[0].id,'keep');assert.equal(f.api.state.seals[0].id,'fresh');
});
test('an older public response cannot overwrite a newer cross-tab response already applied',async()=>{
  const f=fixture(),waiting=deferred();f.api.state.page='shop';f.api.setApiGet(()=>waiting.promise);const request=f.api.loadData(false);f.advance(10);
  f.shared.setItem('dmo_public_cache',JSON.stringify({savedAt:100010,startedAt:100005,data:{seals:[{id:'new',name:'new'}],settings:{}}}));assert.equal(f.api.restorePublicCache(false,true),true);
  waiting.resolve({seals:[{id:'old',name:'old'}],settings:{}});await request;assert.equal(f.api.state.seals[0].id,'new');assert.equal(JSON.parse(f.shared.getItem('dmo_public_cache')).data.seals[0].id,'new');
});
test('public response completing after admin navigation cannot rerender admin drafts',async()=>{
  const f=fixture(),waiting=deferred();f.api.state.page='shop';f.api.setApiGet(()=>waiting.promise);const request=f.api.loadData(false);f.api.state.page='admin';waiting.resolve({seals:[],settings:{}});await request;assert.equal(f.context.renderCount,0);
});
test('stale image preparation cannot attach to another product or undo Remove',async()=>{
  const f=fixture(),waiting=deferred(),input={id:'fImageFile',files:[{name:'a.png'}],disabled:false};f.controls.set(input.id,input);f.api.state.editRecord={id:'A'};f.api.setPrepare(()=>waiting.promise);
  const request=f.api.selectAdminImage('record',input);f.api.state.editRecord={id:'B'};waiting.resolve({data:'A',fileName:'a.png'});await request;assert.equal(f.api.state.recordImageUpload,null);
  const next=deferred();f.api.setPrepare(()=>next.promise);const removed=f.api.selectAdminImage('record',input);f.api.state.imagePreparing.record=null;next.resolve({data:'removed'});await removed;assert.equal(f.api.state.recordImageUpload,null);
});
test('poster preparation from a detached Settings form is ignored',async()=>{
  const f=fixture(),waiting=deferred(),input={id:'servicePosterFile',files:[{name:'a.png'}]};f.controls.set(input.id,input);f.api.setPrepare(()=>waiting.promise);const request=f.api.selectAdminImage('servicePoster',input);f.controls.set(input.id,{id:input.id});waiting.resolve({data:'stale'});await request;assert.equal(f.api.state.servicePosterUpload,null);
});
test('record save snapshots the complete form before upload and rejects duplicate submission',async()=>{
  const f=fixture(),upload=deferred();f.api.state.editRecord={id:'A',kind:'ITEM'};f.api.state.recordImageUpload={data:'image'};
  const values={fImageUrl:'',fName:'Original A',fAliases:'',fPrice:'42',fUnit:'piece',fStatus:'ACTIVE',fStock:'3',fReservedStock:'0',fLowStockAlert:'0',fCostPrice:'',fSort:'1',fBadge:'',fNote:'',fTags:'',fSearchKeywords:'',fDescription:'A description',fItemCategory:'items'};
  for(const [id,value]of Object.entries(values))f.controls.set(id,{id,value,dataset:{},disabled:false});f.controls.set('modalBackdrop',f.form);f.controls.set('fImageFile',{id:'fImageFile',files:[]});
  f.api.setUpload(()=>upload.promise);f.api.setApiPost(async payload=>{f.requests.push(payload);return{ok:true};});f.api.setLoadAdmin(async()=>{});
  const request=f.api.saveRecordAction();assert.equal(f.api.state.recordSaving,true);await f.api.saveRecordAction();f.controls.get('fName').value='Changed B';upload.resolve('https://example.invalid/a.png');await request;
  assert.equal(f.requests.length,1);assert.equal(f.requests[0].record.id,'A');assert.equal(f.requests[0].record.name,'Original A');assert.equal(f.requests[0].record.imageUrl,'https://example.invalid/a.png');assert.equal(f.api.state.recordSaving,false);
});
test('small images must decode successfully before becoming uploadable',async()=>{
  const f=fixture();let decodes=0;f.api.setFileData(async()=> 'data:image/png;base64,AAAA');f.api.setImageDecode(async()=>{decodes++;throw Error('invalid image');});
  await assert.rejects(f.api.prepareAdminImage({name:'truncated.png',type:'image/png',size:10}),/invalid image/);assert.equal(decodes,1);
  f.api.setImageDecode(async()=>({naturalWidth:1,naturalHeight:1}));const prepared=await f.api.prepareAdminImage({name:'valid.png',type:'image/png',size:100});assert.equal(prepared.compressed,false);assert.equal(prepared.data,'AAAA');
});
test('default select options are clean but changed Settings are protected',()=>{
  const f=fixture();f.api.state.adminView='settings';f.drafts.push({tagName:'SELECT',selectedIndex:0,options:[{defaultSelected:false},{defaultSelected:false}]});assert.equal(f.api.adminHasOpenDraft(),false);f.drafts[0].selectedIndex=1;assert.equal(f.api.adminHasOpenDraft(),true);
});
test('only successful non-Facebook mutations invalidate read caches',async()=>{
  const f=fixture();f.api.setFetch(async()=>({ok:false,error:'rejected'}));await assert.rejects(f.api.apiPost({action:'archiveOrder'}),/rejected/);assert.equal(f.shared.getItem('dmo_data_invalidation_v1'),null);
  f.api.setFetch(async()=>({ok:true}));await f.api.apiPost({action:'getAdminData'});await f.api.apiPost({action:'getFacebookBumpAdminData'});assert.equal(f.shared.getItem('dmo_data_invalidation_v1'),null);
  await f.api.apiPost({action:'archiveOrder'});assert.ok(f.shared.getItem('dmo_data_invalidation_v1'));
});
test('Settings save snapshots fields before poster upload and prevents a second save',async()=>{
  const f=fixture(),upload=deferred();f.api.state.adminView='settings';f.api.state.servicePosterUpload={data:'poster'};
  const settingsFunction=source.slice(source.indexOf('async function saveSettingsAction()'),source.indexOf('async function saveProductCategoryAction()'));
  for(const [,id]of settingsFunction.matchAll(/getElementById\('(set[^']+)'\)/g))f.controls.set(id,{id,value:'',defaultValue:'',checked:false,dataset:{},disabled:false});
  f.controls.get('setShopName').value='Original shop';f.controls.set('servicePosterFile',{id:'servicePosterFile',files:[]});
  f.api.setUpload(()=>upload.promise);f.api.setApiPost(async payload=>{f.requests.push(payload);return{ok:true};});f.api.setLoadAdmin(async()=>{});
  const request=f.api.saveSettingsAction();await f.api.saveSettingsAction();f.controls.get('setShopName').value='Edited during upload';upload.resolve('https://example.invalid/poster.png');await request;
  assert.equal(f.requests.length,1);assert.equal(f.requests[0].settings.shopName,'Original shop');assert.equal(f.requests[0].settings.servicePosterUrl,'https://example.invalid/poster.png');assert.equal(f.api.state.settingsSaving,false);
});
(async()=>{let pass=0;for(const {name,run}of tests){try{await run();pass++;console.log('PASS '+name);}catch(error){console.error('FAIL '+name+'\n'+error.stack);process.exitCode=1;}}console.log(`${pass}/${tests.length} frontend race tests passed`);})();
