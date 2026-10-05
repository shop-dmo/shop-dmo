'use strict';
// No browser, network, database or Worker access. Exercise actual UI handlers.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {minify_sync}=require('terser');
const {minifyOptions}=require('../scripts/site-build-options');
const app=fs.readFileSync(require('node:path').join(__dirname,'..','app.js'),'utf8');
const names=['archiveOrderFromAdmin','restoreOrderFromAdmin','deleteProductCategoryAction','adjustStockAction'];
const handlers=names.map(name=>{
  const start=app.indexOf('async function '+name+'(');
  assert(start>=0,name);
  const next=app.indexOf('\nasync function ',start+1);
  assert(next>start,name+' boundary');
  return app.slice(start,next);
}).join('\n')+'\nglobalThis.handlers={'+names.join(',')+'};';
let count=0;
async function run(code,label){
  let calls=[],answer=false,reason='QA only',messages=[];
  const c={console,Date,Math,Number,String,crypto:{randomUUID:()=> 'QA-REQUEST'},
    state:{adminToken:'MOCK',adminActionPending:'',stockActionPending:'',stockPendingRequests:{},adminLoadedScopes:new Set(['orders']),adminScopeErrors:{},
      adminData:{orders:[{orderId:'QA-ORDER'}],seals:[{id:'QA-SEAL',name:'Mock',unit:'unit'}]},modalDirty:{}},
    confirm:text=>{messages.push(text);return answer;},prompt:()=>reason,
    orderDecisionDialog:async(id,text,restore)=>{messages.push(text);return answer?(restore?'':reason):null;},
    apiPost:async body=>{calls.push(body);return{};},render(){},toast(){},loadAdmin:async()=>{},money:String,
    productSubcategorySettings:()=>[{id:'QA-CATEGORY',label:'Mock',kind:'SEAL',value:'QA'}]};
  vm.createContext(c);vm.runInContext(code,c);
  const cases=[['archiveOrderFromAdmin',['QA-ORDER'],'archiveOrder'],['restoreOrderFromAdmin',['QA-ORDER'],'restoreArchivedOrder'],['deleteProductCategoryAction',['QA-CATEGORY'],'deleteProductSubcategory'],['adjustStockAction',['SEAL','QA-SEAL',1],'adjustStock']];
  for(const [name,args,action] of cases){
    calls=[];messages=[];answer=false;
    await c.handlers[name](...args);assert.equal(calls.length,0,name+' cancel must not mutate');assert.equal(messages.length,1);
    answer=true;await c.handlers[name](...args);assert.equal(calls.length,1);assert.equal(calls[0].action,action);
    assert.equal(c.state.adminActionPending,'');assert.equal(c.state.stockActionPending,'');
    console.log('PASS '+label+' '+name+' cancel/accept');count++;
  }
  for(const value of [null,'   ']){
    reason=value;answer=true;calls=[];
    await c.handlers.archiveOrderFromAdmin('QA-ORDER');await c.handlers.adjustStockAction('SEAL','QA-SEAL',1);
    assert.equal(calls.length,0,'cancelled/blank reasons must not mutate');
  }
  console.log('PASS '+label+' missing reasons block archive/stock');count++;
  reason='QA only';answer=true;
  c.loadAdmin=async(force,scope)=>{assert.equal(force,true);assert.equal(scope,'orders');assert(!c.state.adminLoadedScopes.has('orders'));c.state.adminScopeErrors.orders='timeout';};
  for(const name of ['archiveOrderFromAdmin','restoreOrderFromAdmin']){
    calls=[];c.state.adminLoadedScopes.add('orders');c.state.adminScopeErrors={};
    await c.handlers[name]('QA-ORDER');assert.equal(calls.length,1);assert(!c.state.adminLoadedScopes.has('orders'));assert(c.state.adminScopeErrors.orders.includes('สำเร็จแล้ว'));
  }
  console.log('PASS '+label+' committed mutation plus refresh failure hides stale orders; no mutation retry');count++;
  reason='QA only';answer=true;calls=[];
  c.orderDecisionDialog=async()=>{c.state.adminToken='CHANGED';return 'QA only';};
  await c.handlers.archiveOrderFromAdmin('QA-ORDER');assert.equal(calls.length,0,'session change blocks archive');
  c.state.adminToken='MOCK';await c.handlers.restoreOrderFromAdmin('QA-ORDER');assert.equal(calls.length,0,'session change blocks restore');
  console.log('PASS '+label+' session change while dialog open blocks mutation');count++;
}
(async()=>{await run(handlers,'source');await run(minify_sync(handlers,minifyOptions()).code,'minified');console.log(count+' PASS; handler simulation only, not native-dialog or HTTP E2E coverage');})().catch(e=>{console.error(e);process.exitCode=1;});
