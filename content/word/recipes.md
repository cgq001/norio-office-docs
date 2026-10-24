---
{"title":"保存与导出实战","description":"读取完整文档、导入 DOCX、下载文件，并正确处理异步结果。","order":20}
---

以下片段沿用[快速开始](/word/quickstart/)中的 `wordRef`。在组件已挂载后，通过用户按钮调用；宿主需要把错误展示到自己的界面。

## 保存结构化快照

`getDocumentAsync()` 会等待已收到的延后输入完成，适合用户点击“保存”的场景。示例保存到当前浏览器，不是团队共享存储。

```ts
async function saveSnapshot() {
  const api = wordRef.value
  if (!api) return
  try {
    const snapshot = await api.getDocumentAsync()
    localStorage.setItem('word-project-plan', JSON.stringify(snapshot))
  } catch (error) {
    console.error('保存失败，当前内容尚未确认保存', error)
  }
}

function restoreSnapshot() {
  const api = wordRef.value
  if (!api) return
  try {
    const saved = localStorage.getItem('word-project-plan')
    if (saved) api.setDocument(JSON.parse(saved))
  } catch (error) {
    console.error('读取文档失败', error)
  }
}
```

生产环境应将 JSON 或文档文件发送到业务存储，在服务器明确返回成功后才显示“已保存”。文档替换会重置编辑状态；不要用它提交 AI 局部修改。

## 通过文件选择器导入

```ts
async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  const api = wordRef.value
  if (!file || !api) return
  try {
    const state = await api.importFile(file)
    if (state.status !== 'success') {
      console.error(state.code, state.message)
    }
  } catch (error) {
    console.error('导入未完成', error)
  } finally {
    input.value = ''
  }
}
```

```vue
<input type="file" accept=".docx" @change="handleFileChange" />
```

`importFile()` 的失败或取消通常体现在返回状态中，授权失败也可能抛出异常，所以两条路径都需要处理。旧版二进制 `.doc` 不支持直接导入；不要只修改扩展名来转换格式。

## 导出 DOCX 并下载

```ts
async function downloadDocx() {
  const api = wordRef.value
  if (!api) return
  try {
    const result = await api.exportWordBlob()
    const url = URL.createObjectURL(result.blob)
    const link = window.document.createElement('a')
    link.href = url
    link.download = result.fileName
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch (error) {
    console.error('导出失败', error)
  }
}
```

使用 `window.document` 避免与 Vue 文档状态变量重名。导出文件名由组件规范化，也可以传入 `{ fileName: '项目方案.docx' }`。

## 输出 PDF 或指定页图片

```ts
const api = wordRef.value
if (!api) throw new Error('编辑器尚未就绪')
const pdf = await api.exportPdfBlob()
const pages = await api.exportPngBlobs({ pages: [1, 3], scale: 2 })
// pdf 是 Blob；pages 每项包含原文档页码 page 和 blob。
// 交给你的下载或上传函数，成功后再更新保存状态。
```

页码从 1 开始。导出方法自己准备所需排版，不必先调用诊断接口；生成 Blob 不会自动下载或上传。
