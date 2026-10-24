---
{"title":"AI 局部修改","description":"绑定当前 Word 实例，按真实范围读取、授权和修改。","order":30}
---

Word AI 用于修改授权范围内的文字、格式和支持的结构。组件提供目标按钮、Bridge 与协议，模型请求、聊天和文件保存由宿主负责。

## 1. 绑定当前实例

沿用快速开始中的 `wordRef` 和 `fontUrls`，在组件就绪后创建 Bridge：

```ts
import { createOfficeWordAiBridge } from '@norio-office/office-word/ai'

function connectAi() {
  const api = wordRef.value
  if (!api) throw new Error('编辑器尚未就绪')
  return createOfficeWordAiBridge(api.getAiAdapter())
}
```

```vue
<OfficeWord ref="wordRef" v-model="document" :font-urls="fontUrls"
  @ai-target="attachToHostAi" />
```

`attachToHostAi` 是你实现的业务回调，用于把冻结目标交给自己的 AI 面板。默认显示的目标按钮不会调用模型。不要为同一文档另外创建一套编辑器 runtime。

## 2. 明确目标与权限

`ai-target` 包含目标 ID、文档代次、版本、文字故事及选区信息。失焦和滚动不会让冻结范围漂移；点击正文或关闭标记可清除目标。

先通过 `getCapabilities()` 读取当前能力，再用 `createEditContext()` 分别指定来源、写入、插入目的地以及允许的操作。正文、页眉、页脚、脚注等属于不同文字故事，读取正文不代表已读取整个文件的所有内容。

## 3. 预览并提交

模型返回符合当前 Schema 的操作后，用 `previewPatch()` 查看隔离候选，再用 `applyPatch()` 走当前实例的原生命令提交。不要把预览返回的文档传给 `setDocument()`；这会绕开局部事务语义。

例如“把选中的合同条款缩短”只授权对应文字。若还要改变全篇页面设置，应创建独立的授权和提交，而不是借局部文本权限修改文档设置。

## 4. 保存和取消

提交成功会进入原生撤销历史，但仍需要宿主保存。取消任务时调用 `cancelContext` 并停止模型请求；内容或权限发生变化后重新获取目标。服务入口中的保存、另存等文件动作返回 `host-required` 契约，由宿主执行。

## 支持范围

当前范围按 `getCapabilities()` 的 Schema 与 writes 信息判断。正文文字、段落、列表等能力与非正文写入范围不同；复杂结构、仅保留对象或未支持写入会被明确拒绝。

正式 AI 能力不包括图表创建、数据/设置编辑和删除。图片资源必须先授权，再由可信解析器提供字节；不接受模型随意指定本机路径或长期 Blob URL。

完整协议、单位、读取预算及资源规则见 [AI 协议与能力边界](/word/ai-reference/)。多人协作另需 [Docker 版本](/guide/collaboration/)并验证与当前 Bridge 的组合。
