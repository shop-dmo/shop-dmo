function qaHeaderMappingRelease(){
  qaDatabase();ensureDatabase();
  const id='QA-HEADER-'+Utilities.getUuid(),record={kind:'SEAL',id,name:'SYNTHETIC header mapping',category:'AT',section:'NORMAL',price:40,unit:'ชุด',packSize:1000,stock:2000,reservedStock:0,lowStockAlert:0,stockUnit:'LEAF',allowSplitSale:'FALSE',status:'ACTIVE',imageUrl:'https://example.invalid/fixture.png',note:'SYNTHETIC preserve note'};
  upsert(record,'SYNTHETIC-QA');
  const partial={...record,name:'SYNTHETIC edited',allowSplitSale:'TRUE'};delete partial.imageUrl;delete partial.note;
  upsert(partial,'SYNTHETIC-QA');
  const saved=rows(SHEETS.seals).find(p=>p.id===id);
  if(saved.imageUrl!==record.imageUrl||saved.note!==record.note||Number(saved.price)!==40||Number(saved.stock)!==2000||saved.name!==partial.name||String(saved.allowSplitSale).toUpperCase()!=='TRUE')throw Error('Header preservation failed');
  console.log(JSON.stringify({ok:true,test:'real sheet header mapping and partial edit preserve image/note/price/stock',productionTouched:false}));
}
