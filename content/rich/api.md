---
{"title":"参数、事件与方法","description":"参数、事件与方法的接口、使用示例与行为说明。","order":40,"reference":true}
---

本页按主题整理项目公开说明，供完成快速接入后查阅。代码片段中的业务回调、服务地址和存储实现需要由宿主提供。

## Props

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `modelValue` | `JSONContent \| null` | `null` | 编辑器 JSON，支持 `v-model`；`null` 不表示清空，见上方示例。 |
| `documentName` | `string` | `''` | 文档名称，用作 `.nordox` 导出时的标题；PDF、图片、HTML 的下载文件名由宿主决定。 |
| `mode` | `'edit' \| 'preview'` | `'edit'` | 编辑模式或预览模式。 |
| `showToolbar` | `boolean` | `true` | 编辑状态下是否显示顶部工具栏。预览状态下始终隐藏。 |
| `showAiTargetButton` | `boolean` | `false` | 在工具栏末尾显示 AI 编辑目标按钮；需宿主创建 Bridge 并订阅目标事件。预览状态下隐藏。 |
| `watermark` | `RichTextEditorWatermarkOptions \| null` | `null` | 文档页面文本水印配置；不传或 `text` 为空时不显示水印。 |
| `showOutline` | `boolean` | `true` | 是否启用内置大纲及贴边入口，面板默认收起。设为 `false` 后可以配合外部 `RichTextOutline` 组件自行放置目录。 |
| `outlinePlacement` | `'left' \| 'right'` | `'right'` | 大纲面板位置。 |
| `messages` | `RichTextEditorMessages \| null` | `null` | 覆盖内置 UI 文案。 |
| `featureCodes` | `RichTextEditorCode[] \| null` | `null` | 受控入口的统一白名单，适用边界见下方说明。Vue 模板中写作 `feature-codes`。 |
| `enabledFeatureItems` | `RichTextEditorFeatureItemKey[] \| null` | `null` | 旧版高级功能白名单；未传 `featureCodes` 时生效，支持旧的 `outline`。 |
| `enabledExportItems` | `RichTextEditorExportItemKey[] \| null` | `undefined` | 兼容保留的旧版参数；内置导出/打印入口已移除，不影响实例导出方法。 |
| `enabledInsertMenuItems` | `RichTextEditorInsertMenuItemKey[] \| null` | `undefined` | 旧版插入菜单白名单；未传 `featureCodes` 时兼容生效。 |
| `enabledToolbarActions` | `RichTextEditorToolbarActionKey[] \| null` | `undefined` | 旧版工具栏能力白名单；未传 `featureCodes` 时兼容生效。 |
| `placeholder` | `string` | `''` | 空内容占位文案。 |
| `mention` | `boolean` | `false` | 是否启用 `@` 提及功能；只有设为 `true` 时输入 `@` 才会打开候选面板，`insertMention()` 才会插入提及节点。 |
| `collaboration` | `RichTextEditorCollaborationOptions \| null` | `undefined` | Yjs 协同配置，在组件创建时使用。 |
| `uploadImage` | `RichTextEditorUploadHook \| null` | `null` | 内置图片选择、图片块上传时调用；返回最终可访问 URL 后组件插入图片。 |
| `uploadVideo` | `RichTextEditorUploadHook \| null` | `null` | 内置视频选择、视频块上传时调用；返回最终可访问 URL 后组件插入视频。 |
| `uploadFile` | `RichTextEditorUploadHook \| null` | `null` | 本地文件选择器上传时调用；返回最终可访问 URL 后组件插入文件卡片。 |
| `onUploadError` | `RichTextEditorUploadErrorHandler \| null` | `null` | 上传失败回调；同时也会触发 `upload-error` 事件。 |
| `mentionProvider` | `RichTextEditorMentionProvider \| null` | `undefined` | `@` 提及候选数据提供函数，兼容用法。 |
| `onMentionSearch` | `RichTextEditorMentionProvider \| null` | `undefined` | `@mention-search` 函数式事件对应的异步候选加载函数；优先于 `mentionProvider`。 |
| `comments` | `RichTextEditorCommentThread[] \| null` | `null` | 评论列表，由业务保存并回传；不写入正文 JSON。 |
| `commentUser` | `RichTextEditorCommentUser \| null` | `null` | 当前评论用户；未传时尝试从协同用户中获取，两者都不可用则不能新建或回复。 |
| `showComments` | `boolean` | `false` | 显示评论入口和侧栏；使用功能白名单时还需包含 `comments`。 |
| `commentMention` | `boolean` | `true` | 评论输入框中的提及开关，与正文 `mention` 独立；白名单还需包含 `mention`。 |
| `uploadCommentImage` | `RichTextEditorUploadHook \| null` | `null` | 评论图片上传；未传时回退到 `uploadImage`。 |
| `commentMentionProvider` | `RichTextEditorCommentMentionProvider \| null` | `null` | 评论提及候选加载函数，与正文候选独立。 |
| `onCommentMentionSearch` | `RichTextEditorCommentMentionProvider \| null` | `null` | 评论候选加载函数的另一种传法；优先于 `commentMentionProvider`。 |

`featureCodes` 不传或为 `null` 时回退到对应的旧版白名单；旧版也未配置时，不限制这些受控功能。评论、正文提及和协同仍需各自的配置。传数组后，优先于仍有界面入口的旧版白名单；传 `[]` 表示不开放受白名单控制的入口。比如 `['image']` 保留插入菜单里的图片入口。导出和打印不再提供内置界面入口，`pdf`、`html`、`print` 代码仅为兼容旧配置保留，实例导出方法不受这些代码限制。

表中的 `undefined` 表示组件没有给该可选 prop 设置显式默认值，即“未传入”；这些配置传 `null` 同样按未配置处理，白名单会继续使用对应的旧版配置（若有）。

这里的“授权码”是前端功能开关，不是安全权限：基础文字格式仍可使用，当前句柄的插入/转换菜单、拖拽上传和多数实例方法没有统一按此数组过滤，也不会删除文档已有节点。业务权限、上传权限和保存权限需要在业务层及后端校验。新项目建议统一使用 `feature-codes`，不要依赖它实现严格的编辑权限隔离。


## 事件

| 事件 | Payload | 说明 |
| --- | --- | --- |
| `update:modelValue` | `JSONContent` | 内容更新，用于 `v-model`。 |
| `change` | `JSONContent` | 内容更新事件。 |
| `local-file-upload` | `RichTextEditorLocalFilePayload` | 用户通过本地文件选择器插入文件后触发。 |
| `local-file-click` | `RichTextEditorLocalFilePayload` | 用户点击本地文件卡片非下载按钮区域时触发。 |
| `local-file-download` | `RichTextEditorLocalFilePayload` | 用户点击本地文件卡片下载按钮时触发。 |
| `upload-error` | `RichTextEditorUploadErrorPayload` | 图片、视频或文件上传 hook 失败时触发。 |
| `mention-search` | `RichTextEditorMentionProviderPayload` | 函数式监听写法，对应 `onMentionSearch` prop；输入 `@` 后加载候选数据，可返回数组或 `Promise`。 |
| `mention-item-click` | `RichTextEditorMentionItem` | 点击弹窗候选项或已插入的提及节点时触发。 |
| `mention-submit` | `RichTextEditorMentionItem` | 点击弹窗 `提及` 按钮并插入提及节点后触发。 |
| `outline-change` | `RichTextEditorOutlineState` | 大纲条目或当前激活位置更新；可用 `@outline-change` 获取 `{ items, activePos }`。 |

`mention-search` 没有出现在组件的 `defineEmits` 中；Vue 模板里的 `@mention-search="handler"` 会作为 `onMentionSearch` 函数式 prop 传入组件。

评论的创建、回复、删除等事件单独列在评论事件中。正文提及加载函数可以返回候选数组；评论的 `@comment-mention-search` 是通知事件，返回值不会被用作候选数据，务必使用对应的 provider prop。


## 实例 API

通过 Vue `ref` 获取组件实例方法：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { RichTextEditor } from '@norio-office/rich-text'
import type { RichTextEditorInstance } from '@norio-office/rich-text'

const editorRef = ref<RichTextEditorInstance | null>(null)
</script>

<template>
  <RichTextEditor ref="editorRef" />
</template>
```

可用方法：

| 方法 | 返回值 | 说明 |
| --- | --- | --- |
| `exportPdf()` | `Promise<Blob \| null>` | 导出 PDF。 |
| `exportImage(options?)` | `Promise<Blob \| null>` | 导出图片，支持 PNG/JPEG。 |
| `exportHtml()` | `string \| null` | 导出 HTML 字符串。 |
| `insertImage(payload)` | `boolean` | 插入 1 到 4 张图片。 |
| `insertVideo(payload)` | `boolean` | 插入视频块。 |
| `insertFile(payload)` | `boolean` | 插入链接/文件预览块。 |
| `insertLocalFile(payload)` | `boolean` | 插入本地文件卡片。 |
| `insertMention(payload)` | `boolean` | 插入一个结构化行内提及节点；`mention` 未开启时返回 `false`。 |
| `openLocalFilePicker()` | `void` | 打开本地文件选择器。 |
| `focus()` | `void` | 聚焦编辑器。 |
| `getJSON()` | `JSONContent \| null` | 获取当前 JSON 内容。 |
| `getText()` | `string` | 获取当前纯文本内容，不包含 HTML 标签。 |
| `getImages()` | `RichTextEditorImagePayload[]` | 获取文档内所有图片信息。 |
| `getVideos()` | `RichTextEditorVideoPayload[]` | 获取文档内所有视频信息。 |
| `getFiles()` | `RichTextEditorCollectedFilePayload[]` | 获取文档内所有文件信息；`kind: 'file'` 表示链接/文件预览块，`kind: 'local-file'` 表示本地文件卡片。 |
| `getOutlineItems()` | `RichTextEditorOutlineItem[]` | 获取当前目录项。 |
| `getActiveOutlinePos()` | `number \| null` | 获取当前激活目录项的文档位置。 |
| `focusOutlineItem(pos)` | `boolean` | 聚焦并跳转到指定目录项。 |
| `onOutlineChange(handler)` | `() => void` | 监听目录变化，返回取消监听函数。 |
| `focusCommentThread(threadId)` | `boolean` | 跳转到指定评论锚点；找不到时返回 `false`。 |

媒体插入 API 的位置规则很重要：`insertImage()`、`insertVideo()`、`insertFile()`、`insertLocalFile()` 不会插到一句话的中间。光标所在文本块非空时，在该块前插入并保留原文；为空或只有空白时，替换这个占位块；块级选区则按选区起点插入。若要插到指定位置，先让用户在目标空段落中放置光标再调用。图片数组超过 4 项只取前 4 项。`insertMention()` 则是在当前选区插入行内提及。

这些媒体方法只接收已经上传好的地址，不会调用上传 hook。它们和导出实例方法不受顶部菜单白名单统一限制；媒体方法目前也不会自动检查预览/只读状态，调用方应自行判断。实例尚未就绪或参数缺少必要地址时无法插入，返回 `false`；不要将返回值当作服务器保存成功的确认。

`getImages()`、`getVideos()`、`getFiles()` 返回有效媒体的摘要，不包含上传占位块，也不是完整存档。例如当前返回值没有完整保留 `assetId` 和图片块尺寸，`insertFile()` 当前也没有保存传入的 `assetId`。需要完整数据时请使用 `getJSON()` 或 `v-model`。


## 类型导入

```ts
import type {
  OfficeColorIconProps,
  OfficeIconProps,
  RichTextEditorAlign,
  RichTextEditorCollaborationAwareness,
  RichTextEditorCollaborationDocument,
  RichTextEditorCollaborationProvider,
  RichTextEditorCollaborationUser,
  RichTextEditorCollaborationOptions,
  RichTextEditorCollectedFilePayload,
  RichTextEditorExportItemKey,
  RichTextEditorCode,
  RichTextEditorFilePayload,
  RichTextEditorImageExportOptions,
  RichTextEditorImagePayload,
  RichTextEditorInsertMenuItemKey,
  RichTextEditorInstance,
  RichTextEditorLocalFilePayload,
  RichTextEditorMentionItem,
  RichTextEditorMentionProvider,
  RichTextEditorMentionProviderPayload,
  RichTextEditorMentionType,
  RichTextEditorMessages,
  RichTextEditorOutlineChangeHandler,
  RichTextEditorOutlineItem,
  RichTextEditorOutlineState,
  RichTextEditorProps,
  RichTextEditorToolbarActionKey,
  RichTextEditorUploadErrorHandler,
  RichTextEditorUploadErrorPayload,
  RichTextEditorUploadHook,
  RichTextEditorUploadInput,
  RichTextEditorUploadKind,
  RichTextEditorUploadResult,
  RichTextEditorWatermarkOptions,
  RichTextEditorVideoPayload,
} from '@norio-office/rich-text'
```


## 包导出

```ts
import RichTextEditor, {
  RichTextEditor as NamedRichTextEditor,
  RichTextOutline,
  OfficeIcon,
  OfficeColorIcon,
  ScrollArea,
  monoIconNames,
  colorIconNames,
} from '@norio-office/rich-text'
```
