const CACHE='gun-shop-dmo-v20-2-login-8';
const NAVIGATION_NETWORK_TIMEOUT_MS=4000;
const SHELL=['./','./index.html','./app.css?v=20260916-v20.2-login-8','./app.js?v=20260916-v20.2-login-8','./config.js?v=20260916-v20.2-login-8','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
const SHELL_URLS=new Set(SHELL.map(file=>new URL(file,self.registration.scope).href));
const INDEX_URL=new URL('./index.html',self.registration.scope).href;
const ROOT_URL=new URL('./',self.registration.scope).href;
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('gun-shop-dmo-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==location.origin)return;
  // Never cache API responses, credentials, source files or arbitrary downloads.
  if(request.mode==='navigate'&&(url.pathname===new URL(ROOT_URL).pathname||url.pathname===new URL(INDEX_URL).pathname)){
    const network=fetch(request),cached=caches.open(CACHE).then(cache=>cache.match(INDEX_URL)).catch(()=>undefined);
    let timer;
    const timeout=new Promise(resolve=>{timer=setTimeout(()=>resolve(cached),NAVIGATION_NETWORK_TIMEOUT_MS);});
    event.waitUntil(network.then(response=>response&&response.ok?caches.open(CACHE).then(cache=>cache.put(INDEX_URL,response.clone())):undefined).catch(()=>{}));
    event.respondWith(Promise.race([network,timeout]).then(response=>response||network).catch(()=>cached).then(response=>response||Response.error()).finally(()=>clearTimeout(timer)));
    return;
  }
  if(!SHELL_URLS.has(url.href))return;
  // Versioned shell files are immutable. No duplicate network read on a hit.
  event.respondWith(caches.open(CACHE).then(async cache=>{
    const hit=await cache.match(request);if(hit)return hit;
    const response=await fetch(request);
    if(response&&response.ok&&response.type!=='opaque')await cache.put(request,response.clone());
    return response;
  }));
});
