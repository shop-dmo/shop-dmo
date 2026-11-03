'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {minify_sync}=require('terser'),{minifyOptions}=require('../scripts/site-build-options');
const source=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8'),prefix=source.slice(0,source.indexOf('function touchAdminActivity'))+'\nglobalThis.quoteTest={state,bindShopImprovements,setDeps:d=>{apiGet=(...a)=>d.apiGet(...a);copyText=(...a)=>d.copyText(...a);toast=(...a)=>d.toast(...a);renderPreservingScroll=(...a)=>d.render(...a);}};';
const quote={id:'seal-set-rare-one-leaf',name:'Rare quote',quoteOnly:true,price:2,rawTotal:1.4,members:[{id:'a',name:'A',section:'BASE_HARD',price:.6},{id:'b',name:'B',section:'SUSA',price:.8}],excluded:[]};
function fixture(script){
 const elements=Object.fromEntries(['rareLeafSetQty','copyRareLeafSet','rareLeafSetTotal','rareLeafSetMessage','rareLeafSetNotice'].map(id=>[id,{value:id==='rareLeafSetQty'?'3':'',textContent:'',hidden:true,disabled:false,isConnected:true,focus(){},select(){}}]));
 const storage={getItem:()=>null,setItem(){},removeItem(){}},c={console,URL,URLSearchParams,setTimeout,clearTimeout,location:{hash:''},navigator:{},localStorage:storage,sessionStorage:storage,window:{DMO_CONFIG:{},addEventListener(){}},document:{querySelector:()=>null,querySelectorAll:()=>[],getElementById:id=>elements[id]||null}};
 vm.createContext(c);vm.runInContext(script,c);c.quoteTest.state.rareLeafSet=JSON.parse(JSON.stringify(quote));c.quoteTest.state.offline=false;const copies=[],toasts=[];let calls=0,renders=0;
 const deps={apiGet:async()=>{calls++;return{rareLeafSet:JSON.parse(JSON.stringify(quote))};},copyText:async text=>copies.push(text),toast:text=>toasts.push(text),render:()=>renders++};c.quoteTest.setDeps(deps);c.quoteTest.bindShopImprovements();
 return{c,deps,e:elements,copies,toasts,calls:()=>calls,renders:()=>renders};
}
(async()=>{
 for(const script of [prefix,minify_sync(prefix,minifyOptions()).code]){
  let f=fixture(script);await f.e.copyRareLeafSet.onclick();assert.equal(f.calls(),1);assert.equal(f.copies.length,1);assert(f.copies[0].includes('= 6 บาท'));assert(!f.e.rareLeafSetMessage.hidden);assert(!f.e.rareLeafSetQty.disabled);
  f.e.rareLeafSetQty.value='2';f.e.rareLeafSetQty.oninput();assert(f.e.rareLeafSetMessage.hidden);assert.equal(f.e.rareLeafSetMessage.value,'');assert.equal(f.e.rareLeafSetTotal.textContent,'4 บาท');
  f=fixture(script);f.deps.apiGet=async()=>({rareLeafSet:{...quote,price:3}});await f.e.copyRareLeafSet.onclick();assert.equal(f.copies.length,0);assert.equal(f.renders(),1);assert.equal(f.c.quoteTest.state.rareLeafSet.price,3);
  f=fixture(script);f.deps.apiGet=async()=>{throw Error('offline');};await f.e.copyRareLeafSet.onclick();assert.equal(f.copies.length,0);assert(!f.e.copyRareLeafSet.disabled);assert(!f.e.rareLeafSetQty.disabled);assert.equal(f.toasts[0],'offline');
  f=fixture(script);f.deps.copyText=async()=>{throw Error('clipboard refused');};await f.e.copyRareLeafSet.onclick();assert(!f.e.rareLeafSetMessage.hidden);assert(f.e.rareLeafSetNotice.textContent.includes('ด้วยตัวเอง'));
  f=fixture(script);f.c.quoteTest.state.offline=true;await f.e.copyRareLeafSet.onclick();assert.equal(f.calls(),0);
  f=fixture(script);let resolve,calls=0;f.deps.apiGet=()=>{calls++;return new Promise(r=>resolve=r);};const pending=f.e.copyRareLeafSet.onclick();assert(f.e.copyRareLeafSet.disabled);assert(f.e.rareLeafSetQty.disabled);await f.e.copyRareLeafSet.onclick();assert.equal(calls,1);f.e.copyRareLeafSet.isConnected=false;resolve({rareLeafSet:quote});await pending;assert.equal(f.copies.length,0);
 }
 console.log('PASS readable/minified rare set quote: fresh server price, changed-price review, quantity lock, duplicate guard, no offline/stale copy, network failure and manual clipboard fallback');
})().catch(error=>{console.error(error);process.exitCode=1;});
