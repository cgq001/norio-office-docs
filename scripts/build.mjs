import fs from 'node:fs/promises';
import path from 'node:path';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import { escape } from '../src/templates.mjs';

const root = path.resolve(import.meta.dirname, '..');
process.chdir(root);
const out = path.join(root,'dist');
const md = new MarkdownIt({html:false,linkify:false,typographer:false});
md.renderer.rules.fence = (tokens,index) => {
  const token = tokens[index], lang = token.info.trim().split(/\s+/)[0] || 'text';
  const aliases={vue:'xml',ts:'typescript',sh:'bash'};
  const language=aliases[lang]||lang;
  const code=hljs.getLanguage(language)?hljs.highlight(token.content,{language,ignoreIllegals:true}).value:escape(token.content);
  return `<div class="code-block"><div class="code-toolbar"><span>${escape(lang)}</span><button class="copy-code" type="button" aria-label="复制代码">复制代码</button></div><pre><code class="language-${escape(lang)}">${code}</code></pre></div>`;
};
md.renderer.rules.table_open=()=>'<div class="table-wrap" tabindex="0" role="region" aria-label="可横向滚动的表格"><table>';
md.renderer.rules.table_close=()=>'</table></div>';
const originalLink=md.renderer.rules.link_open||((tokens,i,options,env,self)=>self.renderToken(tokens,i,options));
md.renderer.rules.link_open=(tokens,i,options,env,self)=>{
  const href=tokens[i].attrGet('href');
  if(/^https?:/.test(href)) tokens[i].attrSet('rel','noreferrer');
  return originalLink(tokens,i,options,env,self);
};
async function allFiles(dir) {
  const entries=await fs.readdir(dir,{withFileTypes:true});
  const found=await Promise.all(entries.map(e=>e.isDirectory()?allFiles(path.join(dir,e.name)):[path.join(dir,e.name)]));
  return found.flat();
}
export async function build() {
  const templateVersion=(await fs.stat('src/templates.mjs')).mtimeMs;
  const {layout,home,documentPage,groups}=await import(`../src/templates.mjs?v=${templateVersion}`);
  const pages=[];
  const search=[];
  for(const file of (await allFiles('content')).filter(f=>f.endsWith('.md'))) {
    const raw=await fs.readFile(file,'utf8');
    const match=raw.match(/^---\n([\s\S]+?)\n---\n([\s\S]*)$/);
    if(!match) throw new Error(`Missing metadata: ${file}`);
    const meta=JSON.parse(match[1]),body=match[2];
    const relative=file.replaceAll('\\','/').replace(/^content\//,'').replace(/\.md$/,'');
    const group=relative.split('/')[0],url=`/${relative}/`;
    if(!groups[group]) throw new Error(`Unknown group: ${group}`);
    const tokens=md.parse(body,{}),toc=[],used=new Map();
    let current={title:meta.title,url,text:meta.description},sections=[current];
    for(let i=0;i<tokens.length;i++) {
      const token=tokens[i];
      if(token.type==='heading_open') {
        const title=tokens[i+1].content;
        const base=title.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu,'').trim().replace(/\s+/g,'-')||'section';
        const count=used.get(base)||0;used.set(base,count+1);
        const id=base+(count?`-${count}`:'');
        token.attrSet('id',id);
        const level=Number(token.tag[1]);
        if(level<=3)toc.push({id,title,level});
        if(level===2){current={title,url:`${url}#${id}`,text:''};sections.push(current);}
      }
      if(token.type==='inline'||token.type==='fence')current.text+=' '+token.content;
    }
    const html=md.renderer.render(tokens,md.options,{});
    pages.push({...meta,group,url,html,toc,source:file,minutes:Math.max(2,Math.ceil(body.length/1400))});
    for(const section of sections) search.push({...section,groupId:group,group:groups[group].name,page:meta.title});
  }
  pages.sort((a,b)=>a.group.localeCompare(b.group)||a.order-b.order||a.title.localeCompare(b.title));
  let siteUrl=process.env.SITE_URL?.replace(/\/$/,'')||'';
  if(siteUrl){const parsed=new URL(siteUrl);if(!['https:','http:'].includes(parsed.protocol)||parsed.pathname!=='/')throw new Error('SITE_URL must be an HTTP(S) origin without a subpath');}
  await fs.mkdir(out,{recursive:true});
  await fs.cp('public',out,{recursive:true});
  for(const file of ['styles.css','app.js','theme.js'])await fs.copyFile(`src/${file}`,path.join(out,file));
  const write=(url,html)=>{const destination=path.join(out,url,'index.html');return fs.mkdir(path.dirname(destination),{recursive:true}).then(()=>fs.writeFile(destination,html));};
  await write('/',layout({title:'编辑器文档',description:'Norio Office 四类编辑器中文文档。了解 Word、Excel、PPT 与富文本的功能、Vue 接入、AI 原子级修改和 Docker 协作部署。',body:home(),siteUrl}));
  for(const page of pages)await write(page.url,layout({...page,active:page.group,body:documentPage(page,pages),siteUrl}));
  await fs.writeFile(path.join(out,'404.html'),layout({title:'页面未找到',description:'这个地址没有对应的文档。',body:'<main id="main" class="not-found wrap"><span class="eyebrow">404 / PAGE NOT FOUND</span><h1>这页文档暂时不在这里。</h1><p>地址可能有误，或内容已经移动。你可以返回首页，或通过顶部搜索查找。</p><a class="button primary" href="/">返回文档首页 →</a></main>',siteUrl}));
  await fs.writeFile(path.join(out,'search-index.json'),JSON.stringify(search));
  await fs.writeFile(path.join(out,'robots.txt'),`User-agent: *\nAllow: /\n${siteUrl?`Sitemap: ${siteUrl}/sitemap.xml\n`:''}`);
  if(siteUrl)await fs.writeFile(path.join(out,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/',...pages.map(p=>p.url)].map(url=>`<url><loc>${escape(siteUrl+url)}</loc></url>`).join('')}</urlset>`);
  else await fs.rm(path.join(out,'sitemap.xml'),{force:true});
  // Remove pages left behind after a Markdown source is renamed or deleted.
  const expected=new Set(['index.html','404.html',...pages.map(p=>`${p.url.slice(1)}index.html`)]);
  for(const file of (await allFiles(out)).filter(f=>f.endsWith('.html'))){if(!expected.has(path.relative(out,file).replaceAll('\\','/')))await fs.rm(file);}
  console.log(`Built ${pages.length+1} pages + 404. Search: ${search.length} sections. Output: dist/`);
  return pages;
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(import.meta.filename))await build();
