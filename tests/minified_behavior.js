'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {minify_sync}=require('terser');
const {minifyOptions,canonicalBytes}=require('../scripts/site-build-options');
const original=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
// Export test hooks before mangling so the tests don't depend on internal names.
const functions=original.slice(0,original.indexOf('function touchAdminActivity'));
const code=functions+'\nglobalThis.subject={state,pricingSummary,orderText,categoryDiscountHtml,themePalette,shopIdentity,productSubcategorySettings,shopPage,adminPage,adminBootstrapData,apiPost,submitAdminLogin,setRender:fn=>render=fn,setLoadAdmin:fn=>loadAdmin=fn};';
const built=minify_sync(code,minifyOptions()).code;
const storage=()=>{const entries=new Map();return{getItem:k=>entries.get(k)||null,setItem:(k,v)=>entries.set(k,String(v)),removeItem:k=>entries.delete(k)};};
function fixture(source){
  class Clock extends Date{constructor(...args){super(...(args.length?args:['2026-09-19T00:00:00Z']));}static now(){return new Date('2026-09-19T00:00:00Z').getTime();}}
  const c={Date:Clock,console,URL,URLSearchParams,AbortController,setTimeout,clearTimeout,location:{hash:'#admin'},navigator:{},localStorage:storage(),sessionStorage:storage(),performance:{now:()=>0},requestAnimationFrame:fn=>fn(),window:{DMO_CONFIG:{sheetsUrl:'https://example.invalid/exec'},addEventListener(){}},document:{getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],visibilityState:'visible',activeElement:null,body:{dataset:{},classList:{add(){},remove(){}}}},fetch:()=>{throw Error('Network is forbidden in this fixture');}};
  vm.createContext(c);vm.runInContext(source,c);return{c,api:c.subject};
}
const source=fixture(code),minified=fixture(built),normal=value=>JSON.parse(JSON.stringify(value));
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}
const items=[{id:'S',kind:'SEAL',name:'Test seal',category:'AT',section:'NORMAL',quantity:2,price:100,stock:10,status:'ACTIVE',unit:'ชุด'}, {id:'I',kind:'ITEM',name:'Test item',quantity:1,price:200,stock:10,status:'ACTIVE'}, {id:'V',kind:'SERVICE',name:'Test service',quantity:1,price:300,status:'ACTIVE'}];
test('LF and CRLF normalize to identical release inputs; binary icons remain intact',()=>{
  assert.deepEqual(canonicalBytes('app.js',Buffer.from('one\r\ntwo')),canonicalBytes('app.js',Buffer.from('one\ntwo')));
  const binary=Buffer.from([13,10,0,255]);assert.deepEqual(canonicalBytes('icon.png',binary),binary);
});
for(const percent of [0,5,10])test(`minified ${percent}% category pricing, D2 and order copy equal readable source`,()=>{
  for(const {api} of [source,minified])Object.assign(api.state,{cart:normal(items),seals:[items[0]],items:[items[1]],services:[items[2]],promotions:[],settings:{shopName:'Test',ownerName:'',promoThreshold:100,promoReward:150,categoryDiscountSealPercent:percent,categoryDiscountItemPercent:percent,categoryDiscountServicePercent:0}});
  const pricing=minified.api.pricingSummary();assert.deepEqual(normal(pricing),normal(source.api.pricingSummary()));assert.equal(pricing.total,700-4*percent);
  assert.equal(minified.api.orderText({tamer:'TEST'}),source.api.orderText({tamer:'TEST'}));assert.match(minified.api.orderText(),/300 อัน/);
  if(!percent)assert.equal(minified.api.categoryDiscountHtml(pricing),'');
});
test('mixed category pricing and presentation template do not change totals or old snapshot',()=>{
  let old;
  for(const {api} of [source,minified]){api.state.settings.categoryDiscountSealPercent=5;api.state.settings.categoryDiscountItemPercent=10;api.state.settings.orderCopyTemplate='{title}\n{pricing}';old=JSON.stringify(api.pricingSummary());assert.equal(api.pricingSummary().total,670);const before=api.pricingSummary();api.state.settings.orderCopyShowPricing='FALSE';api.orderText();assert.equal(JSON.stringify(api.pricingSummary()),JSON.stringify(before));api.state.settings.categoryDiscountSealPercent=0;assert.equal(JSON.parse(old).total,670);}
  assert.equal(minified.api.orderText(),source.api.orderText());
});
test('theme validation, blank shop identity and dynamic categories survive mangling',()=>{
  const settings={shopName:'',ownerName:'',themePrimaryColor:'invalid',themeBackgroundColor:'#FFFFFF',productSubcategoriesJson:JSON.stringify([{id:'x',kind:'ITEM',value:'CUSTOM',label:'Custom',sortOrder:1,enabled:true}])};
  for(const name of ['themePalette','shopIdentity','productSubcategorySettings'])assert.deepEqual(normal(minified.api[name](settings)),normal(source.api[name](settings)));
  assert.equal(minified.api.shopIdentity(settings).ownerName,'');
});
test('storefront and 18 admin section HTML outputs are unchanged by production mangling',()=>{
  assert.equal(minified.api.shopPage(),source.api.shopPage());
  assert.equal(minified.api.adminPage(),source.api.adminPage());
  const views=['dashboard','catalog','categories','images','inventory','analytics','reports','orders','customers','promotions','wiki','trash','calculator','settings','security','integrity','automation','logs'];
  for(const {api} of [source,minified]){api.state.adminToken='TEST';api.state.loading=false;api.state.adminUser={userId:'test',role:'OWNER'};api.state.adminData=api.adminBootstrapData();api.state.adminLoadedScopes=new Set(views);}
  for(const view of views){source.api.state.adminView=view;minified.api.state.adminView=view;assert.equal(minified.api.adminPage(),source.api.adminPage(),view);}
});
async function main(){
  for(const {api,c} of [source,minified]){
    api.setRender(()=>{});let loads=0;api.setLoadAdmin(async()=>{loads++;});c.document.getElementById=id=>({value:id==='adminId'?'LOCAL-TEST':'fixture-password'});
    let sends=0;c.fetch=async()=>{sends++;return{ok:true,status:200,text:async()=>JSON.stringify({ok:true,token:'FIXTURE-ONLY',user:{role:'OWNER'}})};};
    await Promise.all([api.submitAdminLogin(),api.submitAdminLogin()]);assert.equal(sends,1);assert.equal(loads,1);assert.equal(c.sessionStorage.getItem('dmo_admin_token'),'FIXTURE-ONLY');
  }
  console.log('PASS minified login preserves successful session and duplicate-submit protection');
  console.log(`Minified behavior: ${passed+1} PASS; VM fixtures, not browser layout or live API tests`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
