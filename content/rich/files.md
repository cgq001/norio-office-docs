---
{"title":"保存、上传与导出","description":"保存、上传与导出的接口、使用示例与行为说明。","order":42,"reference":true}
---

本页按主题整理项目公开说明，供完成快速接入后查阅。代码片段中的业务回调、服务地址和存储实现需要由宿主提供。

## 保存、加载与清空

单人编辑时，把完整 JSON 存入数据库，打开文档时再赋给 `content`。不要只保存 `getText()`，它会丢失标题、颜色、表格和图片等结构。

下面是可独立使用的本地演示：手动保存到浏览器 `localStorage`，重新打开页面时恢复。它不涉及上传或服务器，也不适用于多人协同的内容同步。

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { JSONContent } from '@tiptap/core'
import { RichTextEditor } from '@norio-office/rich-text'
import '@norio-office/rich-text/style.css'

const storageKey = 'rich-text-demo'
const createEmptyDocument = (): JSONContent => ({
  type: 'doc',
  content: [{ type: 'paragraph' }],
})
const content = ref<JSONContent>(createEmptyDocument())
const status = ref('')

onMounted(() => {
  try {
    const saved = localStorage.getItem(storageKey)
    if (!saved) return
    const parsed = JSON.parse(saved) as JSONContent
    if (parsed.type !== 'doc' || !Array.isArray(parsed.content)) {
      throw new Error('文档格式不正确')
    }
    content.value = parsed
    status.value = '已恢复上次保存的文档'
  } catch {
    status.value = '读取失败，已打开空文档'
  }
})

function saveDocument() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(content.value))
    status.value = '已保存到当前浏览器'
  } catch {
    status.value = '保存失败，请检查浏览器存储空间或权限'
  }
}

function clearDocument() {
  content.value = createEmptyDocument()
  status.value = '已清空编辑区，点击保存后才覆盖旧存档'
}
</script>

<template>
  <button type="button" @click="saveDocument">保存</button>
  <button type="button" @click="clearDocument">清空</button>
  <span>{{ status }}</span>
  <RichTextEditor v-model="content" document-name="演示文档" />
</template>
```

实际项目可以将 `localStorage` 换成自己的读写接口。若监听 `change` 自动保存，建议做防抖和失败提示；`v-model` 和 `change` 对应同一次内容更新，不要分别调用两次保存接口。

注意：当前实现中，初次挂载不传 `modelValue` 或传 `null`，单人模式会显示内置示例文字，不是空文档；挂载后将它改成 `null` 也不会清空。要清空请传上例的 `{ type: 'doc', content: [{ type: 'paragraph' }] }`。协同模式以 Yjs 为准，不能用这个赋值方式覆盖房间内容。


## 上传并插入

推荐集成流程：

1. 在业务层上传文件。
2. 等待接口返回可访问 URL。
3. 调用组件实例方法插入返回内容。

这是业务自行上传的方式；如果使用下面的内置上传 hook，组件会自动插入，不要在 hook 中再次调用插入 API，否则会出现重复内容。

如果使用编辑器内置的图片、视频、本地文件选择器或页面拖拽上传，请传入上传 hook。编辑器只负责把用户选中的 `File` 交给业务侧上传，并在 hook 返回 URL 后插入内容；组件不会内置业务上传接口，也不会自动回退为 base64/blob URL。

页面拖拽上传会按文件类型分流：`image/*` 走图片上传，`video/*` 走视频上传，其他格式全部走 `uploadFile` 并插入本地文件卡片。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { JSONContent } from '@tiptap/core'
import { RichTextEditor } from '@norio-office/rich-text'
import type {
  RichTextEditorUploadInput,
  RichTextEditorUploadResult,
  RichTextEditorUploadErrorPayload,
} from '@norio-office/rich-text'
import '@norio-office/rich-text/style.css'

const content = ref<JSONContent>({ type: 'doc', content: [{ type: 'paragraph' }] })

async function uploadToServer(payload: RichTextEditorUploadInput): Promise<RichTextEditorUploadResult> {
  const form = new FormData()
  form.append('file', payload.file)
  form.append('kind', payload.kind)

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: form,
  })

  if (!response.ok) {
    throw new Error('上传失败')
  }

  const result = await response.json() as RichTextEditorUploadResult
  if (!result.url) throw new Error('上传接口没有返回 url')
  return result
}

function handleUploadError(payload: RichTextEditorUploadErrorPayload) {
  console.error(payload.kind, payload.fileName, payload.error)
}
</script>

<template>
  <RichTextEditor
    v-model="content"
    :upload-image="uploadToServer"
    :upload-video="uploadToServer"
    :upload-file="uploadToServer"
    @local-file-click="(file) => console.log('file clicked', file)"
    @upload-error="handleUploadError"
  />
</template>
```

`onUploadError` callback prop 和 `@upload-error` 事件都能接收上传失败信息。通常选择一种接入方式即可，避免业务层重复处理。

上面的 `/api/upload` 是业务自己实现的接口。hook 接收 `{ file: File, kind: 'image' | 'video' | 'file' }`；返回值不是 URL 字符串，而是以下对象：

```json
{
  "url": "https://cdn.example.com/uploads/photo.png",
  "assetId": "asset-1001",
  "name": "photo.png",
  "size": 2048,
  "mimeType": "image/png",
  "alt": "项目照片",
  "description": "本次项目的示意图"
}
```

只有 `url` 必填，其余字段可选；缺少 `name`、`size`、`mimeType` 时，内置上传流程会使用原文件的信息。缺少 hook 会报上传错误，不会自动生成 base64；失败任务可在上传面板重试。评论图片可单独传 `uploadCommentImage`，未传时使用 `uploadImage`。

地址必须能被阅读文档的人访问。不要把本地磁盘路径或临时 `blob:` 地址当成长期文件地址；返回地址和文件权限由业务负责。

插入图片：

```ts
async function uploadImage(file: File) {
  const imageUrl = await yourUploadApi(file)

  editorRef.value?.insertImage({
    src: imageUrl,
    name: file.name,
    alt: file.name,
    description: '',
  })
}
```

一次最多插入 4 张图片：

```ts
editorRef.value?.insertImage([
  { src: 'https://cdn.example.com/a.png', name: 'a.png' },
  { src: 'https://cdn.example.com/b.png', name: 'b.png' },
])
```

插入视频：

```ts
async function uploadVideo(file: File) {
  const videoUrl = await yourUploadApi(file)

  editorRef.value?.insertVideo({
    src: videoUrl,
    name: file.name,
    mimeType: file.type || 'video/mp4',
    description: 'video description',
  })
}
```

插入文件链接/预览块：

```ts
async function uploadFile(file: File) {
  const fileUrl = await yourUploadApi(file)

  editorRef.value?.insertFile({
    url: fileUrl,
    name: file.name,
    displayMode: 'text',
  })
}
```

插入本地文件卡片：

```ts
editorRef.value?.insertLocalFile({
  url: 'https://cdn.example.com/files/demo.txt',
  name: 'demo.txt',
  size: 2048,
  mimeType: 'text/plain',
})
```


## 导出示例

下面的函数与“实例 API”示例中的 `editorRef` 一起使用。编辑器不显示导出按钮；实例方法仅返回 Blob/HTML，下载由宿主控制。

| 导出方式 | 当前实现与适用范围 |
| --- | --- |
| `exportImage()` | 页面截图；默认 PNG，可选 JPEG。`quality` 可选 0-1，主要影响 JPEG，不传时使用浏览器默认质量。 |
| `exportPdf()` | 简化的 DOM 文字和矩形色块绘制，生成一张随文档高度延伸的 PDF 页面；不是页面截图，也不是 Word 文件。当前不嵌入图片、视频、SVG 图标，不保证字体、公式、圆角、虚线、水印等细节还原。 |
| `exportHtml()` | 含内联样式的完整 HTML 文档；媒体地址仍指向原文件服务，不是离线资源包。 |

当前几种导出都先复制页面并清理编辑控件，视频块和页面水印也会被清除。因此不能假设导出文件包含页面上的所有元素。

```ts
function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function handleExportPdf() {
  const blob = await editorRef.value?.exportPdf()
  if (!blob) return

  downloadBlob(blob, 'demo.pdf')
}

async function handleExportImage() {
  const blob = await editorRef.value?.exportImage({
    type: 'image/png',
  })
  if (!blob) return

  downloadBlob(blob, 'demo.png')
}

function handleExportHtml() {
  const html = editorRef.value?.exportHtml()
  if (!html) return

  console.log(html)
}
```
