'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const zlib=require('node:zlib');
const {execFileSync}=require('node:child_process');
const {minify}=require('terser');
const CleanCSS=require('clean-css');
const {minify:htmlMinify}=require('html-minifier-terser');
const {minifyOptions,canonicalBytes}=require('./site-build-options');
const images=require('./public-image-assets');
const root=path.resolve(__dirname,'..');
const ROLLBACK_REF='e4b9b33c0a4848e734cdba5c8b53c17f3839e6c6';
const PUBLIC_FILES=['.nojekyll','index.html','app.js','app.css','config.js','sw.js','manifest.webmanifest','icon-192.png','icon-512.png','release.json',...Object.keys(images.files)];
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
const read=file=>canonicalBytes(file,fs.readFileSync(path.join(root,file)));
async function build({rollback=false}={}){
  const readSite=file=>rollback&&['index.html','app.js','app.css','config.js','manifest.webmanifest','icon-192.png','icon-512.png'].includes(file)?canonicalBytes(file,execFileSync('git',['show',`${ROLLBACK_REF}:${file}`],{cwd:root,maxBuffer:4*1024*1024})):read(file);
  // Fixed output only. Refuse unknown files/symlinks rather than deleting them.
  const outputDirectory=rollback?'dist-rollback':'dist';
  const destination=path.join(root,outputDirectory);
  if(fs.existsSync(destination)){
    if(fs.lstatSync(destination).isSymbolicLink())throw Error('dist must not be a symbolic link');
    for(const file of fs.readdirSync(destination)){
      if(!PUBLIC_FILES.includes(file)||!fs.lstatSync(path.join(destination,file)).isFile()||fs.lstatSync(path.join(destination,file)).isSymbolicLink())throw Error('dist contains unexpected entries; preserve and inspect before building');
    }
  }
  const files={...images.files};
  const options=minifyOptions();
  for(const name of ['app.js','config.js']){
    // No property mangling, unsafe math, eval wrapping, or control-flow obfuscation.
    files[name]=(await minify(readSite(name).toString(),options)).code+'\n';
  }
  const css=new CleanCSS({level:1,rebase:false,format:false}).minify(readSite('app.css').toString());
  if(css.errors.length||css.warnings.length)throw Error('CSS build requires review: '+[...css.errors,...css.warnings].join('; '));
  files['app.css']=css.styles+'\n';
  for(const name of ['manifest.webmanifest','icon-192.png','icon-512.png'])files[name]=readSite(name);
  const inputDigest=hash(Buffer.concat([Buffer.from(rollback?'rollback:'+ROLLBACK_REF:'candidate'),...['index.html','app.js','app.css','config.js','sw.js','manifest.webmanifest','icon-192.png','icon-512.png','scripts/build-site.js','scripts/site-build-options.js','package-lock.json'].map(readSite)])).slice(0,20);
  const version='site-'+hash(Buffer.concat([Buffer.from(inputDigest),Buffer.from(JSON.stringify(images.productImages)),Buffer.from(JSON.stringify(images.sealImageMatches)),...Object.values(images.files)])).slice(0,20);
  let index=readSite('index.html').toString();
  for(const name of ['app.js','config.js','app.css'])index=index.replace(new RegExp(name.replace('.','\\.')+'\\?v=[^"\\s]+','g'),name+'?v='+version);
  files['index.html']=await htmlMinify(index,{collapseWhitespace:true,removeComments:true,removeRedundantAttributes:false,minifyJS:false,minifyCSS:false});
  let sw=read('sw.js').toString().replace(/const CACHE\s*=\s*'[^']+'/,`const CACHE='gun-shop-dmo-${version}'`).replace(/\?v=[^'"\s]+/g,'?v='+version);
  files['sw.js']=(await minify(sw,{...options,mangle:{toplevel:false}})).code+'\n';
  files['.nojekyll']='';
  if(!rollback)files['config.js']+='Object.assign(window.DMO_CONFIG,'+JSON.stringify({productImages:images.productImages,sealImageMatches:images.sealImageMatches})+');\n';
  const commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
  const dirty=!!execFileSync('git',['status','--porcelain','--untracked-files=no'],{cwd:root,encoding:'utf8'}).trim();
  const checksums=Object.fromEntries(Object.entries(files).map(([name,data])=>[name,{bytes:Buffer.byteLength(data),sha256:hash(data)}]));
  files['release.json']=JSON.stringify({version,commit,dirty,sourceCommit:rollback?ROLLBACK_REF:commit,rollback,files:checksums},null,2)+'\n';
  fs.mkdirSync(destination,{recursive:true});
  for(const [name,data] of Object.entries(files))fs.writeFileSync(path.join(destination,name),data);
  const sizes=['index.html','app.js','app.css','config.js'].map(name=>({file:name,source:readSite(name).length,output:Buffer.byteLength(files[name]),sourceGzip:zlib.gzipSync(readSite(name)).length,outputGzip:zlib.gzipSync(files[name]).length}));
  console.log(JSON.stringify({version,commit,dirty,output:outputDirectory,files:PUBLIC_FILES.length,sizes},null,2));
  return{version,files};
}
module.exports={build,PUBLIC_FILES};
if(require.main===module)build({rollback:process.argv.includes('--rollback')}).catch(error=>{console.error(error.message);process.exitCode=1;});
