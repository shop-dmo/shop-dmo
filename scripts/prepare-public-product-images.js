'use strict';
// Copies only images already exposed by the anonymous storefront catalog.
// Never reads admin endpoints, credentials, cookies, profiles or private sheets.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
async function main(){
  const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'config.js'),'utf8'),context);
  const response=await fetch(context.window.DMO_CONFIG.sheetsUrl,{signal:AbortSignal.timeout(45000)});
  if(!response.ok)throw Error('Public catalog unavailable');
  const data=await response.json();if(!data.ok)throw Error('Public catalog rejected');
  const urls=[...new Set([...(data.seals||[]),...(data.gameItems||[]),...(data.services||[])].map(p=>p.imageUrl).filter(Boolean))];
  const destination=path.join(root,'public-product-images');fs.mkdirSync(destination,{recursive:true});
  const mapping={},failed=[];let cursor=0;
  async function worker(){while(cursor<urls.length){const url=urls[cursor++];try{
    const parsed=new URL(url);if(parsed.protocol!=='https:'||!['drive.google.com','nut1596.github.io'].includes(parsed.hostname))throw Error('Unsupported image host');
    const reply=await fetch(url,{signal:AbortSignal.timeout(20000)});
    const mime=(reply.headers.get('content-type')||'').split(';')[0];
    const extension={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif'}[mime];
    if(!reply.ok||!extension)throw Error('Image unavailable');
    const bytes=Buffer.from(await reply.arrayBuffer());if(bytes.length<32||bytes.length>5*1024*1024)throw Error('Image size rejected');
    const name=crypto.createHash('sha256').update(bytes).digest('hex')+'.'+extension;
    const target=path.join(destination,name);if(!fs.existsSync(target))fs.writeFileSync(target,bytes);
    mapping[url]='public-product-images/'+name;
  }catch(error){failed.push({url,reason:error.message});}}}
  await Promise.all(Array.from({length:4},worker));
  // Generated public mapping contains image URLs only, no catalog or private data.
  fs.writeFileSync(path.join(destination,'manifest.json'),JSON.stringify(mapping,null,2)+'\n');
  console.log(JSON.stringify({uniqueUrls:urls.length,copied:Object.keys(mapping).length,failed:failed.length,bytes:fs.readdirSync(destination).filter(n=>n!=='manifest.json').reduce((n,file)=>n+fs.statSync(path.join(destination,file)).size,0)}));
  if(failed.length)console.log('Unresolved image downloads require review; no product data was changed.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
