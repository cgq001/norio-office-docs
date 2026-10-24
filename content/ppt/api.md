---
{"title":"参数、事件与方法","description":"参数、事件与方法的接口、使用示例与行为说明。","order":40,"reference":true}
---

本页按主题整理项目公开说明，供完成快速接入后查阅。代码片段中的业务回调、服务地址和存储实现需要由宿主提供。

## 组件 Props

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `modelValue` | `OfficePptDeck \| null` | `null` | 当前完整 PPT 数据，支持 `v-model` |
| `mode` | `'edit' \| 'preview' \| 'disabled'` | `'edit'` | 运行模式，控制编辑权限、菜单及工具栏；不控制文件头显示 |
| `showFileHeader` | `boolean` | `true` | 是否显示最上方的文件图标、文档名称与保存状态栏；与 `mode` 独立 |
| `fastLoad` | `boolean` | `false` | 快速加载：跳过内嵌字体解码与浏览器加载，保留字体名称、元数据和原始资源，PPTX 导出不删除字体 |
| `title` | `string` | `'演示文稿'` | 无 `modelValue` 时的初始名称；之后主动改变此属性可修改当前文档名称。已加载文档初始以 `modelValue.title` 为准 |
| `modelUpdateTiming` | `'sync' \| 'animation-frame'` | `'animation-frame'` | `update:modelValue` 的触发时机 |
| `changeTiming` | `'sync' \| 'animation-frame'` | `'animation-frame'` | `change` 事件的触发时机 |
| `persistence` | `OfficePptComponentPersistenceOptions` | `undefined` | 文档加载、保存、自动保存及崩溃恢复配置 |
| `featureCodes` | `OfficePptFeatureCode[] \| null` | `null` | 授权功能码白名单，控制组件内导入、导出入口是否显示 |

大型 PPT 默认在浏览器绘制帧之后触发 `update:modelValue` 和 `change`，可减少输入或拖动时的主线程压力。只有外部业务必须立即收到变化时，才建议使用 `sync`。

### 快速加载与字体保留

```vue
<!-- 默认 false：优先加载原文档的内嵌字体 -->
<OfficePpt v-model="deck" :fast-load="true" />
```

`fastLoad` 仅跳过当前编辑器对内嵌字体的解码、注册和加载，不删除字体名称、字体元数据或 PPTX 内的字体字节，也不跳过幻灯片、图片等内容解析。开启后使用浏览器已有字体或替代字体，可能出现文字换行、排版差异。可动态切换：开启时取消尚未完成的字体加载并移除本组件已注册的字体；关闭时重新尝试加载原字体。无内嵌字体的文档不受影响。

PPTX 导出和持久化保存直接保留原始字体资源，不为保留字体重新解码，也不等待编辑器字体加载完成。保留字体仍占用输出体积和文件打包时间；未修改的源文档可直接复用原包，修改后按现有增量保留逻辑重新打包。此选项不承诺图片/PDF 导出提速，也不保证替代字体与原字体的显示一致。

### 文件头与运行模式

`showFileHeader` 只控制文档名称栏；隐藏文件头不会隐藏编辑模式下的菜单、工具栏，也不会修改名称或文档内容。`mode="preview"` / `mode="disabled"` 不会隐式改变 `showFileHeader`；文件头即便显示，也不能在组件内编辑名称。

| 行为 | `edit` | `preview` | `disabled` |
| --- | --- | --- | --- |
| 文件图标、名称和保存状态栏 | 由 `showFileHeader` 决定 | 同左 | 同左 |
| 组件内修改文件名 | 允许，受定稿/编辑保护约束 | 禁止 | 禁止 |
| 顶部菜单、工具栏 | 显示 | 隐藏 | 隐藏 |
| 属性侧栏、浮动编辑工具、备注输入及编辑右键菜单 | 按当前功能显示 | 隐藏 | 隐藏 |
| 内容、格式和结构编辑 | 允许，受文档保护约束 | 禁止 | 禁止 |
| 内容选择、复制 | 允许 | 允许 | 禁止 |
| 翻页、缩放等查看交互 | 允许 | 允许 | 禁止组件内交互 |
| 底部信息栏放映、F5 / Shift+F5 | 允许 | 允许 | 禁止；切入此模式立即结束已有放映 |

```vue
<!-- 隐藏文件头，但保留完整编辑菜单 -->
<OfficePpt v-model="deck" mode="edit" :show-file-header="false" />
<!-- 文件头可见且名称不可编辑；允许复制和底部放映 -->
<OfficePpt v-model="deck" mode="preview" />
<!-- 无文件头、无编辑菜单，禁止选择、复制和放映 -->
<OfficePpt v-model="deck" mode="disabled" :show-file-header="false" />
```

`mode` 支持运行时切换，离开编辑模式前会提交正在输入的画布文字、表格单元格和备注。`addSlide`、`duplicateSlide`、`removeSlide`、`reorderSlide` 在非编辑模式或文档保护下抛出错误，`undo` / `redo` 返回 `false`，AI Bridge 拒绝写入。

模式限制组件内交互和编辑，不限制宿主加载或读取数据：`setDeck`、`importPptx`、持久化加载、读取和导出接口仍可使用；`setActiveSlide` 仍可由宿主导航。`setFileName` 是宿主主动设置名称的接口，在三个模式下均可调用，仍走正常文档命令及协作权限校验。禁用复制不是防泄漏或服务端鉴权机制。

组件对外不再提供 `readonly` 属性，也没有兼容映射；请直接使用 `mode`。

### 外部文档名称与文件名通知

文档名称以 `deck.title` 为唯一来源，文件头显示、保存快照及默认导出名称使用同一份值。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { OfficePpt, type OfficePptPublicApi, type OfficePptFileNameChangePayload } from '@norio-office/office-ppt'

const editorRef = ref<OfficePptPublicApi | null>(null)
const initialTitle = ref('业务汇报')
function renameFromHost() {
  editorRef.value?.setFileName('季度业务汇报')
}
function handleFileNameChange({ fileName, previousFileName }: OfficePptFileNameChangePayload) {
  // 同步宿主页签、文件列表或业务元数据；是否请求服务端由宿主决定。
  console.log(previousFileName, fileName)
}
</script>

<template>
  <OfficePpt ref="editorRef" :title="initialTitle" @file-name-change="handleFileNameChange" />
</template>
```

`title` 用于新文档初始化，已有 `modelValue` 时不会在挂载时覆盖其名称；之后显式改变 `title` 属性与调用 `setFileName()` 一样，会更新当前文档。不要把旧的初始化标题持续回写覆盖文档名称。

名称会去除首尾空白，不能为空，最长 255 个字符；`setFileName()` 传入无效值时抛出错误，不修改文档。同名设置不会产生重复事件或撤销记录。内部 Enter / 失焦提交改名后、宿主 API 或动态 `title` 改名后，都会更新快照并发送常规 `change` / `update:modelValue`。专用 `file-name-change` 在实际名称变化时逐次通知，也覆盖撤销、重做、文档加载/替换和远端同步造成的名称变化；初始挂载不触发。只隐藏文件头或取消未提交的名称草稿不触发事件。

### featureCodes 授权入口

`featureCodes` 与 Excel 组件保持相同的白名单语义：不传或传空数组时，下面四个受授权控制的入口均不显示；传入哪个功能码，就显示哪个入口。

| 功能码 | 对应入口 |
| --- | --- |
| `exportPPT` | 导出幻灯片 |
| `importPPT` | 导入 PPT |
| `exportImage` | 导出图片 |
| `exportPDF` | 导出 PDF |

该配置只控制组件内置按钮的显示，不删除 `importPptx`、`exportPptx`、`exportPptBlob` 等实例 API，便于宿主系统自行组织界面和授权流程。


## 组件事件

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| `update:modelValue` | `OfficePptDeck` | `v-model` 更新事件 |
| `change` | `OfficePptChangePayload` | 文档发生初始化、用户编辑、API 修改或导入时触发 |
| `file-name-change` | `OfficePptFileNameChangePayload` | 实际文档名称变化时触发，参数为 `{ fileName, previousFileName }` |
| `saveStateChange` | `OfficePptPersistenceState` | 保存状态发生变化时触发 |

模板中使用 kebab-case 监听保存状态：

```vue
<OfficePpt @save-state-change="handleSaveStateChange" />
```

保存状态 `status` 可能为：`dirty`、`saving`、`saved`、`error`、`conflict`。


## 通过 ref 调用编辑器

```ts
import { ref } from 'vue'
import type {
  OfficePptPersistencePublicApi,
  OfficePptPublicApi,
} from '@norio-office/office-ppt'

type EditorApi = OfficePptPublicApi & OfficePptPersistencePublicApi
const editorRef = ref<EditorApi | null>(null)
```

编辑器方法：

| 方法 | 返回值 | 说明 |
| --- | --- | --- |
| `getDeck()` | `OfficePptDeck` | 获取当前 PPT 数据副本 |
| `setDeck(deck)` | `void` | 替换当前 PPT 数据 |
| `setFileName(fileName)` | `void` | 宿主设置当前文档名称，同时更新快照并通知 `file-name-change`；输入须为非空且不超过 255 字符的字符串 |
| `addSlide()` | `OfficePptSlide` | 新建幻灯片 |
| `duplicateSlide(slideId?)` | `OfficePptSlide \| null` | 复制幻灯片 |
| `removeSlide(slideId?)` | `void` | 删除幻灯片 |
| `reorderSlide(slideId, targetIndex)` | `void` | 调整幻灯片顺序 |
| `setActiveSlide(slideId)` | `void` | 切换当前幻灯片 |
| `undo()` | `boolean` | 撤销 |
| `redo()` | `boolean` | 重做 |
| `importPptx(input)` | `Promise<void>` | 导入 `Blob` 或 `ArrayBuffer` |
| `exportPptx(options?)` | `Promise<Blob>` | 导出 PPTX |
| `exportPptBlob(options?)` | `Promise<ExportPptBlobResult>` | 生成带文件信息的 PPTX Blob，不触发浏览器下载 |

配置持久化后还可使用：

| 方法 | 说明 |
| --- | --- |
| `getPersistenceState()` | 获取当前保存状态 |
| `save()` | 立即保存 |
| `retrySave()` | 重试失败的保存 |
| `loadDocument()` | 从适配器加载文档 |
| `restoreRecovery()` | 恢复崩溃恢复快照 |
| `exportRecoveryPptx()` | 将恢复快照导出为 PPTX |
| `saveCopy(documentId)` | 另存为指定文档 ID |
