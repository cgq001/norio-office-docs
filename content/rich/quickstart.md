---
{"title":"快速开始","description":"从安装 @norio-office/rich-text 到引入组件、运行第一个 Vue 编辑页面。","order":10}
---

本页用一个 Vue 3.5+、Vite、TypeScript 页面完成富文本的首次接入。已有项目可以跳过下面的新建步骤，从第 1 步安装组件开始。

组件依赖浏览器 DOM；SSR 项目应只在客户端挂载编辑器。

## 准备一个 Vue 项目

还没有项目时，在终端执行以下命令，创建一个独立的 Vue + TypeScript 项目。建议使用 Node.js 22.12+，更多环境要求见 [Vite 官方说明](https://vite.dev/guide/)。

```bash
npm create vite@latest norio-rich-demo -- --template vue-ts
cd norio-rich-demo
npm install
```

后续安装与启动命令都在这个包含 `package.json` 的目录执行。项目的 Vue 版本需满足 3.5+，pnpm / Yarn 安装方式和依赖说明见[安装](/rich/installation/)。

## 1. 安装 npm 包

```bash
npm install @norio-office/rich-text @tiptap/core@^3.22.1 --include=peer
```

如果包管理器没有自动满足 peer dependencies，请按安装版本的 `package.json` 补齐。不要混用 Tiptap 2.x，也不要让 core、vue-3 和扩展解析到不兼容的小版本。

## 2. 引入组件和样式

将 `src/App.vue` 的内容替换为下面的完整示例。已有项目也可把它保存为自己的页面组件，再从路由或父组件中引用。`<script setup>` 中导入组件后即可在模板中使用，无需额外全局注册。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { JSONContent } from '@tiptap/core'
import {
  RichTextEditor,
  type RichTextEditorInstance,
} from '@norio-office/rich-text'
import '@norio-office/rich-text/style.css'

const editorRef = ref<RichTextEditorInstance | null>(null)
const content = ref<JSONContent>({
  type: 'doc',
  content: [{ type: 'paragraph' }],
})
</script>

<template>
  <RichTextEditor ref="editorRef" v-model="content" />
</template>
```

`content` 是 Tiptap JSON，不是 HTML 字符串。编辑后 `v-model` 更新这个对象，不会自动发送保存请求。

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

应看到空白富文本编辑区。输入一段文字后，`content` 会更新为包含这段文字的文档 JSON。

准备部署时运行：

```bash
npm run build
```

这是构建你自己的应用。编辑内容的保存仍需接入业务存储，页面上能编辑不代表刷新后会自动恢复。

## 3. 读取内容

在组件挂载后或用户点击按钮时，通过 `editorRef.value` 读取：

```ts
function readDocument() {
  const api = editorRef.value
  if (!api) return
  const document = api.getJSON() // 完整结构，适合保存
  const text = api.getText() // 纯文字，适合摘要或检索
  return { document, text }
}
```

只保存 `getText()` 会丢失格式、图片和表格。若要恢复编辑状态，请保存完整 JSON；若要打包附件和原生文件，再使用 Nordox。

## 4. 加入自己的业务能力

- **保存内容：** [保存、上传与导出](/rich/files/)包含本地存储完整示例和上传 hook。
- **管理界面：** 在[内容块与界面配置](/rich/blocks/)中查看菜单 Key、水印、预览和目录。
- **接评论：** [评论与业务数据](/rich/comments/)解释锚点、评论事件与数据库的职责。
- **接 AI：** [AI 局部修改](/rich/ai/)演示冻结目标和 Bridge。
- **接协作：** 部署 [Docker 版本](/guide/collaboration/)后，再连接 Yjs。

第一次接入建议先实现“输入 → 保存 JSON → 刷新后恢复”，再逐步增加其他能力。
