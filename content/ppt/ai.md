---
{"title":"AI 局部修改 · 实施中","description":"使用当前组件的 Bridge，明确目标、预览与事务边界。","order":30}
---

> **尚未完整验收。** 当前已提供 `/ai`、`/ai-protocol` 和 `getAiBridge()`，但全量功能、参数和真实宿主场景仍需验收。打包成功不等于完整 AI 验收通过。当前 AI 与协作的组合不支持。

## 1. 连接当前演示文稿

`aiEnabled` 默认关闭。宿主开启入口后，将请求交给已有 AI 面板：

```vue
<OfficePpt ref="editorRef" v-model="deck" ai-enabled
  @ai-request="openHostAiPanel" />
```

`openHostAiPanel` 由宿主实现，接收当前 Bridge 和目标。也可以在组件已挂载后获取：

```ts
const api = editorRef.value
if (!api) throw new Error('编辑器尚未就绪')
const bridge = await api.getAiBridge()
```

不要新建 runtime，也不要通过导出后重建整稿或 `setDeck()` 实现局部修改。

## 2. 示例：替换选中的标题文字

以下接续上面的 `bridge`，要求用户已冻结一个文字目标。该示例直接使用固定文字，用于说明 Bridge 调用流程；真实模型应返回当前操作 Schema 允许的参数。

```ts
const target = await bridge.captureTarget()
if ('code' in target) throw new Error(target.message)
if (target.kind !== 'text') throw new Error('请先选择要修改的文字')

const prepared = await bridge.prepare({
  contextId: crypto.randomUUID(),
  protocolId: bridge.getState().protocolId,
  writeTargetRefs: [target.targetRef],
  operations: ['replaceTextRange'],
})
if ('code' in prepared) throw new Error(prepared.message)

const patch = {
  preparationId: prepared.preparationId,
  operations: [{
    operation: 'replaceTextRange',
    targetRef: target.targetRef,
    parameters: { text: '季度业务计划' },
  }],
}
const preview = await bridge.preview(patch)
if ('code' in preview) throw new Error(preview.message)
// 宿主可在此展示 preview.changes；本例使用固定文案直接继续。
const receipt = await bridge.apply(patch)
if ('code' in receipt) throw new Error(receipt.message)
```

成功写入是一个原生撤销单元，回执不表示已保存原文件。若预览后文档改变，重新读取和准备，不要复用旧授权。

## 3. 为什么目标必须严格

同批前一个操作改变文字后，后续操作不能继续使用该容器旧字符范围。即使替换后长度相同，也可能返回 `stale-target` 并拒绝整个批次。应在同一授权范围内合并成一次替换，或重新捕获并接受两次提交边界。

PPT 字号使用 pt，文字范围使用 UTF-16 半开区间，页面位置和尺寸使用未缩放的逻辑单位。不要把 CSS 像素、对象数组下标或编辑器缩放倍率直接当参数。

## 4. 宿主仍需提供什么

模型与工具调度、资源白名单、文件身份、保存和取消流程均由宿主提供。`discover()` 和 `methods()` 用于按需了解实际能力，不能凭命令名称猜测参数。

完整的领域目标、资源、生命周期、单位和验收范围见 [AI 协议与能力边界](/ppt/ai-reference/)。
