'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const zlib=require('node:zlib');
const {execFileSync}=require('node:child_process');
const {minify}=require('terser');
const CleanCSS=require('clean-css');
const {minify:htmlMinify}=require('html-minifier-terser');
const root=path.resolve(__dirname,'..');
const PUBLIC_FILES=['.nojekyll','index.html','app.js','app.css','config.js','sw.js','manifest.webmanifest','icon-192.png','icon-512.png','release.json'];
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
const read=file=>fs.readFileSync(path.join(root,file));
async function build(){
  // Fixed output only. Refuse unknown files/symlinks rather than deleting them.
  const destination=path.join(root,'dist');
  if(fs.existsSync(destination)){
    if(fs.lstatSync(destination).isSymbolicLink())throw Error('dist must not be a symbolic link');
    for(const file of fs.readdirSync(destination)){
      if(!PUBLIC_FILES.includes(file)||!fs.lstatSync(path.join(destination,file)).isFile()||fs.lstatSync(path.join(destination,file)).isSymbolicLink())throw Error('dist contains unexpected entries; preserve and inspect before building');
    }
  }
  const files={};
  const options={ecma:2020,compress:{defaults:false,drop_debugger:true},mangle:{toplevel:true},format:{comments:false},sourceMap:false};
  for(const name of ['app.js','config.js']){
    // No property mangling, unsafe math, eval wrapping, or control-flow obfuscation.
    files[name]=(await minify(read(name).toString(),options)).code+'\n';
  }
  const css=new CleanCSS({level:1,rebase:false,format:false}).minify(read('app.css').toString());
  if(css.errors.length||css.warnings.length)throw Error('CSS build requires review: '+[...css.errors,...css.warnings].join('; '));
  files['app.css']=css.styles+'\n';
  for(const name of ['manifest.webmanifest','icon-192.png','icon-512.png'])files[name]=read(name);
  const inputDigest=hash(Buffer.concat(['index.html','app.js','app.css','config.js','sw.js','manifest.webmanifest','icon-192.png','icon-512.png','scripts/build-site.js','package-lock.json'].map(read))).slice(0,20);
  const version='site-'+inputDigest;
  let index=read('index.html').toString();
  for(const name of ['app.js','config.js','app.css'])index=index.replace(new RegExp(name.replace('.','\\.')+'\\?v=[^"\\s]+','g'),name+'?v='+version);
  files['index.html']=await htmlMinify(index,{collapseWhitespace:true,removeComments:true,removeRedundantAttributes:false,minifyJS:false,minifyCSS:false});
  let sw=read('sw.js').toString().replace(/const CACHE\s*=\s*'[^']+'/,`const CACHE='gun-shop-dmo-${version}'`).replace(/\?v=[^'"\s]+/g,'?v='+version);
  files['sw.js']=(await minify(sw,{...options,mangle:{toplevel:false}})).code+'\n';
  files['.nojekyll']='';
  const commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
  const dirty=!!execFileSync('git',['status','--porcelain','--untracked-files=no'],{cwd:root,encoding:'utf8'}).trim();
  const checksums=Object.fromEntries(Object.entries(files).map(([name,data])=>[name,{bytes:Buffer.byteLength(data),sha256:hash(data)}]));
  files['release.json']=JSON.stringify({version,commit,dirty,files:checksums},null,2)+'\n';
  fs.mkdirSync(destination,{recursive:true});
  for(const [name,data] of Object.entries(files))fs.writeFileSync(path.join(destination,name),data);
  const sizes=['index.html','app.js','app.css','config.js'].map(name=>({file:name,source:read(name).length,output:Buffer.byteLength(files[name]),sourceGzip:zlib.gzipSync(read(name)).length,outputGzip:zlib.gzipSync(files[name]).length}));
  console.log(JSON.stringify({version,commit,dirty,output:'dist',files:PUBLIC_FILES.length,sizes},null,2));
  return{version,files};
}
module.exports={build,PUBLIC_FILES};
if(require.main===module)build().catch(error=>{console.error(error.message);process.exitCode=1;});
