# Norio Office 文档站

四类编辑器的中文静态文档：Word、Excel、PPT、富文本。首页介绍四个产品与公共能力；每个编辑器有独立目录、常见问题和默认搜索范围。可在搜索弹窗中主动切换到全站或其他编辑器。

不安装、不加载四个编辑器，不包含演示页面；浏览器端只运行搜索、目录、主题和复制代码交互。

## 开发

需要 Node.js 22 或以上版本。

```bash
npm ci
npm run dev
```

打开 `http://127.0.0.1:4173`。修改内容或样式后自动重建，刷新浏览器查看。通过环境变量 `PORT` 更改端口。

```bash
npm run build
npm run check
npm run preview
```

产物位于 `dist/`。检查脚本覆盖静态页面、内部链接、资源、锚点、搜索记录、四套核心文档，以及侧栏和搜索默认范围的隔离。

## Cloudflare Pages

| 项目 | 配置 |
| --- | --- |
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | 本仓库根目录 |
| Node | 22，仓库提供 `.node-version` |

可连接 Git 自动构建，或在本地构建后上传 `dist`。`wrangler.toml` 提供 Pages 静态目录配置；部署命令由维护者在自己的登录环境执行：

```bash
npx wrangler pages deploy dist --project-name=norio-office-docs
```

设置 `SITE_URL=https://你的实际域名` 后重新构建，生成 canonical 与 sitemap。默认按域名根路径部署，不支持直接放到 `/docs/` 子目录。每篇文档都生成独立 HTML，刷新深层链接无需 SPA 重写。

官方参考：[静态 HTML](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/)、[构建配置](https://developers.cloudflare.com/pages/configuration/build-configuration/)。

## 项目结构

```text
content/                 中文 Markdown，JSON 格式的页首元信息
  guide/                 选型、AI 原理、Docker、Cloudflare、FAQ
  word/ excel/ ppt/ rich/ 四套产品文档与接口参考
src/templates.mjs        首页与文档布局
src/styles.css           响应式布局与深浅色主题
src/app.js               搜索、复制、目录、主题交互
public/                  图标与 Cloudflare 响应头
scripts/                 构建、预览、检查和显式参考同步
sources/provenance.json  参考源码文件及 SHA-256
```

新增一篇 `content/<分类>/<名称>.md` 即生成对应地址。编辑器侧栏按 `src/templates.mjs` 的 `navigationSections` 分组；添加新主题时应把文件名加入对应分组。公共说明目录和前后篇按 `order` 排序。文件格式：

```markdown
---
{"title":"页面标题","description":"一句话说明","order":20}
---

正文从这里开始。

## 小节标题

小节自动生成锚点和页内目录。
```

参考页按来源章节整理。显式更新命令：

```bash
node scripts/import-reference.mjs
```

默认从 `D:/work/office` 下的四个项目读取；其他机器通过 `EDITOR_SOURCE_ROOT` 指定包含四个仓库的父目录。命令会覆盖参考页，需人工审阅 diff 并同步教程。**普通构建不依赖这些本地路径。** 来源时间与哈希记录于 `sources/provenance.json`。

## 内容边界

- 多人协作需要 Docker 版本及实际服务；静态站不提供协作后端。
- 四个 README 未提供统一正式 Docker 镜像与 Compose 配置，站点明确说明这一点，不给出虚构命令。
- AI 由宿主接模型、授权和保存服务；Skill 不等于运行时接入。
- PPT AI 尚未完整验收，当前 AI 与协作组合不支持。
- Word 必须配置本版本配套字体及 Worker/WASM。
- 不统一宣称开源或商业授权；以实际组件版本 LICENSE 为准。

站点没有发布到云端，不包含账号或部署凭据。
