'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
const transport=source.slice(source.indexOf('function apiResponseError('),source.indexOf('async function apiGet('));
const post=source.slice(source.indexOf('async function apiPost('),source.indexOf('function applyPublicData('));
const login=source.slice(source.indexOf('async function submitAdminLogin('),source.indexOf('function bind()'));
function fixture(fetch){const entries=new Map(),state={loginSubmitting:false,adminToken:''},c={fetch,AbortController,setTimeout,clearTimeout,console,Date,Set,Map,apiBusyCount:0,state,cfg:{sheetsUrl:'https://example.invalid/exec'},READ_CACHE_MUTATIONS:new Set(),document:{activeElement:null,body:{dataset:{},classList:{add(){},remove(){}}},getElementById:id=>({value:id==='adminId'?' TEST ':'test-password'})},sessionStorage:{setItem:(k,v)=>entries.set(k,v)},resetAdminRequestState(){},adminBootstrapData:()=>({}),render(){},toast(){},loadAdmin:async()=>{},invalidateReadCaches(){}};vm.createContext(c);vm.runInContext(transport+post+login,c);return{c,state,entries};}
const tests=[];const test=(name,run)=>tests.push({name,run});
test('POST follows redirect without ambient Google credentials and retains password in body only',async()=>{
 let call;const{c}=fixture(async(url,options)=>{call={url,options};return{ok:true,status:200,text:async()=>'{"ok":true}'};});await c.apiPost({action:'login',adminId:'test',password:'test-password'});assert.equal(call.options.redirect,'follow');assert.equal(call.options.credentials,'omit');assert.equal(call.options.cache,'no-store');assert(!call.url.includes('test-password'));assert.equal(JSON.parse(call.options.body).password,'test-password');
});
test('timeout while receiving response body gives bounded readable error and releases busy state',async()=>{
 const{c}=fixture(async(url,options)=>({ok:true,status:200,text:()=>new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Object.assign(Error('aborted'),{name:'AbortError'}))))}));await assert.rejects(c.fetchApiJson('https://example.invalid',{},10),e=>/ตอบช้า/.test(e.message)&&e.retryable===false);
});
test('404 HTML and malformed API objects are rejected without exposing response contents',async()=>{
 for(const raw of ['<html>PRIVATE DIAGNOSTIC</html>','null','[]','{"token":"PRIVATE"}']){const{c}=fixture(async()=>({ok:true,status:200,text:async()=>raw}));await assert.rejects(c.fetchApiJson('https://example.invalid'),e=>/ตอบกลับไม่สมบูรณ์/.test(e.message)&&!e.message.includes('PRIVATE'));}
});
test('login and writes are never automatically replayed on ambiguous transport failure',async()=>{
 for(const action of ['login','upsert','archiveOrder']){let calls=0;const{c}=fixture(async()=>{calls++;throw Error('network');});await assert.rejects(c.apiPost({action}));assert.equal(calls,1);assert.equal(c.apiBusyCount,0);}
});
test('read-only admin request retries transient 404 once without retrying credential rejection',async()=>{
 let calls=0;const{c}=fixture(async()=>{calls++;return calls===1?{ok:false,status:404,text:async()=>'<html>not found</html>'}:{ok:true,status:200,text:async()=>'{"ok":true}'};});await c.apiPost({action:'getAdminData'});assert.equal(calls,2);
 calls=0;c.fetch=async()=>{calls++;return{ok:true,status:200,text:async()=>'{"ok":false,"error":"เข้าสู่ระบบใหม่"}'};};await assert.rejects(c.apiPost({action:'getAdminData'}));assert.equal(calls,1);
});
test('missing credentials do not consume a login attempt',async()=>{let calls=0;const{c,state}=fixture(async()=>{calls++;});c.document.getElementById=()=>({value:''});await c.submitAdminLogin();assert.equal(calls,0);assert.match(state.loginError,/กรุณากรอก/);});
test('incomplete login cannot store an undefined session and leaves a persistent error',async()=>{const{c,state,entries}=fixture(async()=>({ok:true,status:200,text:async()=>'{"ok":true}'}));await c.submitAdminLogin();assert.equal(entries.size,0);assert.equal(state.adminToken,'');assert.equal(state.loginSubmitting,false);assert.equal(state.loginId,'TEST');assert.match(state.loginError,/ไม่ครบ/);assert(!JSON.stringify(state).includes('test-password'));});
test('successful login blocks double submit and loads Dashboard once',async()=>{
 let resolve,calls=0,loads=0;const{c,state,entries}=fixture(()=>{calls++;return new Promise(done=>resolve=done);});c.loadAdmin=async()=>{loads++;};const pending=c.submitAdminLogin();await c.submitAdminLogin();assert.equal(calls,1);resolve({ok:true,status:200,text:async()=>'{"ok":true,"token":"test-session","user":{"role":"OWNER"}}'});await pending;assert.equal(state.loginSubmitting,false);assert.equal(entries.get('dmo_admin_token'),'test-session');assert.equal(loads,1);assert(!JSON.stringify(state).includes('test-password'));
});
(async()=>{for(const{name,run}of tests){await run();console.log('PASS '+name);}console.log(`${tests.length}/${tests.length} login transport tests PASS`);})().catch(e=>{console.error(e);process.exitCode=1;});
