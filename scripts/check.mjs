import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist');
async function files(dir){return(await Promise.all((await fs.readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?files(path.join(dir,e.name)):path.join(dir,e.name)))).flat();}
const htmlFiles=(await files(root)).filter(f=>f.endsWith('.html'));
const cache=new Map();
for(const file of htmlFiles)cache.set(file,await fs.readFile(file,'utf8'));
const errors=[];
let checked=0;
async function verify(href,from){
  if(/^(https?:|mailto:|data:)/.test(href))return;
  const origin='https://docs.invalid';
  const base=path.relative(root,from).replaceAll('\\','/').replace(/index.html$/,'');
  const url=new URL(href,`${origin}/${base}`);
  const decoded=decodeURIComponent(url.pathname);
  let file=path.join(root,decoded);
  if(decoded.endsWith('/'))file=path.join(file,'index.html');
  const stat=await fs.stat(file).catch(()=>null);
  if(!stat?.isFile()){errors.push(`${base}: missing ${href}`);return;}
  if(url.hash&&file.endsWith('.html')){
    const html=cache.get(file)||await fs.readFile(file,'utf8');
    const id=decodeURIComponent(url.hash.slice(1));
    if(!html.includes(`id="${id}"`))errors.push(`${base}: missing anchor ${href}`);
  }
  checked++;
}
for(const [file,html] of cache){
  if(!/<html lang="zh-CN">/.test(html))errors.push(`${file}: missing language`);
  if((html.match(/<h1[ >]/g)||[]).length!==1)errors.push(`${file}: expected one h1`);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  if(new Set(ids).size!==ids.length)errors.push(`${file}: duplicate IDs`);
  if(/<script(?![^>]*\bsrc=)[^>]*>\s*[^<]/.test(html))errors.push(`${file}: inline script violates CSP`);
  const group=html.match(/<body data-group="(word|excel|ppt|rich)"/)?.[1];
  if(group){
    const sidebar=html.match(/<aside class="doc-sidebar"[\s\S]*?<nav[^>]*>([\s\S]*?)<\/nav>/)?.[1];
    if(!sidebar)errors.push(`${file}: missing editor navigation`);
    for(const link of (sidebar||'').matchAll(/href="([^"]+)"/g))if(!link[1].startsWith(`/${group}/`))errors.push(`${file}: cross-editor sidebar link ${link[1]}`);
    if(!sidebar?.includes(`href="/${group}/faq/"`))errors.push(`${file}: missing editor FAQ`);
    if(!html.includes(`<option value="${group}" selected>`))errors.push(`${file}: wrong default search scope`);
  }
  for(const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g))await verify(match[1].replaceAll('&amp;','&'),file);
}
const index=JSON.parse(await fs.readFile(path.join(root,'search-index.json'),'utf8'));
for(const record of index){if(!record.title||!record.text||!record.group||!record.groupId||!record.url.startsWith(`/${record.groupId}/`))errors.push(`Invalid search record: ${record.url}`);await verify(record.url,path.join(root,'index.html'));}
for(const group of ['word','excel','ppt','rich']){
  for(const page of ['overview','installation','quickstart','ai','faq'])if(!cache.has(path.join(root,group,page,'index.html')))errors.push(`Missing ${group}/${page}`);
}
for(const keyword of ['Docker','fontUrls','getAiBridge','createRichTextAiBridge','createExcelAiBridge'])if(!index.some(record=>record.text.includes(keyword)))errors.push(`Not searchable: ${keyword}`);
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log(`Passed: ${htmlFiles.length} HTML pages, ${checked} internal links/assets/anchors, ${index.length} search sections. No editor runtime dependencies.`);
