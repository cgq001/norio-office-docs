---
{"title":"内容块与界面配置","description":"内容块与界面配置的接口、使用示例与行为说明。","order":41,"reference":true}
---

本页按主题整理项目公开说明，供完成快速接入后查阅。代码片段中的业务回调、服务地址和存储实现需要由宿主提供。

## 水印

`watermark` 只作为页面视觉层渲染，不写入编辑器 JSON，也不会影响 `getText()` 的纯文本结果。当前导出清理流程会移除水印层，所以 PDF、图片、HTML 输出都不保留它。若业务要求导出水印，需要在业务导出流程中另行处理，不能把页面水印当成文件防泄漏能力。

```vue
<RichTextEditor
  v-model="content"
  :watermark="{
    text: '内部资料',
    color: 'rgba(37, 99, 235, 0.12)',
    fontSize: 20,
    rotate: -24,
    showInEdit: true,
  }"
/>
```

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `text` | `string` | - | 水印文字，必填。 |
| `color` | `string` | `'rgba(15, 23, 42, 0.12)'` | 水印文字颜色。 |
| `fontSize` | `number` | `18` | 水印字号，单位 px。 |
| `rotate` | `number` | `-24` | 水印倾斜角度，单位 deg。 |
| `showInEdit` | `boolean` | `true` | 编辑状态下是否显示水印；预览状态始终按配置显示。 |

旧版白名单兼容示例（不要同时传 `feature-codes`）：

```vue
<RichTextEditor
  v-model="content"
  :enabled-export-items="['html', 'image']"
  :enabled-insert-menu-items="['image', 'local-file', 'blockquote']"
  :enabled-toolbar-actions="['blockquote']"
/>
```


## 可用 Key

所有授权码统一从 `feature-codes` 传入，也可以从包里导入各类 `RICH_TEXT_EDITOR_*_CODES` 避免手写字符串：

```ts
import {
  RICH_TEXT_EDITOR_EXPORT_CODES,
  RICH_TEXT_EDITOR_FEATURE_CODES,
  RICH_TEXT_EDITOR_INSERT_MENU_CODES,
  RICH_TEXT_EDITOR_TOOLBAR_ACTION_CODES,
} from '@norio-office/rich-text'
import type { RichTextEditorCode } from '@norio-office/rich-text'

const featureCodes: RichTextEditorCode[] = [
  RICH_TEXT_EDITOR_EXPORT_CODES.pdf,
  RICH_TEXT_EDITOR_INSERT_MENU_CODES.image,
  RICH_TEXT_EDITOR_FEATURE_CODES.outlineRight,
  RICH_TEXT_EDITOR_TOOLBAR_ACTION_CODES.blockquote,
]
```

上述常量是对象，取其中的值组成数组即可。`featureCodes` 是受控入口共用的白名单；它的适用边界见 Props 下方说明：

```vue
<RichTextEditor
  v-model="content"
  :feature-codes="['pdf', 'image']"
/>
```

上面这个配置会开启 PDF 导出、图片导出和插入图片入口。因为 `image` 是统一授权码，所以它会同时命中导出图片和插入图片。

完整授权码清单：

| Code | 分类 | 控制内容 | 仍需配合的 prop |
| --- | --- | --- | --- |
| `comments` | 高级功能 | 评论按钮、右侧评论栏、正文评论锚点点击和评论交互。 | `showComments`、`comments`、`commentUser` |
| `outlineLeft` | 高级功能 | 内置大纲和贴边图标按钮，授权后位于左侧。 | `showOutline` |
| `outlineRight` | 高级功能 | 内置大纲和贴边图标按钮，授权后位于右侧。 | `showOutline` |
| `watermark` | 高级功能 | 页面水印显示；当前导出不会保留水印。 | `watermark` |
| `collaboration` | 高级功能 | Yjs 协同编辑和协同光标；未授权时按单人模式初始化。 | `collaboration` |
| `mention` | 高级功能 | 正文 `@` 提及、评论输入框里的 `@` 提及弹层和提及实例方法。 | `mention`、`commentMention`、`mentionProvider`、`commentMentionProvider` |
| `pdf` | 兼容代码 | 内置入口已移除；`exportPdf()` 仍可调用。 | - |
| `html` | 兼容代码 | 内置入口已移除；`exportHtml()` 仍可调用。 | - |
| `image` | 插入菜单 | 控制插入菜单里的图片入口；`exportImage()` 不受白名单限制。 | `uploadImage` |
| `print` | 兼容代码 | 内置打印入口已移除。 | - |
| `video` | 插入菜单 | 插入菜单里的视频入口。 | `uploadVideo` |
| `table` | 插入菜单 | 插入菜单里的表格入口。 | - |
| `local-file` | 插入菜单 | 插入菜单里的本地文件入口。 | `uploadFile` |
| `columns` | 插入菜单 | 插入菜单里的分栏入口。 | - |
| `highlight-block` | 插入菜单 | 插入菜单里的高亮块入口。 | - |
| `date` | 插入菜单 | 插入菜单里的日期入口；当前作为授权码预留。 | - |
| `code-block` | 插入菜单 | 插入菜单里的代码块入口。 | - |
| `formula` | 插入菜单 | 插入菜单里的公式入口。 | - |
| `blockquote` | 插入菜单 + 工具栏 | 插入菜单里的引用入口，同时控制工具栏里的引用按钮。 | - |
| `emoji` | 插入菜单 + 工具栏 | 插入菜单里的表情入口，同时控制工具栏里的表情按钮。 | - |
| `link` | 插入菜单 | 插入菜单里的链接入口。 | - |
| `divider` | 插入菜单 | 插入菜单里的分割线入口。 | - |
| `countdown` | 插入菜单 | 插入菜单里的倒计时入口。 | - |
| `markdown-import` | 插入菜单 | 插入菜单里的 Markdown 导入入口。 | - |

同一个 code 只写一次即可；例如 `blockquote` 同时控制插入引用和工具栏引用按钮。导出实例方法不受 code 控制。

大纲授权规则：`featureCodes` 里只有 `outlineLeft` 时，大纲及入口显示在左侧；只有 `outlineRight` 时显示在右侧；两个都有时按 `outlinePlacement` 决定位置；两个都没有时不显示内置大纲和贴边入口。

举例：想保留评论、正文提及和右侧大纲，可以传 `['comments', 'mention', 'outlineRight']`，同时配置 `:show-comments="true"`、`:mention="true"`、当前用户和各自的数据源。只写 code 不会自动生成评论用户、提及候选或上传接口。


## 复制、剪切和粘贴

先分清两个菜单：选中文字后浮在附近的是“文字气泡”，用来改选中文字的格式；鼠标移到段落、图片、表格等块旁边后出现的按钮是“句柄”，打开的是整块操作菜单。句柄菜单始终操作它对应的块，不一定是光标所在的块。

句柄只在空闲时悬停显示，不会随光标自动出现。输入（包括中文输入法）、拖动选中文字或块框选时，句柄及其菜单会隐藏；有文字、图片、视频、链接或表格气泡菜单时，也不显示句柄。例如，选中文字后只能看到格式气泡，收起选区后再次移动鼠标到块旁边，才会显示句柄。

块侧边菜单与 `Ctrl/Cmd+C`、`Ctrl/Cmd+X`、`Ctrl/Cmd+V` 可以交叉使用，保留表格、高亮块、任务列表、图片等节点类型和属性。菜单粘贴在当前块下方插入，优先读取最新系统剪贴板；普通快捷键粘贴保留文字选区和代码块的原生行为，无需额外对接。

菜单读取剪贴板需要安全上下文（HTTPS 或 localhost）和浏览器权限。读取被拒绝时回退到本编辑器缓存，外部内容可用快捷键粘贴；菜单剪切只有在成功写入系统剪贴板后才删除原节点。


## 块菜单的对齐与颜色

正文和标题的句柄菜单提供“缩进和对齐”：左、中、右对齐显示当前选中项，分割线下方是增加、减少缩进；缩进范围为 0-8，到达边界时对应操作禁用。

“颜色”独立放在“缩进和对齐”下方，可设置字体颜色和文字背景色，每项都有“自定义颜色”入口，打开三级内置颜色选择器。“恢复默认”只清除文字色和背景色，保留字体、字号、加粗等格式。

有序列表和无序列表的句柄菜单也提供“缩进和对齐”，支持左/中/右对齐及增减缩进。操作统一作用于该列表内的正文和标题（包括嵌套项），保留列表结构、编号及文字格式，不影响其他列表；缩进范围为 0–8，各文本块独立限制，设置后菜单保持打开。

句柄菜单顶部的类型按钮会高亮回显当前句柄节点：正文、H1–H6、有序列表、无序列表或待办。回显跟随句柄目标，不受其他位置的光标影响；转换或修改节点后重新打开菜单会显示新类型，插入菜单不会误显示为当前类型。

句柄操作菜单默认以句柄中心上下居中，仅在顶部或底部空间不足时向可视区域内避让。定位按实际菜单高度计算，跟随滚动、窗口尺寸和缩放更新；空行“＋”的插入菜单仍在按钮下方展开。

句柄菜单的“颜色”和“剪切”之间、以及“删除”上方使用统一横线分组，样式与“删除”和添加菜单之间的分割线一致。

句柄菜单提供“在上方添加”和“在下方添加”，分别使用对应方向的图标。两者共用基础/常用节点子菜单，在目标块前后插入并保留原块（包括空段落），支持撤销；窄屏使用带“返回”的子菜单。

编辑器自有弹出菜单统一使用直角，包括工具栏下拉、插入及句柄多级菜单、文字/表格气泡、颜色/表情/@提及面板，以及图片、视频、链接、代码、倒计时、日期和公式的浮动设置。面板、矩形选项和色块均无圆角；头像、单选圆点及开关保留圆形，正文内容块、图片和主工具栏外观不变。

二级、三级颜色菜单选色后保持打开，可连续调整；高亮块边框/填充及分割线颜色同样不会自动关闭。小屏下使用带“返回”的逐级菜单。操作仅作用于句柄对应的块，支持撤销、重做，沿用文档 JSON/HTML 保存，无需新增对接参数。

文字背景色使用现有 `textStyle.backgroundColor`，与高亮块整块填充、表格单元格背景色分别设置。段落、标题、列表、引用和高亮块均支持文字颜色菜单。


## 文字选区气泡菜单

在编辑状态选中文字，会在选区附近显示格式气泡菜单，提供正文/标题、字体、字号、文字色、文字背景色、加粗、斜体、下划线、删除线、上下标、对齐与缩进、行内代码和清除格式。上下标互斥切换；颜色使用内置颜色选择器，最近使用颜色与顶部工具栏共享，选色后不关闭面板。

气泡在选择结束后才出现：按住鼠标拖选时隐藏，松开鼠标后显示；按住 Shift 用方向键扩展选区时隐藏，松开 Shift 后显示。例如，拖选两段文字的过程中不会有菜单挡住正文，松开后才显示格式按钮。重新拖选时，已有气泡也会暂时隐藏。

顶部工具栏和选区气泡菜单的字号选项统一只保留初号、小初、一号、小一、二号、小二、三号、小三、四号、小四、五号、小五，不显示纯数字字号选项；已有文档的字号数据保持不变。

选区气泡的正文按钮显示当前块类型图标；菜单提供正文、一至三级标题、“其他标题”（二级菜单含四至六级）、有序列表、无序列表、任务、代码块、引用和高亮块。代码块与引用之间使用分隔线，代码块、引用、高亮块分别遵循现有 `code-block`、`blockquote`、`highlight-block` 授权码。选择后直接转换或包裹原有内容，不额外插入空块；不提供尚未实现的同步块入口。

操作保留选区：行内格式只修改选中文字，对齐、缩进和标题修改所在块。表格内选中文字、单元格或整表时，统一显示一个表格气泡：上方提供字体、字号、文字色、文字背景色、加粗、斜体、下划线、删除线、对齐与缩进，不提供正文/标题、上下标、行内代码和清除格式；下方提供合并、拆分、单元格背景色、主题色及增删行列等表格操作，不能执行的操作会禁用。例如，只选中单元格中的“评论”二字，改字体、字号或文字颜色不会影响同格其他文字；“文字背景颜色”与整格的“设置单元格背景色”互相独立。拖选期间不显示，选择结束后才出现。收起选区、点击外部或按 Escape 可关闭；小屏自动换行，预览/只读和演示时不显示。文字选区优先显示气泡，并关闭已打开的句柄菜单。无需新增对接参数，格式仍随现有文档 JSON/HTML 保存。


## 表格主题色

选中表格单元格、行或列后，在气泡菜单的“设置单元格背景色”后点击主题图标。内置经典蓝、清新绿、优雅紫、活力橙、玫瑰粉、简约灰，支持分别自定义表头、奇数行、偶数行颜色。

也可以鼠标移入表格，打开左侧块操作菜单，悬停或点击“主题色”。该入口上下使用菜单分割线分隔；这里复用相同主题面板，直接修改该菜单对应的表格，不需要先选中单元格；光标位于另一张表格时也不会改错目标。

点击三个颜色块会打开编辑器自带的颜色面板，包含默认色、色板、标准色、最近使用和“更多颜色”。默认色恢复经典蓝主题对应区域的颜色；最近使用与工具栏背景色面板共享，选择后立即生效。

主题作用于整张表：首行为表头色，第二行开始交替填色，增删行后会自动重新交替。选主题时清除当前表已有的单元格背景覆盖色，之后仍可单独设置单元格背景。“清除样式”清除主题和单元格背景，保留内容、文字格式、合并关系和列宽。

无需额外对接接口；主题保存在现有文档 JSON 的表格节点 `attrs.tableTheme` 中，通过 `v-model` / `change` 一起保存，支持撤销、重做、协同和导出。也可在初始文档的表格节点中传入：

```ts
attrs: {
  tableTheme: { header: '#1670d2', odd: '#e8f2ff', even: '#ffffff' },
}
```

不传 `tableTheme` 或设置为 `null` 时保留原有表格外观。


## 分割线样式与颜色

鼠标移入分割线，打开左侧块操作菜单：

- **样式**：只展示实线、虚线、点状线的预览，悬停可查看名称，点击即可切换。
- **颜色**：复用编辑器颜色面板，支持默认色、色板、标准色、最近使用和更多颜色；默认色恢复原来的浅灰色，最近使用与文字颜色面板共享。

样式和颜色为独立一组，与上方粘贴、下方删除之间使用菜单分割线分隔。

修改只作用于当前菜单对应的分割线，不需要先选中它。无需额外回调；属性保存在 `horizontalRule` 节点中，通过现有 `v-model` / `change` 保存，支持撤销、重做、复制粘贴和导出。初始文档示例：

```ts
{ type: 'horizontalRule', attrs: { lineStyle: 'dashed', lineColor: '#1677ff' } }
```

`lineStyle` 可选 `solid`（实线）、`dashed`（虚线）、`dotted`（点状线）；`lineColor` 使用六位 HEX 色值，`null` 表示默认色。不传属性的旧文档仍显示默认实线。`feature-codes` 中的 `divider` 控制插入入口，无需新增授权码。


## 高亮块颜色与设置

移入高亮块并打开句柄菜单，在“粘贴”和“删除”之间可设置。句柄主菜单按内容撑开，不显示内部滚动条，靠近底部时自动上移：

- **边框颜色**：二级菜单提供预设色、无颜色和恢复默认；“自定义颜色”打开三级内置颜色选择器，支持标准色、最近使用、更多颜色、默认和清除颜色。
- **填充颜色**：独立设置块背景，颜色选择方式同上。
- **设置**：切换“启用表情”；关闭后隐藏左侧表情，开启后可继续点击表情进行选择。

边框和填充独立设置，选色后二级、三级菜单保持打开，可以连续修改；窄屏通过“返回”切换菜单层级。

高亮块不再显示气泡菜单。操作仅影响句柄对应的高亮块，不依赖当前光标位置；属性仍保存在文档 JSON/HTML 中，支持撤销、重做，无需新增对接参数。


## 引用颜色

移入引用块并打开左侧句柄菜单，在“粘贴”和“删除”之间可设置 **边框颜色**、**背景颜色**。二级菜单各提供 15 个预设色，加上无颜色按钮，完整显示两行、每行 8 格；保留原有预设和默认色，并支持恢复默认。“自定义颜色”打开三级内置颜色选择器。选色后菜单保持打开，窄屏通过“返回”切换层级。

修改只作用于句柄对应的引用块，不依赖光标位置；边框色、块背景色、文字颜色互不影响。原顶部工具栏的引用颜色设置保留。数据仍使用 `blockquote.attrs.quoteBorderColor`、`blockquote.attrs.quoteBackgroundColor`，随现有文档 JSON/HTML 保存，支持撤销和重做，无需新增对接参数。


## 图片描述与链接

直接按住图片拖到文档其他位置，会移动原图片，保留宽高、对齐、旋转、描述和链接，不会重复插入。图片组内拖到另一张图片上可调整顺序，拖到组外会移动整组；侧边句柄拖动仍可使用。外部图片文件拖入仍走上传 hook。

直接拖图片、句柄拖动和外部文件拖入的块级落点提示统一为蓝色横线及左端圆点。

选中图片，点击气泡菜单的“设置图片描述”，即可在图片下方直接输入。描述随输入保存，支持换行；清空文字后再按一次 Backspace，会隐藏描述框，不会删除图片。旧文档或上传结果中已有的 `description` 会自动显示，预览/只读时显示为普通文字。

点击“设置图片链接”，在气泡菜单下方弹层输入网址，可勾选“在当前页面打开”。点击“确定”或按 Enter 才保存；“取消”、Escape、点击外部或切换图片均放弃本次修改。清空网址后确定即移除链接，无效网址不会覆盖旧值。

编辑状态下点击已设置链接的图片只选中图片，不会跳转；预览、只读或演示状态下才按配置打开链接。保存与导出仍保留链接数据。

无需新增对接事件，数据通过现有文档 `v-model` / `change` 保存，也可通过 `insertImage()` 传入：

```ts
editorRef.value?.insertImage({
  src: 'https://example.com/photo.png',
  description: '图片描述',
  descriptionVisible: true,
  link: 'https://example.com/details',
  linkTarget: '_blank',
})
```

`descriptionVisible` 可选，不传时根据描述是否为空决定显示；`true` 可显示空描述框，`false` 隐藏描述。`linkTarget` 可选 `_blank`（默认，新页面）或 `_self`（当前页面）。`getImages()` 返回这些字段；描述和已确认链接支持撤销、重做、复制粘贴和导出，未确认的链接草稿不会导出。


## @ 提及

`mention` 默认关闭。需要提及能力时请显式传入 `:mention="true"`；未开启时输入 `@` 只会保留普通文本，`@mention-search` 不会被调用，`insertMention()` 会返回 `false`。

输入 `@` 会打开候选弹窗。宿主项目通过 `@mention-search` 异步返回候选数据，组件不会内置默认人员或文档数据。推荐使用 `@mention-search`，`mentionProvider` 仅作为函数 prop 兼容保留。

`type: 1` 表示人，`type: 2` 表示文档。人和文档共用 `id`、`name`、`type`、`avatar`、`icon`、`tag`、`updatedAt` 等字段；文档传入 `tag` 时会在标题旁显示标签文字，不传则不显示；人没有头像时会用名字最后两个字和固定亮色颜色池生成头像。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { JSONContent } from '@tiptap/core'
import { RichTextEditor } from '@norio-office/rich-text'
import type {
  RichTextEditorMentionItem,
  RichTextEditorMentionProviderPayload,
} from '@norio-office/rich-text'
import '@norio-office/rich-text/style.css'

const content = ref<JSONContent>({ type: 'doc', content: [{ type: 'paragraph' }] })

const mentionItems: RichTextEditorMentionItem[] = [
  { id: 'user-1001', name: '崔国强', type: 1 },
  { id: 'user-1002', name: '刘佳宁', type: 1 },
  { id: 'doc-2001', name: 'IT资产管理系统', type: 2, tag: '外部', updatedAt: '2025年12月1日' },
  { id: 'doc-2002', name: '客户满意度调研表', type: 2, updatedAt: '2025年12月4日' },
]

async function handleMentionSearch(payload: RichTextEditorMentionProviderPayload) {
  const query = payload.query.trim().toLowerCase()
  await new Promise((resolve) => window.setTimeout(resolve, 120))

  return mentionItems.filter((item) => {
    const matchedType = !payload.type || payload.type === 'all' || item.type === payload.type
    const matchedKeyword = !query || item.name.toLowerCase().includes(query)
    return matchedType && matchedKeyword
  })
}

function handleMentionItemClick(item: RichTextEditorMentionItem) {
  console.log('clicked mention item:', item)
}

function handleMentionSubmit(item: RichTextEditorMentionItem) {
  console.log('inserted mention:', item)
}
</script>

<template>
  <RichTextEditor
    v-model="content"
    :mention="true"
    @mention-search="handleMentionSearch"
    @mention-item-click="handleMentionItemClick"
    @mention-submit="handleMentionSubmit"
  />
</template>
```

点击候选项只会触发 `mention-item-click` 并选中当前项；点击底部 `提及` 按钮才会插入结构化提及节点并触发 `mention-submit`。关闭弹窗或不点击 `提及` 时，编辑器会保留普通 `@` 文本。


## 自定义文案

编辑器默认 UI 文案为中文。`messages` 只会覆盖代码实际读取的文案 key，并非所有界面文字都已经支持替换。句柄菜单和文字选区菜单的部分文案仍是内置中文；传入不存在的 key 不会改变界面。

```vue
<RichTextEditor
  v-model="content"
  :messages="{
    'insert.localFile': '附件',
    'export.label': '下载',
  }"
/>
```

常用文案 key：

| Key | 默认中文 |
| --- | --- |
| `insert.label` | 插入 |
| `insert.section.general` | 通用 |
| `insert.section.apps` | 小应用 |
| `insert.section.external` | 外部内容 |
| `insert.image` | 图片 |
| `insert.video` | 视频 |
| `insert.table` | 表格 |
| `insert.localFile` | 本地文件 |
| `insert.columns` | 分栏 |
| `insert.highlightBlock` | 高亮块 |
| `insert.date` | 日期 |
| `insert.codeBlock` | 代码块 |
| `insert.formula` | 公式 |
| `insert.blockquote` | 引用 |
| `insert.emoji` | 表情符号 |
| `insert.link` | 超链接 |
| `insert.divider` | 分隔线 |
| `insert.countdown` | 倒计时 |
| `insert.markdownImport` | Markdown 导入 |
| `export.label` | 导出 |
| `export.pdf` | 导出 PDF |
| `export.pdf.loading` | 导出 PDF 中... |
| `export.html` | 导出 HTML |
| `export.html.loading` | 导出 HTML 中... |
| `export.image` | 导出图片 |
| `export.image.loading` | 导出图片中... |
| `print.label` | 打印 |
| `print.loading` | 打印中... |
| `quote.apply` | 应用引用 |
| `quote.cancel` | 取消引用 |
| `quote.borderColor` | 边框颜色 |
| `quote.backgroundColor` | 背景颜色 |
| `outline.label` | 大纲 |
| `outline.collapse` | 收起大纲 |
| `outline.empty.description` | 对文档内容应用“标题”样式，即可自动生成大纲。 |
| `outline.empty.tip` | 点击内容区边缘的大纲图标可以展开大纲。 |
| `status.wordCountUnit` | 个字 |
| `status.presentation.enter` | 演示 |
| `status.presentation.exit` | 退出演示 |
| `status.fullscreen.enter` | 全屏 |
| `status.fullscreen.exit` | 退出全屏 |
| `countdown.selectTime` | 请选择时间 |
| `countdown.settingsTitle` | 倒计时设置 |
| `formula.insertTitle` | 插入 LaTeX 公式 |


## 预览模式

`mode="preview"` 会切换到只读预览外壳。预览模式下顶部工具栏、气泡菜单和句柄菜单都不显示，正文不能编辑；图片设置的跳转链接生效，大纲仍可放在左侧或右侧。正文可编辑时，点击图片只用于选中和编辑，不会跳转。

| 配置 | 正文能否编辑 | 顶部工具栏 | 适用场景 |
| --- | --- | --- | --- |
| 默认 `mode="edit"` | 能 | 显示 | 写文档 |
| `mode="edit"`、`:show-toolbar="false"` | 能 | 隐藏 | 只使用选中文字的气泡菜单和块句柄菜单 |
| `mode="preview"` | 不能 | 隐藏 | 阅读/预览 |

这里限制的是用户交互，不是业务 API 的安全边界。业务方仍应避免在只读时主动调用修改内容的方法。

`showToolbar` 默认是 `true`，只控制顶部工具栏，不影响正文编辑、气泡菜单、句柄菜单或底部信息栏。可以动态切换；预览和演示时无论这个属性是什么值，顶部工具栏都会隐藏。

例如，保留编辑能力，但隐藏顶部工具栏：

```vue
<RichTextEditor v-model="content" :show-toolbar="false" />
```

切换成只读预览：

```vue
<RichTextEditor
  v-model="content"
  mode="preview"
  outline-placement="right"
/>
```

窄屏下预览模式会自动缩放页面画布，让文档在手机上保持可读。

底部信息栏提供演示、全屏和缩放；编辑器界面不提供导出或打印入口。点击“演示”后，组件临时进入只读预览并全屏显示；按 Esc 或通过浏览器退出全屏后，恢复进入前的编辑/预览状态，不修改业务传入的 `mode` 或文档内容。例如，从编辑页开始演示，退出后可以继续编辑；从预览页开始演示，退出后仍是预览。


## 外置目录组件

内置大纲默认收起，内容区边线中部显示图标按钮。点击后按钮隐藏，大纲作为悬浮层展开，上下及配置的一侧贴住内容区边线，不占正文空间；关闭后恢复按钮。左侧按钮为左直角、右圆角，右侧镜像。底部状态栏不再显示大纲按钮。编辑与预览均支持，演示时隐藏。

内置目录默认跟随编辑器一起渲染。如果需要把目录放到任意侧栏、抽屉或自定义布局里，可以关闭内置目录，并把编辑器实例传给 `RichTextOutline`。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { RichTextEditor, RichTextOutline } from '@norio-office/rich-text'
import type { RichTextEditorInstance } from '@norio-office/rich-text'
import type { JSONContent } from '@tiptap/core'
import '@norio-office/rich-text/style.css'

const editorRef = ref<RichTextEditorInstance | null>(null)
const content = ref<JSONContent>({
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: '项目说明' }] },
    { type: 'paragraph' },
  ],
})
</script>

<template>
  <RichTextEditor ref="editorRef" v-model="content" :show-outline="false" />
  <aside class="outline-sidebar">
    <RichTextOutline :editor="editorRef" />
  </aside>
</template>
```

`RichTextOutline` 会自动订阅编辑器目录状态，点击条目时会调用 `focusOutlineItem` 跳转到对应标题。组件自身最小高度为 `200px`，默认根据内容自适应增高；如果需要固定高度或内部滚动，请在外层套一个容器控制高度。可选 props：`open`、`placement`、`title`、`collapseTitle`、`emptyDescription`、`emptyTip`、`showCollapse`；事件：`select`、`toggle`、`change`。
