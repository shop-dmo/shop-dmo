'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const directory=path.join(__dirname,'..','public-product-images');
const read=name=>fs.existsSync(path.join(directory,name))?JSON.parse(fs.readFileSync(path.join(directory,name),'utf8')):{};
const urls=read('manifest.json'),matches=read('seal-matches.json'),files={};
function asset(value){
  if(!/^public-product-images\/[a-f0-9]{64}\.(jpg|png|webp|gif)$/.test(value))throw Error('Invalid public image path');
  const file=path.basename(value),bytes=fs.readFileSync(path.join(directory,file));
  if(crypto.createHash('sha256').update(bytes).digest('hex')!==file.split('.')[0])throw Error('Public image checksum mismatch');
  files['product-'+file]=bytes;return 'product-'+file;
}
const productImages=Object.fromEntries(Object.entries(urls).map(([url,file])=>[url,asset(file)]));
const sealImageMatches=Object.fromEntries(Object.entries(matches).map(([id,row])=>[id,{name:row.name,path:asset(row.path)}]));
module.exports={files,productImages,sealImageMatches};
