---
{"title":"AI Skill 与宿主绑定","description":"AI Skill 与宿主绑定的接口、使用示例与行为说明。","order":45,"reference":true}
---

本页按主题整理项目公开说明，供完成快速接入后查阅。代码片段中的业务回调、服务地址和存储实现需要由宿主提供。

## AI Skill 接入与使用

**Skill 在哪里：**源码位于本仓库的 `packages/skills/norio-rich-text/`，独立发布地址为 [norio-office-rich-text-skill](https://github.com/cgq001/norio-office-rich-text-skill)。入口是 [`SKILL.md`](https://github.com/cgq001/norio-office-rich-text-skill/blob/main/norio-rich-text/SKILL.md)；`references/` 提供协议和操作说明，`examples/` 提供输入样例，`schemas/` 提供校验规则，`scripts/` 是可选的离线 CLI。Skill 不随 `@norio-office/rich-text` npm 包自动安装；请把整个 `norio-rich-text/` 目录放到所用 AI 平台支持的 Skill 位置，并按该平台的方式启用它，不要只复制 `SKILL.md`。

**接入在线编辑器：**宿主项目仍需安装上面的编辑器包，并完成以下绑定；单独安装 Skill 不会连接到浏览器里的文档。

1. 在编辑模式渲染 `<RichTextEditor ref="editorRef" :show-ai-target-button="true" />`。按钮默认不显示；预览模式下始终隐藏。
2. 组件挂载后，用真实编辑器实例和稳定的 `documentId` 创建 `createRichTextAiBridge`，监听 `ai-target-change`。用户点按钮会锁定当前光标/选区；点正文、点标记关闭按钮或宿主调用 `clearAiTarget()` 会清除标记，并通过事件通知宿主。再次点工具栏按钮不会取消标记。
3. 将 `getRichTextToolDefinitions()` 的定义和 `createRichTextToolHandlers(bridge, host)` 的同名处理函数注册到自己的 AI 运行时。宿主负责模型请求、文档权限、外部资源授权、文件存储和请求取消；编辑器不自带这些服务。
4. 发送编辑指令前读取 `bridge.getAiTarget()`，用它的 `targetId` 创建 `bridge.createEditContext(...)`，把返回的 `contextId`、`targetRefs` 等交给工具调用。不要自行构造 `targetRef` 或直接替换整个 `v-model` 来做局部编辑。

下面是浏览器侧的关键绑定（假设已在组件挂载后取得 `editorRef`，并准备好 `hostDocumentId`、`activeTarget`；保存函数和 AI 工具注册由你的项目实现）：

```ts
import { createRichTextAiBridge, createRichTextToolHandlers } from '@norio-office/rich-text/ai'
import { getRichTextToolDefinitions } from '@norio-office/rich-text/ai-protocol'

const bridge = createRichTextAiBridge(editorRef.value!, { documentId: hostDocumentId })
const stop = bridge.onEvent(event => {
  if (event.type === 'ai-target-change') {
    activeTarget.value = event.target // null 表示标记已清除；宿主也应取消相应的模型请求。
  }
})
const handlers = createRichTextToolHandlers(bridge, {
  createDocument: async ({ title, bytes }) => {
    // 由宿主保存 .nordox 字节，并返回持久化后的文档 ID。
    return { documentId: await hostSaveDocument(title, bytes) }
  },
})
const definitions = getRichTextToolDefinitions()
// 将 definitions 和 handlers 中的同名函数注册到宿主 AI 运行时。

function beginAiEdit(userInstruction: string) {
  const target = bridge.getAiTarget()
  if (!target) throw new Error('请先选择 AI 编辑范围')
  const context = bridge.createEditContext({
    requestId: crypto.randomUUID(), instruction: userInstruction,
    scope: 'selection', targetId: target.targetId,
  })
  // 后续读取与局部修改只使用 context.contextId、context.targetRefs 等返回值。
  return context
}

// 宿主的“取消范围”按钮；编辑器正文点击和标记关闭按钮也会发出清除事件。
function clearRange() {
  if (activeTarget.value) {
    bridge.clearAiTarget({ targetId: activeTarget.value.targetId, reason: 'host-close' })
  }
}
// 文档页面卸载时：stop(); bridge.dispose()
```

Skill 指导 AI 使用 `richtext_get_capabilities`、`richtext_get_selection`、`richtext_read_target`、`richtext_apply_patch` 等工具；**工具必须由宿主实际注册和授权**。在单人模式和 Yjs 协作模式下均通过同一个 Bridge 执行局部编辑；协作模式还需要宿主原有的协同连接、权限和保存流程。运行时示例见 `examples/ai/browser/App.vue`，完整约束、流式预览和资源处理见 AI 接入指南及 [Skill 集成说明](https://github.com/cgq001/norio-office-rich-text-skill/blob/main/norio-rich-text/references/integration.md)。

**只生成/校验文件：**Node.js 20+ 环境安装兼容的 `@norio-office/rich-text` 后，在 Skill 目录运行：

```bash
node scripts/rich-text.mjs capabilities
node scripts/rich-text.mjs validate-document --input examples/basic-document.json
node scripts/rich-text.mjs create --input examples/basic-document.json --output result.nordox
```

CLI 不能直接修改打开的编辑器；在线编辑必须由宿主接通 Bridge 和工具处理函数。
