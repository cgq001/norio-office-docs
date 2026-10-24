// Explicit maintenance command. Normal builds never read sibling repositories.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const base = process.env.EDITOR_SOURCE_ROOT || 'D:/work/office';
const roots = {
  word: 'office-word/packages/office-word',
  excel: 'office-excel/packages/office-excel',
  ppt: 'office-ppt/packages/office-ppt',
  rich: 'rich-text/packages/office-word',
};
const files = {};
const provenance = [];
for (const [id, root] of Object.entries(roots)) {
  const source = await fs.readFile(path.join(base, root, 'README.md'), 'utf8');
  files[id] = source.replace(/\r\n/g, '\n');
  provenance.push({ editor: id, source: `${root}/README.md`, sha256: crypto.createHash('sha256').update(source).digest('hex') });
}
function section(source, heading) {
  const lines = source.split('\n');
  const start = lines.findIndex(line => line === heading);
  if (start < 0) throw new Error(`Missing source section: ${heading}`);
  const level = heading.match(/^#+/)[0].length;
  let end = start + 1;
  for (; end < lines.length; end++) {
    const match = lines[end].match(/^(#+) /);
    if (match && match[1].length <= level) break;
  }
  return lines.slice(start, end).join('\n');
}
function normalize(text) {
  let code = false;
  return text.split('\n').map(line => {
    if (line.startsWith('```')) code = !code;
    if (code) return line;
    return line.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]+)\]\((?!https?:|mailto:)[^)]+\)/g, '$1');
  }).join('\n');
}
async function write(id, title, description, order, body) {
  const file = `content/${id}.md`;
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `---\n${JSON.stringify({ title, description, order, reference: true })}\n---\n\n${normalize(body).trim()}\n`);
}
const groups = {
  word: [
    ['api', '参数与事件', ['## 参数','## 事件','## 组件模式']],
    ['methods', '实例方法参考', ['## 公开方法']],
    ['files', '文件导入、导出与保存', ['## 错误处理与保存状态','## 导入资源限制','## 文档模型与持久化','## 旧式公式兼容范围']],
    ['extensions', '字体与扩展服务', ['## 字体加载与文字塑形','## 宿主扩展服务','## 其他公开组件','## 资源按需加载和字体缓存','## 包级扩展导出与类型']],
  ],
  excel: [
    ['api', '参数与事件', ['## Props API','## Events API']],
    ['methods', '实例方法参考', ['## 实例 API']],
    ['data', '工作簿与数据模型', ['## 数据结构','## 公共类型']],
    ['files', '文件导入与导出', ['## 导入导出']],
    ['collaboration', '协作接入参考', ['## 协同前端接入']],
    ['ai-reference', 'AI Bridge 与工具参考', ['## AI 公共接口']],
  ],
  ppt: [
    ['api', '参数、事件与方法', ['## 组件 Props','## 组件事件','## 通过 ref 调用编辑器']],
    ['persistence', '自动保存与崩溃恢复', ['## 持久化配置','## 完整接入示例']],
    ['files', 'PPTX 与 PDF 导出', ['## 导入 PPTX','## 导出 PPTX','## 原生动画与矢量 PDF']],
    ['presenting', '放映、动画与音视频', ['## 对象剪贴板、观众窗口与音视频','## 宿主页面事件冲突处理']],
  ],
  rich: [
    ['api', '参数、事件与方法', ['### Props','### 事件','### 实例 API','### 类型导入','### 包导出']],
    ['blocks', '内容块与界面配置', ['### 水印','### 可用 Key','### 复制、剪切和粘贴','### 块菜单的对齐与颜色','### 文字选区气泡菜单','### 表格主题色','### 分割线样式与颜色','### 高亮块颜色与设置','### 引用颜色','### 图片描述与链接','### @ 提及','### 自定义文案','### 预览模式','### 外置目录组件']],
    ['files', '保存、上传与导出', ['### 保存、加载与清空','### 上传并插入','### 导出示例']],
    ['collaboration', '协作接入参考', ['### 协同编辑','### 内置 Yjs 服务示例']],
    ['comments', '评论与业务数据', ['## 评论功能对接']],
    ['ai-reference', 'AI Skill 与宿主绑定', ['### AI Skill 接入与使用']],
  ],
};
for (const [id, pages] of Object.entries(groups)) {
  for (const [index, [slug, title, headings]] of pages.entries()) {
    const prefix = slug === 'collaboration' ? '> **Docker 版本必需**：多人协作需要部署 Docker 版本并接通对应协作服务。以下是前端协议参考；开发服务示例不替代生产 Docker 部署。\n\n' : '';
    const intro = `本页按主题整理项目公开说明，供完成快速接入后查阅。代码片段中的业务回调、服务地址和存储实现需要由宿主提供。\n\n`;
    let body = headings.map(h => section(files[id], h)).join('\n\n');
    if (id === 'rich') body = body.replace(/^### /gm, '## ');
    if (id === 'word') body = body.replace(/<OfficeWord\n(?!\s*:font-urls)/g, '<OfficeWord\n  :font-urls="fontUrls"\n');
    await write(`${id}/${slug}`, title, `${title}的接口、使用示例与行为说明。`, 40 + index, prefix + intro + body);
  }
}
for (const id of ['word', 'ppt']) {
  const relative = `${roots[id]}/docs/AI接入.md`;
  const raw = await fs.readFile(path.join(base, relative), 'utf8');
  provenance.push({editor: id, source: relative, sha256: crypto.createHash('sha256').update(raw).digest('hex')});
  const body = raw.replace(/\r\n/g, '\n').replace(/^# .+\n/, '');
  await write(`${id}/ai-reference`, 'AI 协议与能力边界', '目标、授权、局部修改、资源和验证边界的详细说明。', 49,
    (id === 'ppt' ? '> **实施中，尚未完整验收。** 不应将接口数量当作完整产品能力；当前 AI 与协作的组合不支持。\n\n' : '') + body);
}
await fs.mkdir('sources', {recursive:true});
await fs.writeFile('sources/provenance.json', JSON.stringify({ reviewedAt: '2026-10-25', files: provenance }, null, 2) + '\n');
console.log('Updated 22 topic references from local editor sources. Review the diff before publishing.');
