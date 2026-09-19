'use strict';
// Read-only inventory. Never print matched secret values or source lines.
const {execFileSync}=require('node:child_process');
const root=require('node:path').resolve(__dirname,'..');
const git=(...args)=>execFileSync('git',args,{cwd:root,maxBuffer:64*1024*1024});
const rules=[
  ['private-key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['github-token',/\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/],
  ['google-api-key',/\bAIza[\w-]{30,}\b/],
  ['google-oauth-token',/\bya29\.[\w.-]{25,}/],
  ['aws-access-key',/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ['credential-literal',/\b(?:password|apiKey|access_token|refresh_token|client_secret|workerToken|pairToken)\s*[:=]\s*['"][^'"\r\n]{4,}['"]/i],
  ['legacy-password-seed',/sha256\(['"]\d{4,}['"]\)/]
];
const objects=git('rev-list','--objects','--all').toString().trim().split('\n');
let scanned=0;const findings=[],binary=[];
for(const entry of objects){
  const split=entry.indexOf(' ');if(split<0)continue;
  const oid=entry.slice(0,split),file=entry.slice(split+1);
  if(!/\.(?:js|gs|json|md|txt|ya?ml|env|cmd|ps1|html|xlsx)$/i.test(file))continue;
  if(file.endsWith('.xlsx')){binary.push({object:oid.slice(0,12),file});continue;}
  const source=git('cat-file','blob',oid).toString('utf8');scanned++;
  const matches=[];
  for(const [rule,re] of rules){
    for(const match of source.matchAll(new RegExp(re.source,re.flags+'g'))){
      const before=source.slice(Math.max(0,match.index-12),match.index);
      const classification=rule==='credential-literal'&&before.endsWith('data-toggle-')?'dom-attribute-not-credential':file.startsWith('tests/')?'test-fixture-or-assertion-review':'review-required';
      matches.push({rule,line:source.slice(0,match.index).split('\n').length,classification});
    }
  }
  if(matches.length)findings.push({object:oid.slice(0,12),file,matches});
}
console.log(JSON.stringify({commits:Number(git('rev-list','--all','--count').toString()),scannedTextBlobs:scanned,findings,binaryWorkbooks:binary,note:'Heuristic candidates, including test fixtures; not proof of active credentials or an exhaustive secret scan.'},null,2));
