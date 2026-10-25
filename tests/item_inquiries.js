'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {minify_sync}=require('terser'),{minifyOptions}=require('../scripts/site-build-options');
const source=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
const code=source.slice(0,source.indexOf('function touchAdminActivity'))+'\nglobalThis.subject={state,ITEM_INQUIRIES,itemInquiryDrafts,itemInquiryMessage,currentItemInquiry,itemInquiryShortcuts,itemInquiryPage,filteredProducts,productCard,bindItemInquiry};';
async function test(script){
  const storage={getItem:()=>null,setItem(){},removeItem(){}},nodes={};
  const c={console,URL,URLSearchParams,setTimeout,clearTimeout,location:{hash:''},localStorage:storage,sessionStorage:storage,navigator:{clipboard:{writeText:async text=>{c.copied=text;}}},window:{DMO_CONFIG:{messengerUrl:'https://m.me/example',facebookUrl:'https://www.facebook.com/example'},addEventListener(){}},document:{getElementById:id=>nodes[id]||null,querySelector:()=>null,querySelectorAll:()=>[]}};
  vm.createContext(c);vm.runInContext(script,c);const s=c.subject;
  const categories=[{id:'e',kind:'ITEM',value:'INQUIRY_EGG',label:'ไข่',enabled:true},{id:'u',kind:'ITEM',value:'INQUIRY_UNLOCK',label:'ปลดร่าง',enabled:true},{id:'d',kind:'ITEM',value:'MID_DATA',label:'ดาต้ากลาง',enabled:true}];
  Object.assign(s.state,{catalogType:'ITEM',section:'ALL',settings:{productSubcategoriesJson:JSON.stringify(categories)}});
  assert.equal((s.itemInquiryShortcuts().match(/class="item-inquiry-shortcut"/g)||[]).length,2);
  assert.equal(s.itemInquiryMessage('INQUIRY_EGG','   '),'');assert.equal(s.itemInquiryMessage('other','hello'),'');
  assert.equal(s.itemInquiryMessage('__proto__','hello'),'');
  for(const key of ['INQUIRY_EGG','INQUIRY_UNLOCK']){
    s.state.section=key;assert(s.currentItemInquiry());s.itemInquiryDrafts[key]='<img src=x onerror=alert(1)>';
    const html=s.itemInquiryPage(s.currentItemInquiry());assert(html.indexOf('class="item-inquiry-poster')<html.indexOf('class="item-inquiry-composer'));
    assert(html.includes('&lt;img src=x onerror=alert(1)&gt;'));assert(!html.includes('data-add=')&&!html.includes('data-qty='));
    assert(html.includes('maxlength="500"'));
    assert(html.includes('ไม่ได้เช็กสต๊อกอัตโนมัติ')&&html.includes('noopener noreferrer'));
    assert(s.itemInquiryMessage(key,'test').includes('ร้านตรวจสอบว่ามีหรือไม่มี'));
  }
  assert.equal(s.itemInquiryMessage('INQUIRY_EGG','x'.repeat(600)).match(/x+/)[0].length,500);
  s.state.wishlistOnly=true;assert.equal(s.currentItemInquiry(),null);assert.equal(s.itemInquiryShortcuts(),'');s.state.wishlistOnly=false;
  s.state.settings.productSubcategoriesJson=JSON.stringify(categories.map(x=>({...x,enabled:false})));assert.equal(s.currentItemInquiry(),null);
  s.state.settings.productSubcategoriesJson=JSON.stringify(categories);
  s.state.section='MID_DATA';s.state.items=Array.from({length:9},(_,i)=>({id:'data-'+i,name:'Data '+i,kind:'ITEM',itemCategory:'MID_DATA',price:1,stock:999,unit:'อัน',status:'ACTIVE'}));
  assert.equal(s.filteredProducts().length,9);assert.equal(s.currentItemInquiry(),null);
  assert(s.productCard(s.state.items[0]).includes('data-add="data-0"'));assert(s.productCard(s.state.items[0]).includes('999'));
  s.state.section='INQUIRY_EGG';
  Object.assign(nodes,{itemInquiryName:{value:''},copyItemInquiryBtn:{isConnected:true},itemInquiryMessage:{focus(){},select(){this.selected=true;}},itemInquiryStatus:{},itemInquiryPreview:{}});
  s.bindItemInquiry();nodes.itemInquiryName.value='ไข่อากุมอน มีไหม';nodes.itemInquiryName.oninput();assert.equal(nodes.copyItemInquiryBtn.disabled,false);
  await nodes.copyItemInquiryBtn.onclick();assert.equal(c.copied,s.itemInquiryMessage('INQUIRY_EGG','ไข่อากุมอน มีไหม'));assert(nodes.itemInquiryStatus.textContent.includes('ยังไม่ได้ส่งข้อความ'));
  c.navigator.clipboard.writeText=async()=>{throw Error('Denied');};await nodes.copyItemInquiryBtn.onclick();assert.equal(nodes.itemInquiryPreview.open,true);assert.equal(nodes.itemInquiryMessage.selected,true);
  nodes.itemInquiryName.value=' ';nodes.itemInquiryName.oninput();assert.equal(nodes.copyItemInquiryBtn.disabled,true);
}
(async()=>{await test(code);await test(minify_sync(code,minifyOptions()).code);console.log('PASS readable/minified inquiry categories, poster-before-form, escaping/limits, draft/copy/fallback, visibility and live-data cart separation');})().catch(e=>{console.error(e);process.exitCode=1;});
