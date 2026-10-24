---
{"title":"字体与扩展服务","description":"字体与扩展服务的接口、使用示例与行为说明。","order":43,"reference":true}
---

本页按主题整理项目公开说明，供完成快速接入后查阅。代码片段中的业务回调、服务地址和存储实现需要由宿主提供。

## 字体加载与文字塑形

排版线程、页面渲染场景、交互映射、画布绘制和输入桥共享文字塑形结果。注册的字体数据、字体族、样式、字重和版本参与 HarfBuzz 塑形；页面画布使用已定位的字形、行和交互几何，不在绘制阶段重新测量文字。字体未就绪时返回临时结果，不会将备用字体的几何结果标记为已稳定。

```ts
import {
  officeWordFontRegistry,
  shapeOfficeWordText,
  getOfficeWordTextShapingDebugState,
} from '@norio-office/office-word'

await officeWordFontRegistry.loadFamilyList('Arial, sans-serif', 'WWW iii AV To fi')
const shaped = shapeOfficeWordText('WWW iii AV To fi', {
  fontFamily: 'Arial, sans-serif',
  fontSize: 16,
})

if (shaped.settled) {
  console.log(shaped.width, shaped.clusterBoundaries, shaped.charX)
}
console.log(getOfficeWordTextShapingDebugState())
```

可通过 `officeWordFontRegistry.register()` 注册网络字体的地址、版本和备用字体；需要接入 HarfBuzz WASM 等引擎时，可用 `configureOfficeWordTextShaping()` 注入符合塑形接口的实现。


## 宿主扩展服务

### 拼写检查服务

`spellingProvider.check(request)` 是必需方法，返回 `Promise<OfficeWordSpellingCheckResult>`。

请求包含 `text`、可选 `language`、`contextBefore`、`contextAfter` 和 `signal: AbortSignal`。结果包含 `misspelled: boolean`、`suggestions: readonly string[]`，以及可选 `language`、`languages: readonly { id: string; label: string }[]`。

其余方法可选，均接收同一检查请求并返回 `Promise<void>`：

| 方法 | 用途 |
| --- | --- |
| `ignore(request)` | 忽略本次词语。 |
| `ignoreAll(request)` | 忽略该词的全部匹配。 |
| `addToDictionary(request)` | 加入宿主词典。 |
| `setLanguage(request)` | 设置检查语言；该请求中的 `language` 为必填字符串。 |

组件使用宿主服务返回的判断和建议，词典、请求地址和存储由宿主实现。

### 在线图片服务

`onlineImageProvider.pickImage(request)` 是必需方法，返回 `Promise<OfficeWordImagePayload | null>`；`null` 表示没有选择图片。

请求包含 `currentSrc: string`、`currentAlt?: string`、`signal: AbortSignal`。返回图片至少提供 `src`，其余尺寸、名称、替代文本和排版字段按 `OfficeWordImagePayload` 填写。

常用返回字段为 `src: string`、`alt?: string`、`title?: string`、`width?: string`、`height?: string`、`align?: 'left' | 'center' | 'right'`。例如尺寸传 `'220px'`、`'120px'`；宽、高在这个图片接口中是字符串，与页面设置中的数字参数不同。

### 协同与监测

普通接入可省略协同和监测参数。协同提供者由 `createSvgNativeCollaborationProvider()` 创建，其传输层类型为 `SvgNativeCollaborationTransport`；组件使用提供者执行连接和文档同步。业务服务负责身份、房间权限和持久化。

提供者工厂的必填参数为 `transport`、`roomId: string`、`clientId: string`、`actorId: string` 和 `document: OfficeWordDocument`；可选参数为 `displayName: string`、`color: string`、`now: () => string` 和 `createTelemetryTrace: (operationId: string) => OfficeWordTelemetryTrace`。

包入口还提供 `createSvgNativeCollaborationServer()`、`createInMemorySvgNativeCollaborationStorage()`、`createInMemorySvgNativeCollaborationTransport()`，用于搭建本地协同环境；内存存储不提供跨进程持久化。

监测对象可通过 `createOfficeWordBrowserTelemetryRuntime()`、`createOfficeWordBufferedTelemetryTraceFactory()`、`createOfficeWordInputToPaintRuntime()` 等工厂构造。它们属于可选扩展，不是基础加载或导出所必需的参数。



## 其他公开组件

以下组件也可从包入口单独导入，均不提供公开的 `ref` 方法。

### OfficeWordLoadingOverlay

用于宿主页面显示文档加载状态，无事件。

| 参数 | 类型 | 默认值 / 行为 |
| --- | --- | --- |
| `phase` | `'reading'`、`'importing'`、`'preparing'` | `'preparing'`，表示当前加载阶段。 |
| `progress` | `number` | 不传时按阶段取 28、68、92；显示值限制在 0～100。 |
| `indeterminate` | `boolean` | `false`，是否显示不确定进度。 |
| `title` | `string` | `'正在加载文档'`。 |
| `description` | `string` | `'正在解析内容并准备编辑环境，请稍候…'`。 |

### OfficeWordColorPickerPanel

用于独立颜色选择，通过 `value` 输入颜色，通过 `change` 返回选择结果。

| 参数 | 类型 | 默认值 / 行为 |
| --- | --- | --- |
| `value` | `string` 或 `null` | `null`，当前颜色。 |
| `fallbackColor` | `string` | `'#2D7FF9'`，无有效颜色时的备用颜色。 |
| `themePalette` | `ReadonlyArray<ReadonlyArray<string>>` | 内置主题色板。 |
| `standardPalette` | `ReadonlyArray<string>` | 内置标准色板。 |
| `recentColors` | `ReadonlyArray<string>` | `[]`，宿主提供的最近颜色。 |
| `recentKey` | `string` | `'default'`，最近颜色记录的分组标识。 |
| `recentSlots` | `number` | `10`，最近颜色显示数量。 |
| `defaultLabel` | `string` | `'默认'`。 |
| `standardTitle` | `string` | `'标准色'`。 |
| `recentTitle` | `string` | `'最近使用'`。 |
| `moreLabel` | `string` | `'更多颜色'`。 |
| `labelPrefix` | `string` | `'颜色'`，用于标签文字。 |
| `panelWidth` | `number` | `251`，主面板宽度，单位像素。 |
| `customPanelWidth` | `number` | `286`，自定义颜色面板宽度，单位像素。 |
| `customPanelSide` | `'right'`、`'left'`、`'bottom'` | `'right'`，自定义颜色面板展开方向。 |

`change(payload)` 返回 `OfficeWordColorPickerChangePayload`：`color: string | null` 和 `source: 'default' | 'palette' | 'recent' | 'custom'`。该组件不提供 `v-model` 更新事件，宿主在 `change` 回调中更新自己的颜色值。

### OfficeWordContextMenu

独立右键菜单展示组件，宿主传入 `OfficeWordContextMenuModel`，并处理菜单命令；不是给 `OfficeWord` 自动增加菜单项的配置参数。

| 参数 | 类型 | 默认值 / 行为 |
| --- | --- | --- |
| `model` | `OfficeWordContextMenuModel` 或 `null` | 必填；为 `null` 时没有可展示的菜单模型。 |
| `open` | `boolean` | `true`，控制菜单显示。 |
| `viewportPadding` | `number` | `8`，距视口边缘的预留像素。 |
| `portalTarget` | `string`、`HTMLElement` 或 `null` | `null`，可指定挂载目标。 |

| 事件 | 回调参数 |
| --- | --- |
| `command` | `{ commandId: string; item: OfficeWordContextMenuCommandItem; model: OfficeWordContextMenuModel }`。 |
| `close` | 原因字符串：`'command'`、`'escape'`、`'outside'`、`'scroll'`、`'resize'`、`'blur'`。 |
| `ready` | `{ durationMs: number; family: OfficeWordContextMenuModel['family'] }`，用于菜单呈现记录。 |


## 资源按需加载和字体缓存

普通编辑不加载公式面板、KaTeX、DOCX 序列化或 PDF／SVG／PNG 固定版式导出实现；第一次使用时加载。已有同步底层渲染工具保持原契约，直接使用这些工具的调用方仍需承担对应资源。推荐普通组件宿主使用 `./browser` 入口，并保留 `./style.css`。

公式面板加载期间显示状态，网络失败可在原文档内重试；导出继续使用原有 Promise API、进度和错误处理，失败后可再次调用。更新版本时应保留仍被打开页面引用的旧哈希资源，避免把部署缺失误当成暂时断网。

字体下载经 SHA-256 验证后供浏览器字体和权威塑形复用，不再为 FontFace 另发 URL 请求。浏览器允许时，将校验后的字节保存到当前来源的 Cache Storage `office-word-verified-fonts-v1`，后续启动重新校验并复用；缓存损坏则重新下载，存储不可用不影响正常下载。更换字体内容需要对应版本与哈希，不能仅覆盖同名文件。禁用或清理站点存储后，下次仍需完整下载。

正式 `publish:prepare` 会审计构建 JS 和公开声明的外部依赖，已内嵌的实现不再要求宿主重复安装。公开类型仍使用的 `jszip`、`harfbuzzjs` 保留；Vue 是 peer，Vite 仅用于可选的资源插件。源码开发依赖与正式发布依赖分别维护。


## 包级扩展导出与类型

组件 `ref` 方法与包级工具函数是两个入口：前者操作当前挂载的编辑器，后者处理调用方传入的文档或数据，不会自动同步到组件。

| 包级入口 | 用途与返回结果 |
| --- | --- |
| `createDefaultOfficeWordDocument(title?: string)` | 创建完整默认文档，返回 `OfficeWordDocument`；默认标题为 `'未命名文档'`。 |
| `loadOfficeWordDocument(input, fallbackTitle?)` | 加载、迁移并规范化文档输入，返回 `OfficeWordDocument`。 |
| `migrateOfficeWordDocument(input)` | 迁移文档数据，返回 `OfficeWordCanonicalDocumentInput`。 |
| `validateOfficeWordDocument(input)` | 校验文档结构，返回 `{ valid: boolean; issues: OfficeWordDocumentValidationIssue[] }`。 |
| `normalizeOfficeWordDocument(document, fallbackTitle?)` | 规范化文档，返回 `OfficeWordDocument`；数据迁移可使用前两项入口。 |
| `officeWordReleaseCapabilities`、`getOfficeWordReleaseCapabilitySummary()` | 查询编辑能力范围和统计。 |
| `DEFAULT_DOCX_IMPORT_LIMITS`、`resolveDocxImportLimits(overrides?)` | 查询默认导入限制或合并、校验自定义限制。 |
| `OfficeWordFeatureAccessError`、`OfficeWordExportTypeError`、`DocxImportError` | 识别功能授权、导出类型和导入错误。 |
| `officeWordFontRegistry`、`shapeOfficeWordText()`、`getOfficeWordTextShapingDebugState()` | 字体加载、文字塑形和相关诊断，见上文示例。 |
| 协同与监测工厂 | 构造可传入组件的扩展服务，见“协同与监测”。 |

包入口还导出了文档命令、排版、渲染、协同协议、插件和测试监测等底层工具。它们的完整签名随包的 TypeScript 声明提供，普通组件接入不需要使用这些底层工具，也不应将它们当作组件 `ref` 方法。

常用类型可直接从 `@norio-office/office-word` 导入，包括 `OfficeWordMode`、`OfficeWordFileNameChangePayload`、`OfficeWordProps`、`OfficeWordPublicApi`、`OfficeWordDocumentInput`、`OfficeWordDocument`、`OfficeWordImportState`、`OfficeWordPageSettingsUpdate`、`OfficeWordBlobExportResult`、`WordFeatureCode` 和各扩展服务类型。主组件完整参数类型也可通过 `InstanceType<typeof OfficeWord>['$props']` 取得。
