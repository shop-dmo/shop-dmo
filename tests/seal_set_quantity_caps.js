'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const storage={getItem:()=>null,setItem(){},removeItem(){}};
const c={console,URL,URLSearchParams,setTimeout,clearTimeout,location:{hash:''},localStorage:storage,sessionStorage:storage,navigator:{},window:{DMO_CONFIG:{},addEventListener(){}},document:{getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[]}};
vm.createContext(c);const source=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
vm.runInContext(source.slice(0,source.indexOf('function touchAdminActivity'))+'\nglobalThis.subject={state,sealSetOffers,sealSetCard,sealQuantityPerSet,sealSetMemberPrice,addSealSet,compactCartEntries,changeCartSetQuantity};',c);
c.renderPreservingScroll=()=>{};c.toast=()=>{};const s=c.subject,{state}=s;
function product(id,name,category,packPrice,availableStock=60000){return{id,name,category,kind:'SEAL',section:'NORMAL',packSize:1000,unit:'ใบ',price:packPrice/1000,packPrice,status:'ACTIVE',availableStock};}
state.seals=[product('HT-NORMAL-47','สตาร์มอน','HT',10,1000),product('DE-NORMAL-170','โกสึมอน','DE',20,1000),product('HT-other','อื่น HT','HT',30),product('DE-other','อื่น DE','DE',40),product('AT-other','อื่น AT','AT',50)];
state.settings={};const untouched=JSON.stringify(state.seals),offers=s.sealSetOffers(),full=offers.find(o=>o.id==='seal-set-ALL-3');
assert.equal(full.price,390);assert.equal(full.available,true);assert.equal(offers.find(o=>o.id==='seal-set-ALL-1').price,150);
for(const p of state.seals){assert.equal(s.sealQuantityPerSet(p,1),1000);assert.equal(s.sealQuantityPerSet(p,3),['HT-NORMAL-47','DE-NORMAL-170'].includes(p.id)?1000:3000);}
assert.equal(offers.find(o=>o.id==='seal-set-HT-3').price,100);assert.equal(offers.find(o=>o.id==='seal-set-DE-3').price,140);assert.equal(offers.find(o=>o.id==='seal-set-AT-3').price,150);
const card=s.sealSetCard(full);assert(card.includes('<b>สตาร์มอน</b><span>1,000 ใบ · 10 บาท'));assert(card.includes('<b>โกสึมอน</b><span>1,000 ใบ · 20 บาท'));assert(card.includes('<b>อื่น AT</b><span>3,000 ใบ · 150 บาท'));assert(card.includes('ยกเว้น'));
assert.equal(JSON.stringify(state.seals),untouched,'set computation must not rewrite prices, stock, pack sizes or categories');
// Configured sets and default sets use the same quantity/pricing policy.
state.settings.sealSetsJson=JSON.stringify([{id:full.id,name:'Synthetic full',category:'ALL',multiplier:3,enabled:true,memberIds:state.seals.map(p=>p.id)}]);
assert.equal(s.sealSetOffers()[0].price,390);assert.equal(s.sealSetOffers()[0].available,true);
state.seals[0].availableStock=999;assert.equal(s.sealSetOffers()[0].available,false);state.seals[0].availableStock=1000;
// A full set can be bought with only1,000 of the capped member available.
state.cart=[];state.cartSetGroups=[];s.addSealSet(full.id,1);assert.equal(state.cart.length,5);
assert.equal(state.cart.find(p=>p.id==='HT-NORMAL-47').quantity,1000);assert.equal(state.cart.find(p=>p.id==='DE-NORMAL-170').quantity,1000);assert.equal(state.cart.find(p=>p.id==='AT-other').quantity,3000);
assert.equal(s.compactCartEntries()[0].price,390);
const cartBeforeLimit=JSON.stringify(state.cart);s.addSealSet(full.id,1);assert.equal(JSON.stringify(state.cart),cartBeforeLimit,'accumulated stock rejection must not partially add other members');
state.seals.forEach(p=>p.availableStock=60000);const group=s.compactCartEntries()[0].groupKey;s.changeCartSetQuantity(group,2);
assert.equal(state.cart.find(p=>p.id==='HT-NORMAL-47').quantity,2000);assert.equal(state.cart.find(p=>p.id==='AT-other').quantity,6000);assert.equal(s.compactCartEntries()[0].price,390);
s.changeCartSetQuantity(group,0);assert.equal(state.cart.length,0);
// Pack-sale members need1 pack, not1,000 packs. Rare/unrelated records not capped.
const star=product('HT-NORMAL-47','Renamed by owner','HT',10);
assert.equal(s.sealQuantityPerSet({...star,unit:'ชุด',price:10},3),1);assert.equal(s.sealSetMemberPrice({...star,unit:'ชุด',price:10},3),10);
assert.equal(s.sealQuantityPerSet({...star,section:'SUSA'},3),1000);assert.equal(s.sealQuantityPerSet({...star,id:'another-star'},3),3000);
// Exact SUSA exceptions stay in configured/default sets, pack-priced and pack-quantity.
state.settings={};state.cart=[];state.cartSetGroups=[];
state.seals=[{...star,section:'SUSA',unit:'ชุด',price:10,availableStock:5},{...product('DE-NORMAL-170','โกสึมอน','DE',20),section:'SUSA',unit:'ชุด',price:20,availableStock:5},product('AT-other','อื่น AT','AT',50),{...product('unrelated-susa','Other SUSA','HT',1),section:'SUSA'}];
const susaFull=s.sealSetOffers().find(o=>o.id==='seal-set-ALL-3');assert.equal(susaFull.members.length,3);assert.equal(susaFull.price,180);
state.settings.sealSetsJson=JSON.stringify([{id:susaFull.id,name:'SUSA exceptions',category:'ALL',multiplier:3,enabled:true,memberIds:susaFull.members.map(p=>p.id)}]);
assert.equal(s.sealSetOffers()[0].available,true);assert.equal(s.sealSetOffers()[0].price,180);s.addSealSet(susaFull.id,1);
assert.equal(state.cart.find(p=>p.id===star.id).quantity,1);assert.equal(state.cart.find(p=>p.id===star.id).price,10);assert.equal(state.cart.find(p=>p.id==='AT-other').quantity,3000);assert.equal(s.compactCartEntries()[0].price,180);
state.settings={};state.seals=JSON.parse(untouched);assert.equal(JSON.stringify(state.seals),untouched);
console.log('PASS Starmon HT / Gotsumon DE caps: starter/full/configured/all-line, actual member price/stock, leaf+pack cart quantities, group resize/remove, other seals unchanged');
