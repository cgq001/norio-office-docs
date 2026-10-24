export const groups = {
  word: { name: 'Word 文档', short: '文档', color: 'blue', logo: '/w.png', package: 'office-word', description: '合同、报告与正式文书。处理文字排版、分页、表格和 DOCX 文件。', features: ['页眉页脚与分节', '批注与修订', 'DOCX / PDF 导出'] },
  excel: { name: 'Excel 表格', short: '表格', color: 'green', logo: '/x.png', package: 'office-excel', description: '台账、预算与数据表。编辑单元格、使用公式，完成筛选和分析。', features: ['公式与数据验证', '图表与透视结果', 'XLSX 导入导出'] },
  ppt: { name: 'PPT 演示文稿', short: '演示文稿', color: 'orange', logo: '/p.png', package: 'office-ppt', description: '汇报、课程与演示。编排幻灯片、编辑对象，放映并交付 PPTX。', features: ['文字、图形与媒体', '动画与演讲者视图', 'PPTX / PDF 导出'] },
  rich: { name: '富文本编辑器', short: '富文本', color: 'purple', logo: '/t.png', package: 'rich-text', description: '知识库、笔记与业务说明。用内容块组织图文、表格和附件。', features: ['内容块与文件附件', '目录、提及与评论', 'JSON / Nordox 存档'] },
  guide: { name: '公共说明', short: '公共说明', color: 'neutral', logo: '/logo.png' },
};
const editorIds = ['word', 'excel', 'ppt', 'rich'];
export const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function icon(name, size = 20) {
  const paths = {
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>',
    external: '<path d="M14 4h6v6M20 4 10 14M10 4H4v16h16v-6"/>',
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.arrow}</svg>`;
}
function editorMark(id, small = false) {
  return `<img class="editor-mark${small ? ' small' : ''}" src="${groups[id].logo}" width="44" height="44" alt="" aria-hidden="true">`;
}
function header(active) {
  return `<a href="#main" class="skip-link">跳到主要内容</a>
  <header class="site-header"><div class="header-inner">
    <a class="brand" href="/" aria-label="Norio Office 首页"><img src="/logo.png" width="36" height="36" alt=""><span>Norio <b>Office</b></span><span class="brand-divider"></span><span class="docs-label">开发文档</span></a>
    <nav class="desktop-nav" aria-label="主导航"><a href="/" ${active === 'home' ? 'aria-current="page"' : ''}>首页</a>${editorIds.map(id => `<a href="/${id}/overview/" ${active === id ? 'aria-current="page"' : ''}>${groups[id].short}</a>`).join('')}</nav>
    <div class="header-actions"><button class="search-open" type="button" aria-label="搜索文档">${icon('search', 16)}<span>搜索文档</span><kbd>Ctrl K</kbd></button><button class="theme-toggle icon-button" type="button" aria-label="切换深浅色主题">${icon('sun')}</button><button class="mobile-menu icon-button" type="button" aria-label="展开导航" aria-expanded="false" aria-controls="mobile-navigation">${icon('menu')}</button></div>
  </div></header>
  <nav id="mobile-navigation" class="mobile-navigation" aria-label="移动端导航" hidden><a href="/">首页</a>${editorIds.map(id => `<a href="/${id}/overview/" ${active === id ? 'aria-current="page"' : ''}>${groups[id].name}</a>`).join('')}<a href="/#common">公共能力</a></nav>`;
}
function search(active) {
  const selected = groups[active] ? active : 'all';
  return `<dialog class="search-dialog" aria-labelledby="search-title"><div class="search-top">${icon('search')}<label class="sr-only" id="search-title" for="search-input">搜索文档</label><input id="search-input" type="search" placeholder="搜索功能、示例或 API" autocomplete="off"><button class="search-close" type="button" aria-label="关闭搜索">Esc</button></div><div class="search-filter"><label for="search-scope">搜索范围</label><select id="search-scope"><option value="all" ${selected === 'all' ? 'selected' : ''}>全站文档</option>${Object.entries(groups).map(([id, group]) => `<option value="${id}" ${selected === id ? 'selected' : ''}>${group.name}</option>`).join('')}</select></div><div class="search-status" aria-live="polite">输入关键词开始搜索</div><div class="search-results"></div><div class="search-footer"><span>↑ ↓ 选择 · Enter 打开 · Esc 关闭</span><span>本地搜索</span></div></dialog>`;
}
function footer(active) {
  const faq = editorIds.includes(active) ? `/${active}/faq/` : '/#questions';
  return `<footer class="site-footer"><div><a class="footer-brand" href="/"><img src="/logo.png" width="28" height="28" alt="">Norio Office <span>编辑器文档</span></a><nav aria-label="页脚导航"><a href="/#common">公共能力</a><a href="${faq}">常见问题</a><a href="https://work.norio.top/" target="_blank" rel="noopener noreferrer">Norio Work ${icon('external', 12)}</a></nav></div><div class="footer-bottom"><span>Word · Excel · PPT · Rich Text</span><a href="/guide/deployment/">文档站部署说明</a></div></footer>`;
}
export function layout({ title, description, active = 'home', body, url = '/', siteUrl = '' }) {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light dark"><title>${escape(title)} · Norio Office</title><meta name="description" content="${escape(description)}"><meta property="og:type" content="website"><meta property="og:title" content="${escape(title)} · Norio Office"><meta property="og:description" content="${escape(description)}">${siteUrl ? `<link rel="canonical" href="${escape(siteUrl + url)}"><meta property="og:url" content="${escape(siteUrl + url)}">` : ''}<link rel="icon" href="${groups[active]?.logo || '/logo.png'}" type="image/png"><script src="/theme.js"></script><link rel="stylesheet" href="/styles.css"><script src="/app.js" defer></script></head><body data-group="${active}">${header(active)}${body}${footer(active)}${search(active)}<div class="toast" role="status" aria-live="polite"></div></body></html>`;
}
export function home() {
  return `<main id="main">
    <section class="home-intro"><div class="wrap"><span class="intro-label">Norio Office / 开发文档</span><h1>四款编辑器，<span>从这里开始接入。</span></h1><p class="intro-description">Word、Excel、PPT 和富文本的功能说明、使用示例与 API 参考。<br>选择你正在使用的编辑器。</p>
      <div class="product-grid" id="editors">${editorIds.map(id => {
        const g = groups[id];
        return `<article class="product-card ${g.color}"><div class="card-title">${editorMark(id)}<h2><a href="/${id}/overview/">${g.name}</a></h2></div><p>${g.description}</p><ul>${g.features.map(feature => `<li>${feature}</li>`).join('')}</ul><div class="card-actions"><a class="editor-start" href="/${id}/quickstart/">开始接入 ${icon('arrow', 16)}</a><a href="/${id}/overview/">功能介绍</a></div><div class="card-reference"><a href="/${id}/api/">API 参考</a><span>·</span><a href="/${id}/faq/">常见问题</a></div></article>`;
      }).join('')}</div><div class="intro-foot"><span>Vue 3.5+ <i>·</i> TypeScript <i>·</i> 按需接入</span><a href="/guide/comparison/">不确定怎么选？看功能对照 ${icon('arrow', 14)}</a></div>
    </div></section>
    <section class="common-section wrap" id="common"><div class="section-heading"><h2>接入前，先了解这几件事。</h2><p>组件负责编辑。模型、文件存储和协作服务，需要与你的应用连接。</p></div>
      <div class="common-row" id="ai"><div class="common-name"><span class="section-label">AI 接入</span><h3>可以只改选中的内容。</h3></div><div class="common-body"><p>润色一句话、调整单元格格式，或修改一个幻灯片标题。编辑器通过 AI Bridge 定位目标、检查权限，再提交局部修改。聊天界面和模型调用由你的应用提供。</p><p class="sub-note">PPT AI 尚未完整验收；各编辑器的操作范围与协作支持情况，以对应文档为准。</p><div class="editor-links">${editorIds.map(id => `<a href="/${id}/ai/">${groups[id].short} AI 接入 ${icon('arrow', 14)}</a>`).join('')}</div><a class="detail-link" href="/guide/ai/">了解原子级修改与宿主职责 ${icon('chevron', 13)}</a></div></div>
      <div class="common-row" id="collaboration"><div class="common-name"><span class="section-label">多人协作</span><h3>协作需要 Docker 版本。</h3></div><div class="common-body"><p>多人同时编辑，需要部署 Docker 版本并连接对应协作服务。安装 npm 组件或部署这个静态文档站，都不会自动开启协作。</p><p>接入时需要配置用户身份、文档权限、实时连接和持久化。四个编辑器的协议不同，请使用与组件版本匹配的服务。</p><a class="detail-link" href="/guide/collaboration/">查看协作部署与接线说明 ${icon('arrow', 15)}</a></div></div>
      <div class="common-row" id="storage"><div class="common-name"><span class="section-label">保存与文件</span><h3>编辑完成，还要接上保存。</h3></div><div class="common-body"><p><code>v-model</code> 更新代表页面收到了新内容，不代表已经写入服务器。应用需要保存完整数据或导出文件，并在保存成功后反馈状态。</p><div class="editor-links">${editorIds.map(id => `<a href="/${id}/${id === 'ppt' ? 'persistence' : 'files'}/">${groups[id].short}保存与导出 ${icon('arrow', 14)}</a>`).join('')}</div></div></div>
    </section>
    <section class="home-questions wrap" id="questions"><div class="section-heading"><h2>常见问题</h2><p>具体编辑器的问题，在各自的文档中查看。</p></div><div class="faq-layout"><div class="faq-answers"><details><summary>Word 和富文本该怎么选？</summary><p>需要纸张、分页、页眉页脚和 DOCX 交付时选 Word；知识库、笔记和网页内容块选富文本。它们的数据结构和接口不同。<a href="/guide/comparison/">查看详细对照</a>。</p></details><details><summary>必须把四个组件都装上吗？</summary><p>不需要。每个编辑器独立安装，选择业务需要的组件即可。本站只提供文档，不加载编辑器运行时。</p></details><details><summary>AI 按钮能直接调用模型吗？</summary><p>按钮用于标记编辑目标。你还需要在应用中注册工具、连接模型，并管理权限和保存。安装 Skill 也不会自动连接到打开的文档。</p></details></div><nav class="faq-editors" aria-label="各编辑器常见问题">${editorIds.map(id => `<a href="/${id}/faq/">${editorMark(id, true)}<span>${groups[id].name}常见问题</span>${icon('arrow', 16)}</a>`).join('')}</nav></div></section>
    <section class="work-link wrap"><div><h2>想了解基于这些编辑器的完整产品？</h2><p>Norio Work 将 AI 对话和四类编辑器放在同一个工作空间。</p></div><a class="button primary" href="https://work.norio.top/" target="_blank" rel="noopener noreferrer">访问 Norio Work ${icon('external', 15)}</a></section>
  </main>`;
}
const navigationSections = [
  { title: '开始使用', slugs: ['overview', 'quickstart', 'recipes'] },
  { title: '功能与接入', slugs: ['data', 'files', 'persistence', 'presenting', 'blocks', 'comments', 'extensions', 'collaboration'] },
  { title: 'AI 接入', slugs: ['ai', 'ai-reference'] },
  { title: '接口与帮助', slugs: ['api', 'methods', 'faq'] },
];
function sidebar(pages, current) {
  const ownPages = pages.filter(page => page.group === current.group);
  const link = page => `<a href="${page.url}" ${page.url === current.url ? 'aria-current="page"' : ''}>${escape(page.title)}</a>`;
  const content = current.group === 'guide'
    ? `<div class="sidebar-section"><h2>公共说明</h2>${ownPages.map(link).join('')}</div>`
    : navigationSections.map(section => {
      const items = section.slugs.flatMap(slug => ownPages.filter(page => page.url === `/${current.group}/${slug}/`));
      return items.length ? `<div class="sidebar-section"><h2>${section.title}</h2>${items.map(link).join('')}</div>` : '';
    }).join('');
  return `<aside class="doc-sidebar" id="editor-navigation"><a class="sidebar-home" href="/#editors">← 全部编辑器</a><div class="sidebar-product">${editorMark(current.group, true)}<strong>${groups[current.group].name}</strong></div><nav aria-label="${groups[current.group].name}文档目录">${content}</nav></aside>`;
}
export function documentPage(page, pages) {
  const ownPages = pages.filter(p => p.group === page.group);
  const index = ownPages.findIndex(p => p.url === page.url);
  const adjacent = [ownPages[index - 1], ownPages[index + 1]];
  const guide = page.group === 'guide';
  const quick = guide ? '/#common' : `/${page.group}/quickstart/`;
  const faq = guide ? '/#questions' : `/${page.group}/faq/`;
  return `<main id="main" class="doc-layout">${sidebar(pages, page)}<div class="doc-mobile-tools"><button class="sidebar-toggle" aria-expanded="false" aria-controls="editor-navigation">${icon('menu', 16)} ${groups[page.group].name}目录</button></div><article class="doc-article"><div class="breadcrumbs"><a href="/">首页</a><span>/</span><a href="${guide ? '/#common' : `/${page.group}/overview/`}">${groups[page.group].name}</a><span>/</span><span>${escape(page.title)}</span></div><div class="article-heading"><h1>${escape(page.title)}</h1><p>${escape(page.description)}</p></div><details class="mobile-toc"><summary>本页内容</summary><nav aria-label="移动端本页目录">${page.toc.filter(h => h.level === 2).map(h => `<a href="#${h.id}">${escape(h.title)}</a>`).join('')}</nav></details><div class="prose">${page.html}</div><div class="article-end"><span>内容依据组件公开文档 · 2026-10-25</span><a href="${faq}">常见问题 ${icon('arrow', 14)}</a></div><nav class="page-pagination" aria-label="前后文档">${adjacent.map((p, i) => p ? `<a href="${p.url}" class="${i ? 'next' : 'previous'}"><span>${i ? '下一篇' : '上一篇'}</span><strong>${escape(p.title)} ${i ? icon('arrow', 16) : ''}</strong></a>` : '<span></span>').join('')}</nav></article><aside class="doc-toc" id="page-toc"><strong>本页内容</strong><nav aria-label="本页目录">${page.toc.map(h => `<a href="#${h.id}" class="toc-level-${h.level}">${escape(h.title)}</a>`).join('')}</nav><div class="toc-help"><a href="${quick}">${guide ? '返回首页公共能力' : '查看快速开始'} ${icon('arrow', 14)}</a><a href="${faq}">常见问题 ${icon('arrow', 14)}</a></div><a class="back-top" href="#main">↑ 回到顶部</a></aside></main>`;
}
