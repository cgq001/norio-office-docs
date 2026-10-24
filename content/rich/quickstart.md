---
{"title":"快速开始","description":"从空白 JSON 文档开始，在 Vue 页面中接入富文本编辑器。","order":10}
---

需要 Vue 3.5+ 和兼容的 Tiptap 3.x 依赖。组件依赖浏览器 DOM，SSR 项目应只在客户端挂载。

## 1. 安装组件与样式

```bash
npm install @norio-office/rich-text
```

如果包管理器没有自动满足 peer dependencies，请按安装版本的 `package.json` 补齐。不要混用 Tiptap 2.x，也不要让 core、vue-3 和扩展解析到不兼容的小版本。

## 2. 创建一个空文档

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
