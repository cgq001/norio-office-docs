---
{"title":"快速开始","description":"从安装 @norio-office/office-word 到引入组件、运行第一个 Vue 编辑页面。","order":10}
---

本页用一个 Vue 3.5+、Vite、TypeScript 页面完成 Word 文档的首次接入。已有项目可以跳过下面的新建步骤，从第 1 步安装组件开始。

## 准备一个 Vue 项目

还没有项目时，在终端执行以下命令，创建一个独立的 Vue + TypeScript 项目。建议使用 Node.js 22.12+，更多环境要求见 [Vite 官方说明](https://vite.dev/guide/)。

```bash
npm create vite@latest norio-word-demo -- --template vue-ts
cd norio-word-demo
npm install
```

后续安装与启动命令都在这个包含 `package.json` 的目录执行。项目的 Vue 版本需满足 3.5+，pnpm / Yarn 安装方式和依赖说明见[安装](/word/installation/)。

## 1. 安装 npm 包

```bash
npm install @norio-office/office-word
```

## 2. 配置 Worker 与 WASM

在现有 `vite.config.ts` 中加入资源插件。它负责部署运行资源，不负责替你下载四个基础字体。

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { officeWordAssets } from '@norio-office/office-word/vite'

export default defineConfig({
  plugins: [vue(), officeWordAssets()],
  build: { target: 'esnext' },
})
```

字体引擎使用顶层 await，Vite 5 需要显式设置 `esnext`。其他构建工具应部署完整 Worker 依赖图和二进制，并保留相对路径，不能只复制一个 Worker 文件。

## 3. 准备四个配套字体

演示项目的 `App.vue` 通过 `font-urls.ts` 使用下面四个真实地址。首次在本地运行，可以直接使用这些配置；也可以点击链接取得字体文件后自行托管。

| 配置键 | 用途 | 演示文件与下载地址 |
| --- | --- | --- |
| `text` | 基础文字（Noto Sans SC） | [text.ttf](http://cnd.norio.top/npm-fonts/text.ttf) |
| `symbols` | 符号（Noto Sans Symbols 2） | [symbols.ttf](http://cnd.norio.top/npm-fonts/symbols.ttf) |
| `emoji` | 表情（Noto Emoji） | [emoji.ttf](http://cnd.norio.top/npm-fonts/emoji.ttf) |
| `cjk` | 中日韩文字（Noto Sans CJK SC） | [cjk.otf](http://cnd.norio.top/npm-fonts/cjk.otf) |

完整演示配置如下，下方的 `App.vue` 已包含相同地址，可以直接复制：

```ts
const fontUrls: OfficeWordFontUrls = {
  text: 'http://cnd.norio.top/npm-fonts/text.ttf',
  symbols: 'http://cnd.norio.top/npm-fonts/symbols.ttf',
  emoji: 'http://cnd.norio.top/npm-fonts/emoji.ttf',
  cjk: 'http://cnd.norio.top/npm-fonts/cjk.otf',
}
```

> 演示资源目前使用 HTTP。HTTPS 站点不能直接加载这些 HTTP 字体；该域名的 HTTPS 地址目前也存在证书不匹配问题，不能只把地址改成 `https://`。本地联调后，请按下面的步骤下载并托管到自己的 HTTPS 站点或资源服务。

四项必须全部提供，字节需通过本版本 SHA-256 校验。文件名相同不等于字节匹配；网络或跨域错误也会阻止排版就绪。`fontUrls` 在初始化时读取，不能在挂载后随意热切换。

### 下载字体并自行托管

在 Vue 项目根目录执行以下 PowerShell 命令，将四个文件下载到 `public/fonts/`。如果浏览器打开 HTTP 下载链接时受到限制，也可以使用这些命令下载。

```powershell
New-Item -ItemType Directory -Force -Path public/fonts | Out-Null
Invoke-WebRequest -Uri 'http://cnd.norio.top/npm-fonts/text.ttf' -OutFile 'public/fonts/text.ttf'
Invoke-WebRequest -Uri 'http://cnd.norio.top/npm-fonts/symbols.ttf' -OutFile 'public/fonts/symbols.ttf'
Invoke-WebRequest -Uri 'http://cnd.norio.top/npm-fonts/emoji.ttf' -OutFile 'public/fonts/emoji.ttf'
Invoke-WebRequest -Uri 'http://cnd.norio.top/npm-fonts/cjk.otf' -OutFile 'public/fonts/cjk.otf'
```

macOS / Linux 用户也可以使用 `curl` 下载表格中的同一组文件，保持上述目录与文件名即可。

下载后的目录为：

```text
public/
  fonts/
    text.ttf
    symbols.ttf
    emoji.ttf
    cjk.otf
```

随后将下面完整示例中的 `fontUrls` 替换为自己的地址。Vite 项目可以这样引用 `public/` 下的文件；使用 `BASE_URL` 也能适应部署到子路径的情况：

```ts
const fontUrls: OfficeWordFontUrls = {
  text: `${import.meta.env.BASE_URL}fonts/text.ttf`,
  symbols: `${import.meta.env.BASE_URL}fonts/symbols.ttf`,
  emoji: `${import.meta.env.BASE_URL}fonts/emoji.ttf`,
  cjk: `${import.meta.env.BASE_URL}fonts/cjk.otf`,
}
```

应用部署后，这些文件随站点一起提供。若改用独立资源服务，需要提供可访问的 HTTPS 文件地址，并允许应用跨域读取。无论托管在哪里，都应保留原字体文件的字节。

## 4. 引入组件和样式

将 `src/App.vue` 的内容替换为下面的完整示例。它使用演示环境的字体地址，适合先在本地开发服务运行。部署到 HTTPS 环境时，请将 `fontUrls` 换成上一步自行托管的地址。已有项目也可把它保存为自己的页面组件，再从路由或父组件中引用。

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import {
  OfficeWord,
  createDefaultOfficeWordDocument,
  type OfficeWordFontUrls,
  type OfficeWordPublicApi,
} from '@norio-office/office-word'
import '@norio-office/office-word/style.css'

const wordRef = shallowRef<OfficeWordPublicApi | null>(null)
const document = shallowRef(createDefaultOfficeWordDocument('项目方案'))
const fontUrls: OfficeWordFontUrls = {
  text: 'http://cnd.norio.top/npm-fonts/text.ttf',
  symbols: 'http://cnd.norio.top/npm-fonts/symbols.ttf',
  emoji: 'http://cnd.norio.top/npm-fonts/emoji.ttf',
  cjk: 'http://cnd.norio.top/npm-fonts/cjk.otf',
}

function handleError(error: unknown) {
  console.error('文档操作失败', error)
}
</script>

<template>
  <div style="height: 720px">
    <OfficeWord ref="wordRef" v-model="document"
      :font-urls="fontUrls" mode="edit" @error="handleError" />
  </div>
</template>
```

## 运行前：清理脚手架默认样式

如果使用上面的 Vite 新项目，将 `src/style.css` 替换为以下基础样式，避免脚手架自带的居中、内边距和最大宽度挤压编辑区域。已有业务项目保留自己的布局，只需保证编辑器容器尺寸正确。

```css
* { box-sizing: border-box; }
html, body, #app { width: 100%; min-height: 100%; margin: 0; }
body { font-family: Arial, "Microsoft YaHei", sans-serif; }
```

`src/main.ts` 保留脚手架生成的 `createApp(App).mount('#app')` 和对 `./style.css` 的导入即可。组件样式已在上面的 `App.vue` 中引入。

## 运行并检查页面

保存文件后，在项目根目录启动开发服务：

```bash
npm run dev
```

打开终端输出的本地地址。默认通常是 `http://localhost:5173`；端口被占用时以终端显示的地址为准。

应看到 Word 工具栏和文档页面。字体与运行资源加载成功后，输入文字会更新 `document`。

准备部署时运行：

```bash
npm run build
```

这是构建你自己的应用。编辑内容的保存仍需接入业务存储，页面上能编辑不代表刷新后会自动恢复。

## 5. 检查结果

页面应显示编辑器工具栏和文档页面，能够输入文字并更新 `document`。网络面板中的字体、Worker 和 WASM 应返回成功响应，不能返回 HTML 错误页。

`ready` 表示可以取得组件接口，不表示整篇字体、分页和画面已经全部完成。需要导出时使用公开异步方法，不要自行固定延时“等两秒”。

接下来按[保存与导出实战](/word/recipes/)完成保存闭环。要隐藏标题栏可设置 `showFileHeader`；要限制导入导出请查[参数与事件](/word/api/)。
