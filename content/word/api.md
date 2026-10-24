---
{"title":"参数与事件","description":"参数与事件的接口、使用示例与行为说明。","order":40,"reference":true}
---

本页按主题整理项目公开说明，供完成快速接入后查阅。代码片段中的业务回调、服务地址和存储实现需要由宿主提供。

## 参数

下表使用 Vue 参数名，模板中也可使用短横线形式，例如 `showFileHeader` 对应 `show-file-header`。

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `modelValue` | `OfficeWordDocumentInput` 或 `null` | `null` | 输入文档，支持 `v-model`；为空时创建默认文档。更新事件返回规范化的 `OfficeWordDocument`。 |
| `title` | `string` | `'未命名文档'` | 初始文档名称；输入文档已有 `title` 时以文档为准，仅在缺少标题时使用此备用值。运行时通过 `setFileName()` 改名。 |
| `mode` | `OfficeWordMode` | `'edit'` | `edit`、`preview` 或 `disabled`，交互规则见“组件模式”。 |
| `placeholder` | `string` | `''` | 占位文字参数；当前页面画布未使用该参数渲染正文占位提示。 |
| `showRibbon` | `boolean` | `true` | 是否显示整个顶部区域，包含文件栏和功能菜单；为 false 时优先隐藏两者。预览／禁用模式下只可能显示文件栏。 |
| `showFileHeader` | `boolean` | `true` | 是否显示最上方文件图标与文件名栏。为 false 不影响编辑模式下的菜单和工具栏；同时受 `showRibbon` 总开关控制。 |
| `showAiButton` | `boolean` | `true` | 是否显示二级工具栏末尾的 AI 目标按钮；组件本身不调用模型。 |
| `showStatusBar` | `boolean` | `true` | 是否显示底部状态栏。 |
| `initialZoom` | `number` | `100` | 初始缩放百分比，`100` 表示 100%；用于初始化，不是持续控制缩放的双向绑定参数。 |
| `fontUrls` | `OfficeWordFontUrls` | 必填 | 四个字体文件本身的地址，包含 `text`、`symbols`、`emoji`、`cjk`；初始化读取，完整接入见上文。 |
| `docxImportLimits` | `DocxImportLimitOverrides` | `undefined` | 覆盖导入资源限制，未指定的字段使用默认限制，见“导入资源限制”。 |
| `featureCodes` | `WordFeatureCode[]` | `undefined` | 导入、导出功能授权，见“功能授权”。 |
| `spellingProvider` | `OfficeWordSpellingProvider` 或 `null` | `null` | 宿主提供的拼写检查服务，见“拼写检查服务”。 |
| `onlineImageProvider` | `OfficeWordOnlineImageProvider` 或 `null` | `null` | 宿主提供的在线图片选择服务，见“在线图片服务”。 |
| `collaborationProvider` | `SvgNativeCollaborationProvider` 或 `null` | `null` | 协同编辑提供者，负责连接、操作同步、远程光标等；不传时单机使用。 |
| `telemetryBrowserRuntime` | `OfficeWordBrowserTelemetryRuntime` 或 `null` | `null` | 可选浏览器运行监测对象，提供 `start()`、`stop()`、`snapshot()`；组件管理其启停。 |
| `telemetryTraceFactory` | `OfficeWordProductTelemetryTraceFactory` | `undefined` | 可选操作监测工厂，用于命令、导入、导出等操作记录。 |
| `inputPerformanceTraceRuntime` | `OfficeWordInputToPaintRuntime` 或 `null` | `null` | 可选输入到画面呈现的性能记录对象。普通接入可以省略。 |

`OfficeWordProps` 包含基础参数；协同与监测参数还定义在组件的参数类型中。上述类型均可从包入口导入。

### 功能授权

`featureCodes` 只控制导入、导出入口，模式由 `mode` 控制。不传 `featureCodes` 时开放全部受控入口；传 `[]` 时关闭全部受控入口；传非空数组时只开放列出的入口。界面按钮和对应公开方法均执行该授权校验。

| 授权码 | 对应能力与方法 |
| --- | --- |
| `importWord` | 文档导入：`importFile()`、`importWordBlob()`。 |
| `exportWordDocx` | DOCX 导出：`exportDocxBlob()`、`exportWordBlob()`。 |
| `exportPdfWord` | PDF 导出：`exportPdfBlob()`。 |
| `exportImageWord` | 图片导出：`exportImageBlobs()`、`exportSvgBlobs()`、`exportPngBlobs()`。 |

```vue
<OfficeWord
  :font-urls="fontUrls"
  v-model="document"
  mode="edit"
  :feature-codes="['importWord', 'exportWordDocx', 'exportPdfWord', 'exportImageWord']"
/>
```


## 事件

| 事件 | 回调参数 | 触发时机与说明 |
| --- | --- | --- |
| `ready` | 无 | 组件挂载后的下一次 Vue 更新时触发。表示可取得组件接口，不表示整篇文档的字体、分页与画面已全部完成。 |
| `update:modelValue` | `document: OfficeWordDocument` | 发布文档快照时触发，用于 `v-model`。 |
| `change` | `document: OfficeWordDocument` | 发布文档快照时触发，可用于自动保存。不要将其视为每个按键都立即触发的事件。 |
| `file-name-change` | `OfficeWordFileNameChangePayload` | 当前文档名称变化后，待当前提交完成，在微任务中按发生顺序通知，包含 `fileName`、`previousFileName`。内部改名、`setFileName()`、文档替换／导入及撤销重做引起名称变化均通知；初始挂载与同名操作不通知。 |
| `dirty-change` | `dirty: boolean` | 修改状态变化时触发。文档替换会重置状态；`exportWordBlob()` 在导出期间文档未继续改变时也会重置状态。 |
| `operation` | `command: OfficeWordEditingCommand` | 编辑命令执行时发布，用于记录操作；载荷是命令，不是完整文档。 |
| `ai-target` | `WordAiTarget` | 点击 AI 按钮时，向外发布捕获的选区或光标目标；组件不调用模型。 |
| `ai-target-change` | `WordAiTarget \| null` | AI 目标标记变化或清除时通知。 |
| `error` | `error: unknown` | 导入、导出等受控操作报告错误时触发。公开异步方法还可能拒绝 Promise，调用方仍需 `try/catch`。 |

```vue
<OfficeWord
  :font-urls="fontUrls"
  ref="wordRef"
  v-model="document"
  :mode="mode"
  @ready="handleReady"
  @change="handleChange"
  @dirty-change="handleDirtyChange"
  @operation="handleOperation"
  @error="handleError"
/>
```

这些回调由宿主按业务需求实现，不要求全部监听。


## 组件模式

`OfficeWordMode` 的可选值为 `'edit'`、`'preview'`、`'disabled'`，默认 `'edit'`。

| `mode` | 菜单和编辑工具 | 选择与复制 | 修改文档内容／格式／结构 |
| --- | --- | --- | --- |
| `edit`（默认） | 显示一级、二级菜单及右键菜单，按选中对象显示工具栏 | 允许 | 允许，仍遵守文档权限 |
| `preview` | 隐藏菜单、右键菜单、编辑浮动工具和文字插入光标 | 允许鼠标选择、双击选词、Ctrl/Cmd+A 全选与 Ctrl/Cmd+C 复制 | 禁止 |
| `disabled` | 同样隐藏菜单、右键菜单和编辑工具 | 禁止选择与复制；清除已有选区 | 禁止 |

```vue
<OfficeWord :font-urls="fontUrls" mode="edit" />
<OfficeWord :font-urls="fontUrls" mode="preview" />
<OfficeWord :font-urls="fontUrls" mode="disabled" />
<OfficeWord :font-urls="fontUrls" :mode="mode" :show-file-header="false" />
```

三种模式都允许滚动查看。`showFileHeader` 独立控制顶部文件图标和文件名栏；只有编辑模式允许点击文件名改名。切换模式会先提交已经接受的输入，再结束已有编辑手势、关闭菜单／编辑弹层并清理禁用状态的选区；未提交的 IME 草稿不会继续写入。旧交互发起的剪贴板请求随模式变化失效，切回编辑后也不会继续执行。

模式限制组件内交互和受控内容编辑，不阻止外部通过公开方法加载文档、读取、重命名或导出。导出仍遵守功能授权及文档权限。`title` 只负责初始备用名称；运行时改名统一使用 `setFileName()`，不通过切换 `title` 属性重命名。
