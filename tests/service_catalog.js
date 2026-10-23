'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
function storefront(file){
  const source=fs.readFileSync(path.join(root,file),'utf8'),storage={getItem:()=>null,setItem(){},removeItem(){}};
  const c={console,URL,URLSearchParams,setTimeout,clearTimeout,location:{hash:''},localStorage:storage,sessionStorage:storage,navigator:{},window:{DMO_CONFIG:{},addEventListener(){}},document:{getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[]}};
  vm.createContext(c);
  // Readable source has an explicit startup boundary; the existing minified
  // equivalence suite checks the built storefront separately.
  vm.runInContext(source.slice(0,source.indexOf('function touchAdminActivity'))+'\nglobalThis.subject={state,availableStock,canBuy,stockText,productCard,filteredProducts,shopPage,addToCart,changeCartQuantity,orderText,pricingSummary};renderPreservingScroll=()=>{};toast=()=>{};',c);
  return c.subject;
}
const s=storefront('app.js'),{state}=s;
state.loading=false;state.catalogType='SERVICE';
state.services=[
  {id:'service-zero',name:'บริการสต๊อกเดิมศูนย์',kind:'SERVICE',serviceCategory:'DUNGEON',price:300,unit:'ครั้ง',status:'ACTIVE',availableStock:0,stock:0},
  {id:'service-one',name:'บริการสต๊อกเดิมหนึ่ง',kind:'SERVICE',serviceCategory:'DUNGEON',price:100,unit:'ครั้ง',status:'ACTIVE',availableStock:1,stock:1},
  {id:'service-check',name:'บริการรอติดต่อ',kind:'SERVICE',price:200,unit:'ครั้ง',status:'CHECK_STOCK',availableStock:0},
];
const original=JSON.stringify(state.services);
for(const p of state.services){
  assert.equal(s.availableStock(p),'');assert.equal(s.canBuy(p),true);
  const card=s.productCard(p);assert(!card.includes('เหลือ '));assert(!card.includes('❌ หมด'));assert(card.includes('ไม่จำกัดจำนวน • ทักร้านเพื่อนัดหมาย'));assert(!card.includes(' disabled'));
}
assert.equal(s.canBuy({...state.services[0],status:'OUT_OF_STOCK'}),false,'explicit pause still works');
for(const status of ['HIDDEN','INACTIVE'])assert.equal(s.canBuy({...state.services[0],status}),false);
state.availableOnly=true;
assert.deepEqual(Array.from(s.filteredProducts(),p=>p.id),['service-zero','service-check','service-one'],'stock-only filter from another tab cannot hide services');
const page=s.shopPage();assert(!page.includes('id="availableOnly"'));assert(!page.includes('เฉพาะที่มีสต๊อกยืนยัน'));assert(page.includes('พร้อมขาย 3 จาก 3'));
s.addToCart('service-zero',25);s.addToCart('service-zero',25);assert.equal(state.cart[0].quantity,50);
s.changeCartQuantity('service-zero',1000);assert.equal(state.cart[0].quantity,1000);
assert.equal(s.pricingSummary().subtotal,300000);assert(s.orderText().includes('1,000 ครั้ง'));assert(s.orderText().includes('300,000 บาท'));
assert.equal(JSON.stringify(state.services),original,'service stock data must remain unchanged');
for(const kind of ['SEAL','ITEM','TMONEY']){
  const p={id:'other',kind,status:'ACTIVE',price:10,availableStock:0};
  assert.equal(s.canBuy(p),false);assert.equal(s.availableStock(p),0);assert(s.stockText(p).includes('หมด'));
  assert.equal(s.availableStock({...p,availableStock:2}),2);
}
state.catalogType='ITEM';state.items=[{id:'item',kind:'ITEM',name:'สินค้า',price:10,status:'ACTIVE',availableStock:2}];state.cart=[];
assert(s.shopPage().includes('id="availableOnly"'));
s.addToCart('item',2);s.addToCart('item',1);assert.equal(state.cart[0].quantity,2);
console.log('PASS service cards hide remaining stock, zero/limited service stock does not restrict selection/cart/copy, explicit pause preserved, other product stock unchanged');

// Verify the existing server rule in memory only: services are not reserved or
// deducted and totals still come from the server product, never browser input.
const c={console,Map,Set};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(root,'GoogleAppsScript.gs'),'utf8'),c);
const h=vm.runInContext('HEADERS',c),tables=new Map(),raw={id:'service',name:'บริการจำลอง',kind:'SERVICE',status:'ACTIVE',unit:'ครั้ง',price:300,stock:0,reservedStock:0};
function table(name,headers){
  const rows=[Array.from(headers)],sheet={rows,getLastRow:()=>rows.length,appendRow:r=>rows.push(Array.from(r)),getRange:(row,col,height=1,width=1)=>({setValues:values=>values.forEach((line,i)=>{rows[row+i-1]??=[];line.forEach((value,j)=>rows[row+i-1][col+j-1]=value);}),setValue:value=>{rows[row-1]??=[];rows[row-1][col-1]=value;}})};
  tables.set(name,sheet);return sheet;
}
const serviceSheet=table('Services',h.services);serviceSheet.appendRow(h.services.map(k=>raw[k]??''));const serviceBefore=JSON.stringify(serviceSheet.rows);
c.sheet=(name,headers)=>tables.get(name)||table(name,headers);c.rows=()=>[];c.catalogSnapshot=()=>new Map([['SERVICE|service',{kind:'SERVICE',data:raw,s:serviceSheet,row:2,headers:h.services}]]);
c.withLock=fn=>fn();c.output=x=>x;c.findRequest=()=>null;c.orderProtection=()=>({cache:{put(){}},cooldownKey:'fixture',cooldown:1});c.uniqueOrderId=()=> 'SERVICE-QA';c.Utilities={getUuid:()=> 'SERVICE-QA-ITEM'};c.sha256=()=>'';c.ensureCustomerProfile=()=>{};c.writeStockLog=()=>{throw Error('Service must not write stock log');};c.log=()=>{};c.invalidatePublicCache=()=>{};c.invalidateAdminDashboardCaches=()=>{};
const result=c.createOrder({requestId:'service-qa',customer:{tamer:'SYNTHETIC',server:'TEST',contact:'SYNTHETIC'},items:[{id:'service',kind:'SERVICE',quantity:1000,price:1,total:1}]});
assert.equal(result.subtotal,300000);assert.equal(JSON.stringify(serviceSheet.rows),serviceBefore);
const orderItems=JSON.parse(tables.get('Orders').rows[1][h.orders.indexOf('itemsJson')]);c.applyInventoryTransition(orderItems,'COMPLETED','SERVICE-QA','fixture');assert.equal(JSON.stringify(serviceSheet.rows),serviceBefore);
assert.throws(()=>c.createOrder({requestId:'invalid',customer:{tamer:'SYNTHETIC',server:'TEST',contact:'SYNTHETIC'},items:[{id:'service',kind:'SERVICE',quantity:Infinity}]}));
console.log('PASS existing server accepts services beyond stored stock, prices server-side, reserves/deducts no stock and rejects invalid quantities (mock Sheets only)');
