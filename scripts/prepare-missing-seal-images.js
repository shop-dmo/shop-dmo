'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),directory=path.join(root,'public-product-images');
const normalize=name=>String(name||'').normalize('NFC').trim().replace(/\s+/g,' ').toLowerCase();
async function main(){
  const c={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'config.js'),'utf8'),c);
  const own=await(await fetch(c.window.DMO_CONFIG.sheetsUrl,{signal:AbortSignal.timeout(45000)})).json();
  if(!own.ok)throw Error('Catalog unavailable');
  const reference=await(await fetch('https://nut1596.github.io/dmo-catalog/catalog.json',{signal:AbortSignal.timeout(20000)})).json();
  const candidates=reference.products.filter(p=>p.kind==='seal'&&p.image);
  fs.mkdirSync(directory,{recursive:true});const mapping={},unmatched=[],failed=[];
  for(const product of own.seals.filter(p=>!p.imageUrl)){
    const matches=candidates.filter(p=>normalize(p.name)===normalize(product.name));
    const images=[...new Set(matches.map(p=>p.image))];
    if(images.length!==1){unmatched.push({id:product.id,name:product.name,reason:images.length?'AMBIGUOUS':'NO_EXACT_NAME'});continue;}
    try{
      const url=new URL(images[0],'https://nut1596.github.io/dmo-catalog/');
      if(url.origin!=='https://nut1596.github.io'||!url.pathname.startsWith('/dmo-catalog/assets/products/'))throw Error('Invalid image path');
      const response=await fetch(url,{signal:AbortSignal.timeout(15000)});if(!response.ok||!String(response.headers.get('content-type')).startsWith('image/webp'))throw Error('Image unavailable');
      const bytes=Buffer.from(await response.arrayBuffer());if(bytes.length<32||bytes.length>5*1024*1024)throw Error('Invalid image size');
      const file=crypto.createHash('sha256').update(bytes).digest('hex')+'.webp';fs.writeFileSync(path.join(directory,file),bytes);
      mapping[product.id]={name:product.name,path:'public-product-images/'+file,source:url.href};
    }catch(error){failed.push({id:product.id,name:product.name,reason:error.message});}
  }
  fs.writeFileSync(path.join(directory,'seal-matches.json'),JSON.stringify(mapping,null,2)+'\n');
  // Public product names only. No prices, stock or internal data are exported.
  console.log(JSON.stringify({referenceSeals:candidates.length,matched:Object.keys(mapping).length,unmatched,failed}));
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
