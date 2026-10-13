// Append only to the isolated synthetic Candidate, never Production.
function qaSealLeafReleaseTests(){
  qaDatabase();ensureDatabase();
  const passed=[],assert=(ok,name)=>{if(!ok)throw Error('FAIL '+name);passed.push(name);};
  const id='QA-LEAF-'+Utilities.getUuid(),actor='SYNTHETIC-QA';
  upsert({kind:'SEAL',id,name:'SYNTHETIC leaf release',category:'AT',section:'NORMAL',price:40,unit:'ชุด',packSize:1000,stock:2,reservedStock:0,lowStockAlert:1,status:'ACTIVE',allowSplitSale:'FALSE'},actor);
  const migration=migrateSealStocksToLeaves('CONFIRM_BACKUP_AND_CONVERT_SEALS_TO_LEAVES');
  let raw=rows(SHEETS.seals).find(p=>p.id===id);
  assert(Number(raw.stock)===2000&&raw.stockUnit==='LEAF'&&Number(raw.price)===40,'real sheet migration preserves price and converts stock');
  migrateSealStocksToLeaves('CONFIRM_BACKUP_AND_CONVERT_SEALS_TO_LEAVES');
  raw=rows(SHEETS.seals).find(p=>p.id===id);assert(Number(raw.stock)===2000,'migration rerun does not multiply stock');
  upsert({...raw,kind:'SEAL',allowSplitSale:'TRUE'},actor);
  raw=rows(SHEETS.seals).find(p=>p.id===id);let pub=publicProduct(normalizeSeal(raw));
  assert(pub.unit==='ใบ'&&pub.price===0.04&&pub.availableLeaves===2000,'split checkbox persisted and public price correct');
  assert(!Object.hasOwn(pub,'costPrice')&&!Object.hasOwn(pub,'reservedStock')&&!Object.hasOwn(pub,'note'),'public product excludes private fields');
  saveSettings({sealBudgetTitle:'SYNTHETIC budget title',sealBudgetTemplate:'SYNTHETIC budget {budget}',categoryDiscountSealPercent:5,allowOrderSave:'TRUE'},actor);
  assert(publicSettings().sealBudgetTemplate==='SYNTHETIC budget {budget}','budget settings persist on real sheet');
  const offer={id:'seal-set-AT-1',name:'SYNTHETIC set',category:'AT',multiplier:1,enabled:true,memberIds:[id],imageUrl:''};
  saveSettings({sealSetsJson:JSON.stringify([offer])},actor);assert(JSON.parse(publicSettings().sealSetsJson)[0].memberIds[0]===id,'set membership persisted');
  const requestId='QA-LEAF-'+Utilities.getUuid(),customer={tamer:requestId,server:'SYNTHETIC',contact:requestId+'@example.invalid'},request={requestId,customer,items:[{kind:'SEAL',id,quantity:500,price:99999}],startedAt:Date.now()-10000};
  const result=JSON.parse(createOrder(request).getContent());
  assert(result.subtotal===20&&result.total===19&&Number(rows(SHEETS.seals).find(p=>p.id===id).reservedStock)===500,'server price ignores forged browser value and reserves leaves');
  const duplicate=JSON.parse(createOrder(request).getContent());
  updateOrder({orderId:result.orderId,status:'CANCELLED'},actor);
  raw=rows(SHEETS.seals).find(p=>p.id===id);
  assert(duplicate.duplicate===true&&duplicate.orderId===result.orderId&&Number(raw.stock)===2000&&Number(raw.reservedStock)===0,'duplicate request and cancellation release exactly once');
  console.log(JSON.stringify({ok:true,passed,backupCreated:!!migration.backupUrl,productionTouched:false}));
}
