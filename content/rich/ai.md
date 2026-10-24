---
{"title":"AI 局部修改与流式预览","description":"冻结选区，用同一个 Bridge 修改内容，并保留正文之外的数据。","order":30}
---

富文本支持选区、光标、内容块和表格单元格等目标。Bridge 在当前 Tiptap/ProseMirror 实例上执行事务，既支持单人模式，也可通过已配置的 Yjs 绑定工作。

## 1. 绑定实例

在快速开始的组件上设置 `show-ai-target-button`。实例挂载后创建 Bridge，按钮才可捕获真实目标：

```vue
<RichTextEditor ref="editorRef" v-model="content" show-ai-target-button />
```

```ts
import { createRichTextAiBridge, createRichTextToolHandlers }
  from '@norio-office/rich-text/ai'
import { getRichTextToolDefinitions }
  from '@norio-office/rich-text/ai-protocol'

const documentId = 'knowledge-article-001'
const bridge = createRichTextAiBridge(editorRef.value!, { documentId })
const handlers = createRichTextToolHandlers(bridge, {
  createDocument: async () => {
    throw new Error('本例仅演示局部编辑，尚未接入新建文件存储')
  },
})
const definitions = getRichTextToolDefinitions()
// 将同名定义与处理器注册到宿主 AI Runtime。
```

创建文件、外部媒体与评论引用等能力还需要宿主服务和授权。这里只绑定局部文字编辑所需的运行时。

## 2. 示例：只把选中文字改成红色

用户先选中文字并点击 AI 目标按钮，再调用下面的函数。它使用固定补丁说明流程，不需要模型就能验证局部编辑链路。

```ts
async function colorSelectedText() {
  const target = bridge.getAiTarget()
  if (!target) throw new Error('请先选中文字并冻结 AI 范围')
  const context = bridge.createEditContext({
    requestId: crypto.randomUUID(),
    instruction: '只把选中文字改成红色',
    scope: 'selection',
    targetId: target.targetId,
    writePolicy: {
      allowedOperations: ['setMarks'],
      allowedMarkAttributes: { textStyle: ['color'] },
    },
  })
  const result = await handlers.richtext_apply_patch({
    protocolVersion: 1,
    documentId,
    requestId: context.requestId,
    contextId: context.contextId,
    baseRevision: context.baseRevision,
    operations: [{
      type: 'setMarks',
      targetRef: context.targetRefs[0],
      marks: [{ type: 'textStyle', attrs: { color: '#ff0000' } }],
    }],
  })
  if (!result.ok) throw new Error(result.error.message)
  return result
}
```

写入策略由可信宿主建立，不由模型自行扩大。真实模型接入时，先读取工具能力与目标，再让模型返回符合工具 Schema 的完整参数；不要让模型构造 `targetRef`。

## 3. 处理取消与失效

监听 `ai-target-change` 和 `ai-target-invalidated`。点击正文、关闭标记或内容变化使目标失效时，宿主应取消对应模型请求。接口返回 `requiresContextRefresh` 时，重新捕获并读取，不能重试旧引用。

组件页面关闭时取消订阅并调用 `bridge.dispose()`。局部写入用 Bridge，不能通过替换 `v-model` 或 `setContent` 提交。

## 4. 流式预览

真实增量 NDJSON 经 `consumeRichTextAiStream()` 交给 Bridge。草稿先在当前编辑区显示，传输正常结束后才提交；取消或错误丢弃草稿。预览只存在于本地，不把每一段未完成输出广播给协作者。

模型一次返回完整 JSON 可以用于普通工具调用，但不能冒充真正的流式预览。

## 5. Nordox 与资源

`exportNordox()` 返回 Blob，可选择图片、视频和附件采用 `embed` 或 `reference`。嵌入资源需要读取字节的 resolver，外链需要长期有效的引用。文件输出成功后仍由宿主下载或保存，不能把临时 Blob 地址作为永久资源。

更多 Skill、工具与宿主绑定示例见 [AI Skill 与宿主绑定](/rich/ai-reference/)。协作环境还需部署 [Docker 版本](/guide/collaboration/)。
