---
{"title":"部署到 Cloudflare","description":"一次构建，生成可以独立托管的静态 HTML、CSS、JavaScript 和搜索索引。","order":4}
---

本仓库无需数据库、SSR 或编辑器运行时。构建后的 `dist/` 包含全部页面、样式、脚本和搜索数据，Cloudflare Pages 可以直接托管。

## 本地运行

安装 Node.js 22 或以上版本，在仓库根目录执行：

```bash
npm ci
npm run dev
```

默认预览地址为 `http://localhost:4173`。开发服务监听 Markdown、模板、样式和脚本变化并重建；修改后刷新浏览器查看。

## 构建与检查

```bash
npm run build
npm run check
npm run preview
```

`check` 验证生成页面、内部链接、锚点和搜索索引。`preview` 启动静态 HTTP 服务；不能用双击 HTML 的方式替代 HTTP 预览，因为全文搜索需要读取索引文件。

## 方式一：Cloudflare Pages 连接 Git

1. 把此仓库推送到你自己的 Git 仓库。
2. 在 Cloudflare 的 Workers & Pages 中创建 **Pages** 项目，连接该仓库。
3. 使用以下构建设置，选择实际使用的生产分支。
4. 部署成功后打开 Cloudflare 分配的域名，检查首页、文档深层地址和搜索。

| 设置项 | 值 |
| --- | --- |
| Framework preset | None |
| Root directory | 仓库根目录；若置于 monorepo，则填写本站所在目录 |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node 版本 | 22（仓库附带 `.node-version`） |

以上对应 Cloudflare 官方的[静态 HTML 部署说明](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/)与[构建配置](https://developers.cloudflare.com/pages/configuration/build-configuration/)。

## 方式二：上传构建产物

本地完成构建后，可在 Pages 的直接上传流程中上传 `dist` 内的静态文件，也可以在已配置 Cloudflare 登录的环境执行：

```bash
npx wrangler pages deploy dist --project-name=norio-office-docs
```

`norio-office-docs` 是本站配置中的项目名；如果你的 Pages 项目使用别的名称，请同步修改 `wrangler.toml` 和命令。命令会发布内容，请在自己的部署环境执行。

## 路由和 404

每个文档都生成真实目录，例如 `/word/quickstart/index.html`。直接访问或刷新 `/word/quickstart/` 无需服务端重写。构建输出包含顶层 `404.html`，不存在的页面显示返回入口，避免把未知地址伪装成首页。

本站默认部署到域名根路径，适合 `docs.example.com` 或 Pages 子域名。如果要部署到 `/docs/` 这样的子目录，需要统一调整链接和资源前缀；当前没有启用子路径模式。

## 域名与搜索引擎

在 Cloudflare 配置自定义域名后，在构建环境中设置 `SITE_URL` 为真实站点地址，例如 `https://docs.example.com`。构建器会生成 canonical 链接、`sitemap.xml` 和 `robots.txt` 中的 Sitemap 地址。未配置时不生成虚假域名。

站内搜索是本地静态全文搜索，不发送查询到第三方服务，也不需要搜索 API Key。

## 日后怎样维护

- 在 `content/` 修改 Markdown，每篇文件开头的 JSON 元信息决定标题、摘要和侧栏顺序。
- `src/` 保存模板、样式和浏览器交互；`public/` 放原样复制的静态文件。
- `sources/provenance.json` 记录参考源码与哈希；普通构建不读取你的本地四个编辑器目录。
- 维护者可显式执行 `node scripts/import-reference.mjs` 更新按主题整理的参考页，之后审阅差异并同步调整概览、教程和 AI 状态。此命令会覆盖参考页，不能代替人工内容审核。

文档网站部署与 [Docker 协作服务](/guide/collaboration/)部署互相独立。
