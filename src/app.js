const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
let toastTimer;
function toast(message) {
  const el = $('.toast');
  el.textContent = message;
  el.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('visible'), 2200);
}
const themeToggle = $('.theme-toggle');
function updateThemeLabel() {
  const dark = document.documentElement.dataset.theme === 'dark';
  themeToggle.setAttribute('aria-label', dark ? '切换浅色主题' : '切换深色主题');
  themeToggle.setAttribute('title', dark ? '切换浅色主题' : '切换深色主题');
}
updateThemeLabel();
themeToggle.addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem('norio-docs-theme', theme); } catch {}
  updateThemeLabel();
});
$('.mobile-menu').addEventListener('click', event => {
  const button = event.currentTarget;
  const open = button.getAttribute('aria-expanded') !== 'true';
  button.setAttribute('aria-expanded', String(open));
  button.setAttribute('aria-label', open ? '收起导航' : '展开导航');
  $('#mobile-navigation').hidden = !open;
});
$('.sidebar-toggle')?.addEventListener('click', event => {
  const open = !$('.doc-sidebar').classList.contains('is-open');
  $('.doc-sidebar').classList.toggle('is-open', open);
  event.currentTarget.setAttribute('aria-expanded', String(open));
});
$$('.copy-code').forEach(button => button.addEventListener('click', async () => {
  const code = $('code', button.closest('.code-block')).textContent;
  try {
    if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(code);
    else {
      const input = document.createElement('textarea');
      input.value = code;
      input.className = 'clipboard-buffer';
      document.body.append(input);
      input.select();
      const copied = document.execCommand('copy');
      input.remove();
      button.focus();
      if (!copied) throw new Error('Copy failed');
    }
    button.textContent = '已复制';
    toast('代码已复制');
    setTimeout(() => button.textContent = '复制代码', 1800);
  } catch { toast('无法自动复制，请选中代码手动复制'); }
}));

const dialog = $('.search-dialog');
const input = $('#search-input');
const scope = $('#search-scope');
const scopeName = () => scope.options[scope.selectedIndex].text;
const results = $('.search-results');
const status = $('.search-status');
let searchData, loading, active = -1, searchTimer;
async function loadIndex() {
  if (searchData) return searchData;
  if (!loading) loading = fetch('/search-index.json').then(response => {
    if (!response.ok) throw new Error('Search unavailable');
    return response.json();
  }).then(data => searchData = data).catch(error => { loading = null; throw error; });
  return loading;
}
function openSearch() {
  if (!dialog.open) dialog.showModal();
  input.focus();
  if (!input.value.trim()) {
    results.replaceChildren();
    status.textContent = `在${scopeName()}中搜索功能、示例或 API`;
  }
  loadIndex().catch(() => { status.textContent = '搜索索引加载失败，请检查网络后重新输入'; });
}
$$('.search-open').forEach(button => button.addEventListener('click', openSearch));
$('.search-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if(event.target === dialog) { const rect=dialog.getBoundingClientRect(); if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close(); } });
document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();openSearch();
  }
  if (event.key === 'Escape') {
    $('#mobile-navigation').hidden = true;
    $('.mobile-menu').setAttribute('aria-expanded','false');
    $('.mobile-menu').setAttribute('aria-label','展开导航');
    $('.doc-sidebar')?.classList.remove('is-open');
    $('.sidebar-toggle')?.setAttribute('aria-expanded','false');
  }
});
function markedText(element, text, terms) {
  const lower = text.toLowerCase();
  let at = 0;
  while (at < text.length) {
    let first = -1, term = '';
    for (const needle of terms) {const index = lower.indexOf(needle, at);if(index >= 0 && (first < 0 || index < first)){ first = index;term = needle; }}
    if(first < 0){element.append(document.createTextNode(text.slice(at)));break;}
    element.append(document.createTextNode(text.slice(at, first)));
    const mark = document.createElement('mark');mark.textContent=text.slice(first,first+term.length);element.append(mark);at=first+term.length;
  }
}
async function runSearch() {
  const query = input.value.trim();
  const selectedScope = scope.value;
  if(!query){results.replaceChildren();active=-1;status.textContent=`在${scopeName()}中搜索功能、示例或 API`;return;}
  status.textContent='正在搜索…';
  try {
    const data=await loadIndex();
    if(input.value.trim()!==query||scope.value!==selectedScope)return;
    const terms=query.toLowerCase().split(/\s+/).filter(Boolean).slice(0,8);
    const hits=data.filter(record=>selectedScope==='all'||record.groupId===selectedScope).map(record=>{
      const title=record.title.toLowerCase(),page=record.page.toLowerCase(),group=record.group.toLowerCase(),body=record.text.toLowerCase();
      if(!terms.every(t=>(title+' '+page+' '+group+' '+body).includes(t)))return null;
      const score=terms.reduce((sum,t)=>sum+(title===t?100:title.includes(t)?40:0)+(page.includes(t)?15:0)+(body.includes(t)?3:0),0);
      return {record,score};
    }).filter(Boolean).sort((a,b)=>b.score-a.score).slice(0,30);
    results.replaceChildren();active=-1;
    status.textContent=hits.length?`${scopeName()} · 找到 ${hits.length===30?'至少 30':hits.length} 条结果`:`${scopeName()}中没有找到结果，可缩短关键词或切换搜索范围`;
    for(const {record} of hits){
      const link=document.createElement('a');link.href=record.url;link.className='search-result';
      const context=document.createElement('span');context.className='result-context';context.textContent=`${record.group} / ${record.page}`;
      const title=document.createElement('strong');markedText(title,record.title,terms);
      const snippet=document.createElement('p');
      const plain=record.text.replace(/[`#*|<>]/g,'').replace(/\s+/g,' ');
      const position=Math.max(0,plain.toLowerCase().indexOf(terms[0])-36);
      markedText(snippet,(position?'…':'')+plain.slice(position,position+150)+(plain.length>position+150?'…':''),terms);
      link.append(context,title,snippet);results.append(link);
      link.addEventListener('click',()=>dialog.close());
    }
  }catch{status.textContent='搜索暂不可用，请检查网络后重试；文档目录仍可正常使用。';}
}
input.addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(runSearch,100);});
scope.addEventListener('change',()=>{clearTimeout(searchTimer);runSearch();});
dialog.addEventListener('keydown',event=>{
  const links=$$('.search-result',results);
  if(['ArrowDown','ArrowUp'].includes(event.key)&&links.length){event.preventDefault();active=active<0?(event.key==='ArrowDown'?0:links.length-1):(active+(event.key==='ArrowDown'?1:-1)+links.length)%links.length;links.forEach((link,index)=>link.classList.toggle('active',index===active));links[active].focus();links[active].scrollIntoView({block:'nearest'});}
  if(event.key==='Enter'&&document.activeElement===input&&links.length){event.preventDefault();links[Math.max(0,active)].click();}
});

const tocLinks=$$('.doc-toc nav a');
if(tocLinks.length&&'IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries)if(entry.isIntersecting){tocLinks.forEach(link=>{
      const selected=decodeURIComponent(link.hash.slice(1))===entry.target.id;
      link.classList.toggle('active',selected);
      if(selected)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');
    });}
  },{rootMargin:'-85px 0px -65% 0px'});
  $$('.prose h2,.prose h3').forEach(heading=>observer.observe(heading));
}
