---
{"title":"实例方法参考","description":"实例方法参考的接口、使用示例与行为说明。","order":41,"reference":true}
---

本页按主题整理项目公开说明，供完成快速接入后查阅。代码片段中的业务回调、服务地址和存储实现需要由宿主提供。

## 公开方法

AI 接入见 AI接入.md。通过 `getAiAdapter()` 创建当前实例的 `createOfficeWordAiBridge()`；`@ai-target` 将选中内容或光标目标交给宿主，`@ai-target-change` 通知标记的变化。失焦不清除标记，内容区点击、关闭标记或宿主 `clearAiTarget()` 可清除。模型、聊天和文件存储由宿主负责。

`/ai-protocol` 导出 `getWordAiToolSchemas()` 和补丁 Schema；`/docx` 提供不加载 Vue 的浏览器/Node DOCX 读写入口。Skill 在组件仓库平级的 `packages/skills/norio-office-word` 单独交付。当前能力和边界以 Bridge 的 getCapabilities() 为准。

首版暂不将图表创建、数据／设置编辑和删除纳入正式 AI 能力，图表插入菜单保持隐藏。相关原生命令仅保留为内部实验实现，AI 不提供对应操作；已有文档中的图表源数据保留规则不变。

通过组件 `ref` 调用，接口类型为 `OfficeWordPublicApi`。下列四组共 28 个方法，包含业务方法和可选诊断方法。同步方法直接返回结果，异步方法返回 Promise。

### 文档与编辑：10 个方法

| 方法与参数 | 返回类型 | 说明 |
| --- | --- | --- |
| `getDocument()` | `OfficeWordDocument` | 同步读取当前已提交文档，并提交现有文字缓冲；不等待仍依赖点击命中的延后输入。 |
| `getDocumentAsync()` | `Promise<OfficeWordDocument>` | 等待已收到的延后输入完成后读取完整文档，适合持久化保存。读取期间文档被替换或组件被卸载时会拒绝 Promise。 |
| `setFileName(fileName: string)` | `void` | 外部修改当前文档名称，三种模式均可调用；去除首尾空白，非字符串、空名称或超过 255 字符抛出异常。有效的同名调用也会取消文件栏中的旧改名草稿，但不通知、不标脏；实际变化同步文档 `title`，触发文件名事件及常规文档变更／修改状态通知。 |
| `setDocument(document: OfficeWordDocumentInput)` | `void` | 加载、规范化并替换当前文档，重置相关编辑状态并安排排版；三种模式均可调用。该方法没有返回等待排版完成的 Promise。 |
| `focus()` | `void` | 编辑模式聚焦文字输入区域，预览模式聚焦文档以选择／复制，禁用模式不聚焦。 |
| `getEditor()` | `OfficeWordEditorLike` 或 `null` | 当前实现返回 `null`；接入时使用本页列出的组件方法。 |
| `getAiAdapter()` | `OfficeWordAiAdapter` | 供可信宿主创建当前实例的 AI Bridge；不要将原生命令端口暴露为模型工具。 |
| `updateFormField(fieldId: string, value: string \| boolean)` | `boolean` | 按标识更新表单域。字符串用于文本值，布尔值用于勾选状态；空标识返回 `false`。 |
| `updateProtectedRange(rangeId: string, value: string)` | `boolean` | 按标识更新受保护范围的文本；空标识返回 `false`，操作受文档权限约束。 |
| `updatePageSettings(attrs: OfficeWordPageSettingsUpdate)` | `boolean` | 更新页面设置，字段见下表。 |

三个更新方法的布尔返回值表示是否实际修改了文档；无变化时可能返回 `false`，命令被拒绝时也可能抛出异常。

`OfficeWordPageSettingsUpdate` 所有字段均可选，未指定的设置保留现值：

| 字段 | 类型 / 可选值 | 说明 |
| --- | --- | --- |
| `scope` | `'document'`、`'section'`、`'fromCurrent'` | 应用到整篇、指定 / 当前节、从当前节起；默认 `'document'`。 |
| `sectionIndex` | `number` | 节索引，从 0 开始；不传时根据当前选择位置解析。 |
| `size` | `'A4'`、`'Letter'`、`'custom'` | 纸张类型；自定义尺寸使用 `'custom'`。 |
| `width`、`height` | `string` 或 `number` | 页面宽、高，数字按像素处理，也可传 `'794px'` 这样的像素字符串。 |
| `orientation` | `'portrait'`、`'landscape'` | 纵向、横向。 |
| `marginTop`、`marginRight`、`marginBottom`、`marginLeft` | `string` 或 `number` | 四边页边距，单位为像素。 |
| `gutter` | `string` 或 `number` | 装订线宽度，单位为像素。 |
| `backgroundColor` | `string` 或 `null` | 页面背景颜色。 |
| `backgroundImageSrc` | `string` 或 `null` | 页面背景图片地址；`null` 清除图片。 |
| `backgroundImageName` | `string` 或 `null` | 背景图片名称。 |

```ts
const api = wordRef.value
if (!api) throw new Error('组件尚未就绪')

api.updatePageSettings({
  scope: 'document',
  size: 'A4',
  orientation: 'portrait',
  marginTop: 96,
  marginBottom: 96,
  marginLeft: 90,
  marginRight: 90,
})

const snapshot = await api.getDocumentAsync()
const json = JSON.stringify(snapshot)
// 将 json 保存到宿主自己的接口或存储。
```

### 文件名接入

文档只维护一个名称，存放在 `OfficeWordDocument.title`。顶部文件栏、文档读取结果、FILENAME 字段的名称来源及默认导出文件名均读取它；传入导出选项 `fileName` 只影响本次导出，不修改文档名称。菜单下载与 `exportWordBlob()` 的 DOCX 名称统一规范化：去掉已有的 Word 扩展名后追加一次 `.docx`，文件名中的 `\\ / : * ? " < > |` 替换为 `-`，连续空白合并；顶部名称仍保留用户输入。

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import { OfficeWord, type OfficeWordPublicApi, type OfficeWordFileNameChangePayload } from '@norio-office/office-word'
// fontUrls 沿用上文四个字体文件的配置。
const wordRef = shallowRef<OfficeWordPublicApi | null>(null)
function handleFileNameChange({ fileName, previousFileName }: OfficeWordFileNameChangePayload) {
  console.log(previousFileName, fileName)
}
function rename() {
  wordRef.value?.setFileName('劳动合同')
}
</script>

<template>
  <button @click="rename">外部改名</button>
  <OfficeWord ref="wordRef" :font-urls="fontUrls" title="新建文档"
    mode="edit" :show-file-header="true" @file-name-change="handleFileNameChange" />
</template>
```

内部改名与 `setFileName()` 共用原生命令及撤销历史；只有编辑模式开放撤销／重做交互。外部改名、文档替换或隐藏文件栏会取消旧改名草稿，避免失焦后覆盖当前名称。

文件名事件在当前提交结束后的微任务通知，每次实际名称变化分别保留；回调中可再次调用 `setFileName()`。完整文档的 `change`／`update:modelValue` 仍遵循快照发布时机，不保证与该事件同时发出。不要用 `change` 手工维护另一套文件名。使用 `v-model` 回传组件快照（包括 JSON 克隆）不会重复触发改名。

这些规则在三种模式下一致。`preview`／`disabled` 不响应撤销、重做的编辑交互；外部 `setFileName()` 仍进入原生历史，返回 `edit` 后可撤销、重做，并正常回传名称及变更事件。通过 `v-model` 传入真正不同的文档（即使版本字段相同）视为文档替换；成功导入和文档替换会重置旧撤销历史，不能撤销回导入前的文件。失败或取消导入不改变当前名称。

`exportWordBlob()` 返回的默认名称与 Blob 内容取自同一份完成准备的导出快照；导出期间发生新的改名、导入或正文修改，不会把新名称混到旧内容上，也不会将更新后的文档误标为已保存。导出选项在调用时捕获，等待期间修改选项不会改变本次文件名。

### 导入：4 个方法

| 方法与参数 | 返回类型 | 说明 |
| --- | --- | --- |
| `importFile(file: File)` | `Promise<OfficeWordImportState>` | 导入文件，返回最终状态。解析失败、取消等通常通过返回状态表达；授权失败仍会抛出异常。 |
| `importWordBlob(file: Blob \| File, options?: { fileName?: string })` | `Promise<void>` | 导入文件或二进制内容。`fileName` 指定名称；Blob 没有名称时建议传入。导入失败或取消会抛出 `DocxImportError`。 |
| `getImportState()` | `OfficeWordImportState` | 读取当前导入状态的副本，可用于展示进度。 |
| `cancelImport()` | `void` | 请求取消当前导入，最终结果为取消状态；取消不是立即完成的异步任务返回值。 |

支持 DOCX 和 HTML 内容形式的 `.doc`；旧版二进制 `.doc` 不支持直接导入。导入名称取实际文件名（或 Blob 选项 `fileName`）去掉 `.docx`／`.doc` 扩展名，DOCX 与 HTML DOC 使用同一规则。成功解析后才替换当前文档。公开的 `importFile()`／`importWordBlob()` 在三种模式均可调用，仍受 `importWord` 授权、文件安全限制和任务取消约束；界面导入只在编辑模式开放，期间切换模式会使该界面请求失效。组件同一时间管理一个导入任务，发起新任务会请求取消前一个任务。

`OfficeWordImportState` 返回字段：

| 字段 | 类型 / 可选值 | 说明 |
| --- | --- | --- |
| `status` | `'idle'`、`'reading'`、`'importing'`、`'preparing'`、`'success'`、`'error'`、`'cancelled'` | 空闲、读取、解析、准备、成功、失败、取消。 |
| `code` | `DocxImportErrorCode` 或 `null` | 错误 / 取消代码；正常状态通常为 `null`。 |
| `message` | `string` | 状态说明。 |
| `progress` | `number` 或 `null` | 0～100 的进度值；无确定进度时为 `null`。 |

```ts
const api = wordRef.value
if (!api) throw new Error('组件尚未就绪')

// file 来自文件选择器，类型为 File。
const state = await api.importFile(file)
if (state.status !== 'success') {
  console.error(state.code, state.message)
}

// sourceBlob 来自下载接口或宿主存储，类型为 Blob。
await api.importWordBlob(sourceBlob, { fileName: '合同.docx' })
```

### 导出：6 个方法

| 方法与参数 | 返回类型 | 说明 |
| --- | --- | --- |
| `exportDocxBlob(options?)` | `Promise<Blob>` | 生成 DOCX 内容，选项为 `{ complexObjectSecurityPolicy?: OfficeWordComplexObjectExportSecurityPolicy }`。 |
| `exportWordBlob(options?)` | `Promise<OfficeWordBlobExportResult>` | 生成 DOCX 内容及文件信息，选项为 `{ type?: 'docx'; fileName?: string }`，`type` 默认 `'docx'`。 |
| `exportPdfBlob()` | `Promise<Blob>` | 生成 PDF 内容。 |
| `exportImageBlobs(options?)` | `Promise<Array<{ page: number; blob: Blob }>>` | 逐页生成 SVG 图片，与 `exportSvgBlobs()` 的输出格式一致。 |
| `exportSvgBlobs(options?)` | `Promise<Array<{ page: number; blob: Blob }>>` | 逐页生成 SVG 图片。 |
| `exportPngBlobs(options?)` | `Promise<Array<{ page: number; blob: Blob }>>` | 逐页生成 PNG 图片，需要浏览器画布环境。 |

导出方法会自行准备需要的文档和排版结果，无需先调用诊断方法。导出不会自动生成兼容性检查报告，也不会弹出检查确认框。公开方法返回文件内容，不会自动下载或上传；宿主负责保存、下载或上传这些结果。

`OfficeWordBlobExportResult` 的字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `blob` | `Blob` | DOCX 二进制内容。 |
| `fileName` | `string` | 规范化的 `.docx` 文件名，默认取当前文档 `title`；显式选项优先。 |
| `mimeType` | `string` | 固定为 `application/vnd.openxmlformats-officedocument.wordprocessingml.document`。 |
| `size` | `number` | 文件字节数，与 `blob.size` 一致。 |

三个逐页图片方法共享以下可选参数：

| 字段 | 类型 / 可选值 | 默认行为 |
| --- | --- | --- |
| `pages` | `number[]` | 导出全部页面；传入页码从 **1** 开始，如 `[1, 3]`。只接受正整数；没有有效正整数时按全部页面处理。 |
| `watermarkMode` | `'default'`、`'custom'`、`'none'` | 默认 `'default'`。当前实现将其写入 SVG 的水印模式标识，不过滤已有水印绘制项；水印内容由文档的 `watermark` 设置决定。 |
| `scale` | `number` | 缩放倍数，默认 1，用于图片输出尺寸；非正数或非有限值按 1 处理。 |

每项返回的 `page` 是原文档页码，从 1 开始。有效页码超出文档范围时不会生成对应项。

```ts
const api = wordRef.value
if (!api) throw new Error('组件尚未就绪')

const result = await api.exportWordBlob({
  type: 'docx',
  fileName: '合同.docx',
})

// 上传到业务接口。
const formData = new FormData()
formData.append('file', result.blob, result.fileName)

const pdf = await api.exportPdfBlob()
const images = await api.exportPngBlobs({ pages: [1], scale: 2 })
```

`exportDocxBlob()` 的复杂对象选项按对象类型配置；没有指定时使用默认策略：

| `complexObjectSecurityPolicy` 字段 | 可选值 | 默认值与含义 |
| --- | --- | --- |
| `chart` | `'preserve'` | 保留图表源数据。 |
| `smartart` | `'preserve'` | 保留 SmartArt 源数据。 |
| `ole` | `'preserve-disabled'` | 保留对象源数据，编辑器内不激活对象。 |
| `macro` | `'preserve-disabled'`、`'strip'` | 默认保留源数据且不执行；`'strip'` 移除。 |
| `signature` | `'mark-invalid'`、`'strip'` | 默认标记编辑导出后的签名失效；`'strip'` 移除签名数据。 |

### 诊断：8 个方法

这些方法用于业务诊断、测试或监测。普通加载、编辑、保存和导出不要求调用。

| 方法与参数 | 返回类型 | 说明 |
| --- | --- | --- |
| `getLastCommandEnvelope()` | `OfficeWordCommandEnvelopeSnapshot` 或 `null` | 最后一次命令的标识、来源、模型版本、权限及撤销策略等信息；没有记录时为 `null`。 |
| `getLastCommandTransaction()` | `OfficeWordCommandTransactionSnapshot` 或 `null` | 最后一次命令事务结果，包括修改前后版本、状态、错误码和时间。 |
| `getLayoutDebugState()` | `OfficeWordLayoutDebugState` 或 `null` | 提交文字缓冲并刷新排版后读取布局调试信息；该调用会触发排版工作。 |
| `getAuthoritativeLayoutDebugState(options?)` | `OfficeWordAuthoritativeLayoutDebugState` | 读取当前权威排版、交互目标、画面呈现、画布能力及几何证据等状态，额外明细按选项返回。 |
| `flushLayoutBeforeExport()` | `Promise<OfficeWordExportFlushSnapshot \| null>` | 提交已收到的输入并准备排版，返回导出布局快照；各导出方法内部已执行相应准备。 |
| `getLastExportFlushSnapshot()` | `OfficeWordExportFlushSnapshot` 或 `null` | 最近一次导出排版准备的文档、排版、字体版本和页面统计快照。 |
| `getLastExportPreflight()` | `OfficeWordExportPreflightReport` 或 `null` | 最近一次手动生成的兼容性诊断报告；未手动生成时为 `null`。 |
| `prepareExportPreflight(format, complexObjectSecurityPolicy?)` | `OfficeWordExportPreflightReport` | 手动生成并保存诊断报告，不执行导出，也不显示确认弹窗。`format` 可为 `'docx'`、`'doc'`、`'pdf'`、`'image'`、`'svg'`、`'png'`；第二个参数类型为 `OfficeWordComplexObjectExportSecurityPolicy`。 |

`getAuthoritativeLayoutDebugState()` 的全部可选参数：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `includeInteractionCarets` | `boolean` | 返回完整交互光标几何信息。 |
| `includePageItemCounts` | `boolean` | 返回页面内容项统计和几何指纹。 |
| `includeSceneItemId` | `string` | 返回指定标识的场景绘制项。 |
| `includeDisplayItemId` | `string` | 返回指定标识的显示列表项及匹配明细。 |
| `includePageSceneItems` | `boolean` | 返回各页完整场景绘制项。 |

不传这些参数时只返回默认诊断信息。`presentation.settled` 可用于诊断画面呈现是否已经完成；不要用 `ready` 事件替代该状态的判断。
