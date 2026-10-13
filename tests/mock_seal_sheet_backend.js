'use strict';
// In-memory test adapter only: no Google credentials, SDK, database or network writes.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
module.exports=function createMockSealBackend(seals,settings,publicData){
  const c={console,Map,Set};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(__dirname,'../GoogleAppsScript.gs'),'utf8'),c);
  const headers=vm.runInContext('HEADERS',c),tables=new Map();
  function table(name,columns,records){
    const rows=[columns.slice(),...records.map(record=>columns.map(key=>record[key]??''))];
    const sheet={rows,getLastColumn:()=>rows[0].length,getLastRow:()=>rows.length,getDataRange:()=>({getValues:()=>rows.map(row=>row.slice())}),appendRow:row=>rows.push(row.slice()),getRange:(row,col,height=1,width=1)=>({getValues:()=>Array.from({length:height},(_,i)=>Array.from({length:width},(_,j)=>rows[row+i-1]?.[col+j-1]??'')),getDisplayValues:()=>Array.from({length:height},(_,i)=>Array.from({length:width},(_,j)=>String(rows[row+i-1]?.[col+j-1]??''))),setValue:value=>{rows[row-1]??=[];rows[row-1][col-1]=value;},setValues:values=>values.forEach((line,i)=>{rows[row+i-1]??=[];line.forEach((value,j)=>rows[row+i-1][col+j-1]=value);}),setNumberFormat(){}})};
    tables.set(name,sheet);return sheet;
  }
  table('Seals',headers.seals,seals);table('Settings',headers.settings,Object.entries(settings).map(([key,value])=>({key,value})));
  c.sheet=(name,columns)=>tables.get(name)||table(name,columns,[]);
  c.rows=c.existingRows=name=>{const rows=tables.get(name)?.rows||[[]];return rows.slice(1).map(row=>Object.fromEntries(rows[0].map((key,index)=>[key,row[index]])));};
  c.withLock=fn=>fn();c.output=x=>x;c.sortCatalog=()=>{};c.log=()=>{};c.invalidatePublicCache=()=>{};c.invalidateAdminDashboardCaches=()=>{};
  function refresh(){seals.splice(0,seals.length,...c.rows('Seals').map(c.normalizeSeal));publicData.seals=seals.map(c.publicProduct);Object.assign(settings,Object.fromEntries(c.rows('Settings').map(row=>[row.key,c.smart(row.value)])));}
  return{upsert(record){if(record.kind!=='SEAL')throw Error('Fixture supports seals only');const result=c.upsert({...record},'LOCAL-SMOKE');refresh();return result;},saveSettings(submitted){const allowed=['sealBudgetTitle','sealBudgetDescription','sealBudgetButton','sealBudgetTemplate','sealSetsJson','categoryDiscountSealPercent','categoryDiscountItemPercent','categoryDiscountServicePercent'];const filtered=Object.fromEntries(allowed.filter(key=>Object.hasOwn(submitted||{},key)).map(key=>[key,submitted[key]]));const result=c.saveSettings(filtered,'LOCAL-SMOKE');refresh();return result;}};
};
