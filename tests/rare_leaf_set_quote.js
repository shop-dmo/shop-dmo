'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {minify_sync}=require('terser'),{minifyOptions}=require('../scripts/site-build-options');
const source=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8'),prefix=source.slice(0,source.indexOf('function touchAdminActivity'))+'\nglobalThis.test={state,bindShopImprovements,addRareLeafSet,compactCartEntries,pricingSummary,changeCartSetQuantity,orderText,setDeps:d=>{apiGet=d.get;toast=d.toast;renderPreservingScroll=d.render;}};';
const members=[{id:'a',name:'A',section:'BASE_HARD',price:.6},{id:'b',name:'B',section:'SUSA',price:.8}];
const quote={id:'seal-set-rare-one-leaf',name:'Rare set',available:true,price:2,rawTotal:1.4,members};
const data={rareLeafSet:quote,seals:members.map(p=>({...p,category:'AT',unit:'ใบ',packSize:1000,status:'ACTIVE',availableStock:4})),settings:{}};
(async()=>{
 for(const script of [prefix,minify_sync(prefix,minifyOptions()).code]){
  const btn={disabled:false,isConnected:true},qty={value:'2',isConnected:true},storage={getItem:()=>null,setItem(){},removeItem(){}};
  const c={console,URL,URLSearchParams,setTimeout,clearTimeout,location:{hash:''},navigator:{},localStorage:storage,sessionStorage:storage,window:{DMO_CONFIG:{},addEventListener(){}},document:{querySelector:()=>null,querySelectorAll:()=>[],getElementById:id=>id==='addRareLeafSet'?btn:id==='rareLeafSetQty'?qty:null}};
  vm.createContext(c);vm.runInContext(script,c);const x=c.test,copy=()=>JSON.parse(JSON.stringify(data));let reply=copy(),reads=0;
  x.state.rareLeafSet=reply.rareLeafSet;x.setDeps({get:async()=>{reads++;return reply;},toast:()=>{},render:()=>{}});x.bindShopImprovements();
  const pending=btn.onclick();assert(btn.disabled);await btn.onclick();await pending;assert.equal(reads,1);
  assert.equal(x.compactCartEntries().length,1);assert.equal(x.compactCartEntries()[0].price,2);
  assert.equal(x.pricingSummary().subtotal,4);assert.equal(x.pricingSummary().sealSetRounding,1.2);
  const copied=x.orderText();assert(copied.includes('📦 Rare set 2 เซ็ต (รายละเอียดซีลด้านล่าง)'));assert(copied.includes('A 2 ใบ'));assert(copied.includes('ส่วนต่างปัดราคาเซ็ต +1.2 บาท'));assert(copied.includes('รวมก่อนลด 4 บาท'));assert(!copied.includes('2 เซ็ต ×'));
  x.state.settings.categoryDiscountSealPercent=5;assert.equal(x.pricingSummary().total,3.8);
  x.state.cart.find(p=>p.id==='a').quantity++;assert.equal(x.pricingSummary().subtotal,4.6);
  x.changeCartSetQuantity('rare-leaf-set-cart',4);assert.equal(x.state.cart.find(p=>p.id==='b').quantity,2);
  x.changeCartSetQuantity('rare-leaf-set-cart',3);assert.equal(x.pricingSummary().subtotal,6.6);
  x.changeCartSetQuantity('rare-leaf-set-cart',0);assert.equal(x.state.cart.length,1);assert.equal(x.pricingSummary().subtotal,.6);
  reply=copy();reply.rareLeafSet.price=3;await btn.onclick();assert.equal(x.state.cartSetGroups.length,0);
  reply.seals[1].availableStock=0;await btn.onclick();assert.equal(x.state.cart.length,1);assert.equal(x.state.cart[0].quantity,1);
  x.state.offline=true;const previous=reads;await btn.onclick();assert.equal(reads,previous);
  x.state.settings.categoryDiscountSealPercent=0;
  x.state.cart.push({id:'demo-item',name:'Demo item',kind:'ITEM',price:408.29,quantity:1,unit:'ชิ้น'});
  assert.equal(x.pricingSummary().total,408.89);
  assert.match(x.orderText(),/ยอดสุทธิ 408 บาท/);
  assert.match(x.orderText(),/รวมก่อนลด 408\.89 บาท/);
 }
 console.log('PASS readable/minified rare cart: fresh quote, atomic stock checks, overlap, resizing, removal, discounts and copied rounded total');
})().catch(error=>{console.error(error);process.exitCode=1;});
