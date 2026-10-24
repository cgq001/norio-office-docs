---
{"title":"工作簿与数据模型","description":"工作簿与数据模型的接口、使用示例与行为说明。","order":42,"reference":true}
---

本页按主题整理项目公开说明，供完成快速接入后查阅。代码片段中的业务回调、服务地址和存储实现需要由宿主提供。

## 数据结构

`OfficeExcelWorkbookSnapshot` 是组件对外持久化和 `v-model` 使用的数据结构。

```ts
type OfficeExcelWorkbookSnapshot = OfficeExcelWorkbook

interface OfficeExcelWorkbook {
  title: string
  sheets: OfficeExcelSheet[]
  activeSheetId: string
  watermark: OfficeExcelWatermarkSettings | null
}
```

`OfficeExcelWorkbook` 字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `title` | `string` | 工作簿标题。导出时可作为默认文件名来源。 |
| `sheets` | `OfficeExcelSheet[]` | 工作表数组。 |
| `activeSheetId` | `string` | 当前激活工作表 ID。 |
| `watermark` | `OfficeExcelWatermarkSettings \| null` | 工作簿水印配置。为 `null` 表示没有水印。 |

### 工作表

```ts
interface OfficeExcelSheet {
  id: string
  name: string
  tabColor: string | null
  protected: boolean
  hidden: boolean
  pinned: boolean
  rowCount: number
  colCount: number
  cells: Record<string, OfficeExcelCell>
  merges: OfficeExcelMerge[]
  hiddenRows: number[]
  hiddenCols: number[]
  rowGroups: OfficeExcelAxisGroup[]
  colGroups: OfficeExcelAxisGroup[]
  rowHeights: Record<number, number>
  colWidths: Record<number, number>
  defaultColWidth: number
  frozenRows: number
  frozenCols: number
  sortState: unknown | null
  filter: unknown | null
  validations: unknown[]
  conditionalFormats: unknown[]
  tables: OfficeExcelTableObject[]
  charts: OfficeExcelChartObject[]
  images: OfficeExcelFloatingImageObject[]
}
```

`OfficeExcelSheet` 核心字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | 工作表稳定 ID。外部按工作表读取纯文本时使用它作为 `sheetId`。 |
| `name` | `string` | 工作表名称。 |
| `tabColor` | `string \| null` | sheet 标签颜色。为 `null` 表示默认颜色。 |
| `protected` | `boolean` | 是否保护工作表。保护后会限制编辑和结构操作。 |
| `hidden` | `boolean` | 是否隐藏工作表。 |
| `pinned` | `boolean` | 是否固定工作表标签位置。 |
| `rowCount` | `number` | 工作表总行数。 |
| `colCount` | `number` | 工作表总列数。 |
| `cells` | `Record<string, OfficeExcelCell>` | 稀疏单元格数据，只保存有值、样式或扩展信息的单元格。 |
| `merges` | `OfficeExcelMerge[]` | 合并单元格区域列表。 |
| `hiddenRows` | `number[]` | 隐藏行号列表，行号从 `1` 开始。 |
| `hiddenCols` | `number[]` | 隐藏列号列表，列号从 `1` 开始。 |
| `rowGroups` | `OfficeExcelAxisGroup[]` | 行分组列表。 |
| `colGroups` | `OfficeExcelAxisGroup[]` | 列分组列表。 |
| `rowHeights` | `Record<number, number>` | 自定义行高，key 是行号，value 是像素高度。 |
| `colWidths` | `Record<number, number>` | 自定义列宽，key 是列号，value 是像素宽度。 |
| `defaultColWidth` | `number` | 默认列宽，单位像素。 |
| `frozenRows` | `number` | 冻结行数。 |
| `frozenCols` | `number` | 冻结列数。 |
| `sortState` | `unknown \| null` | 排序状态。建议作为快照整体保存，不建议外部手写。 |
| `filter` | `unknown \| null` | 筛选状态。建议作为快照整体保存，不建议外部手写。 |
| `validations` | `unknown[]` | 数据验证规则。建议通过组件交互生成。 |
| `conditionalFormats` | `unknown[]` | 条件格式规则。建议通过组件交互生成。 |
| `tables` | `OfficeExcelTableObject[]` | 表对象列表。建议通过 `createTable` / `removeTable` 或组件交互生成。 |
| `charts` | `OfficeExcelChartObject[]` | 图表对象列表。可作为快照整体保存；外部生成图表时建议使用下方列出的公开字段。 |
| `images` | `OfficeExcelFloatingImageObject[]` | 浮动图片对象列表。 |

上面是对外理解数据结构时最常用的核心字段示意；实际 `OfficeExcelSheet` 类型中还包含筛选、条件格式、图表等更细字段。`cells` 使用稀疏存储，只保存有值或有样式的单元格。key 由组件内部生成，外部更推荐通过 `getPlainText`、导入导出或完整快照持久化来使用，不建议手写大量 cell key。

### 单元格

```ts
interface OfficeExcelCell {
  row: number
  col: number
  value: string
  style?: CellStyle
  hyperlink?: OfficeExcelCellHyperlink
  note?: string
  cellFormatType?: string | null
  cellDataFormat?: unknown
  sparkline?: unknown
  image?: unknown
}
```

`OfficeExcelCell` 字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `row` | `number` | 单元格行号，从 `1` 开始。 |
| `col` | `number` | 单元格列号，从 `1` 开始。 |
| `value` | `string` | 单元格原始输入值。公式、数字格式、日期格式会在显示阶段转换。 |
| `style` | `CellStyle` | 单元格样式。 |
| `hyperlink` | `OfficeExcelCellHyperlink` | 单元格超链接。 |
| `note` | `string` | 单元格备注纯文本。导入 `.xlsx` 批注/备注时会尽量读取文本内容；复杂富文本备注会折成纯文本保存。 |
| `cellFormatType` | `string \| null` | 单元格格式类型，例如下拉、复选框、日期、数字等。 |
| `cellDataFormat` | `unknown` | 单元格格式的详细配置。建议作为快照保存。 |
| `sparkline` | `unknown` | 迷你图配置。建议作为快照保存。 |
| `image` | `unknown` | 单元格内图片配置。建议作为快照保存。 |

`value` 是原始输入值。公式、格式化数字、日期等最终显示文本可通过 `getPlainText` 或 `getActiveSheetData` 获取。

### 样式

```ts
interface CellStyle {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  fontFamily?: string
  fontSize?: number
  numberFormat?: NumberFormat
  customNumberFormatCode?: string
  decimalPlaces?: number
  useThousandsSeparator?: boolean
  horizontalAlign?: HorizontalAlign
  verticalAlign?: VerticalAlign
  wrapText?: boolean
  foregroundColor?: string
  backgroundColor?: string
  borderTopStyle?: CellBorderLineStyle | null
  borderRightStyle?: CellBorderLineStyle | null
  borderBottomStyle?: CellBorderLineStyle | null
  borderLeftStyle?: CellBorderLineStyle | null
  borderColor?: string
}
```

`CellStyle` 常用字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `bold` | `boolean` | 是否加粗。 |
| `italic` | `boolean` | 是否斜体。 |
| `underline` | `boolean` | 是否下划线。 |
| `strikethrough` | `boolean` | 是否删除线。 |
| `fontFamily` | `string` | 字体名称。 |
| `fontSize` | `number` | 字号。 |
| `numberFormat` | `NumberFormat` | 数字格式类型。 |
| `customNumberFormatCode` | `string` | 自定义数字格式代码。 |
| `decimalPlaces` | `number` | 小数位数。 |
| `useThousandsSeparator` | `boolean` | 是否使用千分位分隔。 |
| `horizontalAlign` | `HorizontalAlign` | 水平对齐方式。 |
| `verticalAlign` | `VerticalAlign` | 垂直对齐方式。 |
| `wrapText` | `boolean` | 是否自动换行。 |
| `foregroundColor` | `string` | 字体颜色。 |
| `backgroundColor` | `string` | 单元格背景色。 |
| `borderTopStyle` | `CellBorderLineStyle \| null` | 上边框线型。 |
| `borderRightStyle` | `CellBorderLineStyle \| null` | 右边框线型。 |
| `borderBottomStyle` | `CellBorderLineStyle \| null` | 下边框线型。 |
| `borderLeftStyle` | `CellBorderLineStyle \| null` | 左边框线型。 |
| `borderColor` | `string` | 边框颜色。 |

样式类型是公开类型，但建议外部优先把整个 `OfficeExcelWorkbookSnapshot` 当作持久化快照保存，而不是依赖内部渲染细节做局部拼装。

### 合并、图片、图表、水印

```ts
interface OfficeExcelMerge {
  startRow: number
  endRow: number
  startCol: number
  endCol: number
}

interface OfficeExcelFloatingImageObject {
  id: string
  dataUrl: string
  naturalWidth: number
  naturalHeight: number
  fileName?: string | null
  x: number
  y: number
  width: number
  height: number
  anchorMode?: 'move-and-size' | 'move-only' | 'absolute'
  rotation?: number
  opacity?: number
  hyperlinkUrl?: string
  crop?: {
    left?: number
    top?: number
    right?: number
    bottom?: number
  }
}

interface OfficeExcelChartObject {
  id: string
  type: 'bar' | 'horizontal-bar' | 'line' | 'area' | 'pie' | 'radar' | 'combo' | 'scatter'
  title: string
  x: number
  y: number
  width: number
  height: number
  sourceSheetId: string | null
  sourceRange: OfficeExcelSelectionRange | null
  axisSheetId: string | null
  axisRange: OfficeExcelSelectionRange | null
  seriesDirection: 'columns' | 'rows'
  seriesDefinitions: OfficeExcelChartSeriesDefinition[]
  palette: string
  showTitle: boolean
  showLegend: boolean
  showAxes: boolean
  showGridLines: boolean
  showDataLabels: boolean
  categoryAxisTitle?: string
  valueAxisTitle?: string
  secondaryValueAxisTitle?: string
  legendPosition: 'top' | 'bottom' | 'left' | 'right' | 'top-right'
  textFontFamily: string
  textFontSize: number
  textColor: string
  textBold: boolean
  textItalic: boolean
  backgroundColor: string
}

interface OfficeExcelChartSeriesDefinition {
  id: string
  name: string
  nameSheetId: string | null
  nameRange: OfficeExcelSelectionRange | null
  valueSheetId: string | null
  valueRange: OfficeExcelSelectionRange | null
  bubbleSizeSheetId: string | null
  bubbleSizeRange: OfficeExcelSelectionRange | null
  color?: string
  seriesChartType: 'bar' | 'line' | 'area' | null
  axisBinding: 'primary' | 'secondary' | null
  trendline?: OfficeExcelChartTrendline
}

type OfficeExcelChartTrendlineType =
  | 'linear'
  | 'exponential'
  | 'logarithmic'
  | 'power'
  | 'polynomial'
  | 'moving-average'

interface OfficeExcelChartTrendline {
  type: OfficeExcelChartTrendlineType
  name?: string
  forward?: number
  backward?: number
  polynomialOrder?: number
  period?: number
  displayEquation?: boolean
  displayRSquared?: boolean
}

interface OfficeExcelWatermarkSettings {
  text: string
  color: string
  fontSize: number
  rotation: number
  opacity: number
}
```

相关字段说明：

| 类型 | 字段 | 说明 |
| --- | --- | --- |
| `OfficeExcelMerge` | `startRow` / `endRow` | 合并区域起止行号，从 `1` 开始。 |
| `OfficeExcelMerge` | `startCol` / `endCol` | 合并区域起止列号，从 `1` 开始。 |
| `OfficeExcelFloatingImageObject` | `id` | 浮动图片 ID。 |
| `OfficeExcelFloatingImageObject` | `dataUrl` | 图片 data URL。 |
| `OfficeExcelFloatingImageObject` | `naturalWidth` / `naturalHeight` | 图片原始宽高。 |
| `OfficeExcelFloatingImageObject` | `fileName` | 图片文件名，可能为空。 |
| `OfficeExcelFloatingImageObject` | `x` / `y` | 图片在 sheet 内的位置。 |
| `OfficeExcelFloatingImageObject` | `width` / `height` | 图片显示宽高。 |
| `OfficeExcelFloatingImageObject` | `anchorMode` | 导出 `.xlsx` 时的浮动图片锚点行为。`move-and-size` 表示随单元格移动并缩放；`move-only` 表示随单元格移动但不缩放；`absolute` 表示不随单元格移动或缩放。不传时按 `move-only` 处理。 |
| `OfficeExcelFloatingImageObject` | `rotation` | 浮动图片旋转角度，单位是度。导入 `.xlsx` 时会读取 DrawingML 的图片旋转角度；导出 `.xlsx` 时会写回 Excel/WPS 可识别的旋转角度。不传时按 `0` 处理。 |
| `OfficeExcelFloatingImageObject` | `opacity` | 浮动图片透明度，范围 `0` 到 `1`，`1` 表示完全不透明。导入 `.xlsx` 时会读取 DrawingML `alphaModFix`；导出 `.xlsx` 时会写回 Excel/WPS 可识别的图片透明度。不传时按 `1` 处理。 |
| `OfficeExcelFloatingImageObject` | `hyperlinkUrl` | 浮动图片点击跳转链接。导入 `.xlsx` 时会读取 DrawingML 图片超链接；导出 `.xlsx` 时会写成 Excel/WPS 可识别的图片点击链接。它和 `url` 不同，`url` 表示图片资源来源，`hyperlinkUrl` 表示点击图片后的跳转地址。 |
| `OfficeExcelFloatingImageObject` | `crop` | 浮动图片裁剪比例。`left`、`top`、`right`、`bottom` 都是 `0` 到 `1` 的比例值，例如 `left: 0.1` 表示裁掉图片左侧 10%。导入 `.xlsx` 时会读取 DrawingML `srcRect`；导出 `.xlsx` 时会写回 Excel/WPS 可识别的裁剪区域。 |
| `OfficeExcelChartObject` | `id` | 图表 ID，建议使用业务侧稳定 ID。 |
| `OfficeExcelChartObject` | `type` | 图表类型。`bar` 为柱状图，`horizontal-bar` 为条形图，`line` 为折线图，`area` 为面积图，`pie` 为饼图/圆环图，`radar` 为雷达图，`combo` 为组合图，`scatter` 为散点/气泡图。 |
| `OfficeExcelChartObject` | `title` | 图表标题文本。 |
| `OfficeExcelChartObject` | `x` / `y` | 图表在 sheet 内的位置，单位像素。 |
| `OfficeExcelChartObject` | `width` / `height` | 图表显示宽高，单位像素。 |
| `OfficeExcelChartObject` | `sourceSheetId` / `sourceRange` | 图表数据源所在工作表和单元格区域。 |
| `OfficeExcelChartObject` | `axisSheetId` / `axisRange` | 图表分类轴标签区域。为空时会根据数据源自动推断。 |
| `OfficeExcelChartObject` | `seriesDirection` | 数据系列生成方向。`columns` 表示按列生成系列，`rows` 表示按行生成系列。 |
| `OfficeExcelChartObject` | `seriesDefinitions` | 系列明细。用于指定系列名称、值区域、气泡大小区域、组合图系列类型以及主轴/副轴绑定。 |
| `OfficeExcelChartObject` | `palette` | 图表配色方案 ID。建议使用组件内置面板生成或复用快照里的值。 |
| `OfficeExcelChartObject` | `showTitle` | 是否显示图表标题。 |
| `OfficeExcelChartObject` | `showLegend` | 是否显示图例。 |
| `OfficeExcelChartObject` | `showAxes` | 是否显示坐标轴。 |
| `OfficeExcelChartObject` | `showGridLines` | 是否显示主要网格线。 |
| `OfficeExcelChartObject` | `showDataLabels` | 是否显示数据标签。导出 `.xlsx` 时会写成 Excel/WPS 可识别的数据标签配置。 |
| `OfficeExcelChartObject` | `categoryAxisTitle` | 分类轴标题。柱状图/折线图等表示横向分类轴；散点/气泡图中表示 X 轴标题。导出 `.xlsx` 时会写入图表轴标题。 |
| `OfficeExcelChartObject` | `valueAxisTitle` | 主值轴标题。散点/气泡图中表示 Y 轴标题。导出 `.xlsx` 时会写入图表轴标题。 |
| `OfficeExcelChartObject` | `secondaryValueAxisTitle` | 副值轴标题。组合图或系列绑定到副轴时导出为副轴标题。 |
| `OfficeExcelChartObject` | `legendPosition` | 图例位置。`top` 顶部，`bottom` 底部，`left` 左侧，`right` 右侧，`top-right` 右上角。 |
| `OfficeExcelChartObject` | `textFontFamily` / `textFontSize` | 图表标题、轴标题和默认文字的字体与字号。 |
| `OfficeExcelChartObject` | `textColor` | 图表文字颜色，建议使用 `#RRGGBB`。 |
| `OfficeExcelChartObject` | `textBold` / `textItalic` | 图表文字是否加粗、斜体。 |
| `OfficeExcelChartObject` | `backgroundColor` | 图表背景色，建议使用 `#RRGGBB`。 |
| `OfficeExcelChartSeriesDefinition` | `id` | 系列 ID。和自动提取的数据系列匹配时用于稳定排序和配置。 |
| `OfficeExcelChartSeriesDefinition` | `name` | 系列名称。 |
| `OfficeExcelChartSeriesDefinition` | `nameSheetId` / `nameRange` | 系列名称引用的工作表和单元格。为空时使用 `name`。 |
| `OfficeExcelChartSeriesDefinition` | `valueSheetId` / `valueRange` | 系列值区域。 |
| `OfficeExcelChartSeriesDefinition` | `bubbleSizeSheetId` / `bubbleSizeRange` | 气泡图大小区域。非气泡图可为空。 |
| `OfficeExcelChartSeriesDefinition` | `color` | 系列颜色，建议使用 `#RRGGBB`。导入 `.xlsx` 时会读取常见柱状、折线、面积、组合、散点和雷达图的系列填充色或线条色；导出 `.xlsx` 时优先使用该颜色，未设置时回退到图表 `palette`。 |
| `OfficeExcelChartSeriesDefinition` | `seriesChartType` | 组合图中的单个系列类型。为空时按图表默认策略推断。 |
| `OfficeExcelChartSeriesDefinition` | `axisBinding` | 系列绑定的坐标轴。`primary` 为主值轴，`secondary` 为副值轴。 |
| `OfficeExcelChartSeriesDefinition` | `trendline` | 系列趋势线配置。支持柱状图、折线图、面积图、组合图和散点图 `.xlsx` 导入导出；饼图、圆环图、雷达图不导出趋势线。 |
| `OfficeExcelChartTrendline` | `type` | 趋势线类型。`linear` 线性，`exponential` 指数，`logarithmic` 对数，`power` 幂，`polynomial` 多项式，`moving-average` 移动平均。 |
| `OfficeExcelChartTrendline` | `name` | 趋势线名称。为空时由 Excel/WPS 使用默认名称。 |
| `OfficeExcelChartTrendline` | `forward` / `backward` | 趋势线向前/向后预测的周期数。传入负数会按 `0` 处理。 |
| `OfficeExcelChartTrendline` | `polynomialOrder` | 多项式趋势线阶数，仅 `type: 'polynomial'` 生效，导出时限制在 `2` 到 `6`。 |
| `OfficeExcelChartTrendline` | `period` | 移动平均趋势线周期，仅 `type: 'moving-average'` 生效，导出时限制在 `2` 到 `255`。 |
| `OfficeExcelChartTrendline` | `displayEquation` | 是否在图表中显示趋势线公式。 |
| `OfficeExcelChartTrendline` | `displayRSquared` | 是否在图表中显示 R² 值。 |
| `OfficeExcelWatermarkSettings` | `text` | 水印文字。 |
| `OfficeExcelWatermarkSettings` | `color` | 水印颜色。 |
| `OfficeExcelWatermarkSettings` | `fontSize` | 水印字号。 |
| `OfficeExcelWatermarkSettings` | `rotation` | 水印旋转角度。 |
| `OfficeExcelWatermarkSettings` | `opacity` | 水印透明度。 |

图表对象字段较多，外部如果只是持久化用户编辑结果，推荐把它作为工作簿快照的一部分整体保存和恢复；如果业务侧要主动生成图表，建议只依赖上面列出的公开字段，其他内部字段后续可能继续演进。


## 公共类型

包入口只导出稳定 public types，不再直接 `export type * from './types'`。内部命令、网格渲染、上下文菜单等实现类型不会作为长期兼容 API 暴露。

```ts
import type {
  CellBorderLineStyle,
  CellStyle,
  HorizontalAlign,
  NumberFormat,
  OfficeExcelActiveSheetChangePayload,
  OfficeExcelAiObjectTarget,
  OfficeExcelAiTarget,
  OfficeExcelAiTargetCaptureInput,
  OfficeExcelBackgroundImage,
  OfficeExcelAssetContext,
  OfficeExcelAssetReference,
  OfficeExcelCell,
  OfficeExcelChangePayload,
  OfficeExcelCollaborationCommandAck,
  OfficeExcelCollaborationCommandEnvelope,
  OfficeExcelCollaborationCommandReject,
  OfficeExcelCollaborationCommandResult,
  OfficeExcelCollaborationOptions,
  OfficeExcelDownloadJsonOptions,
  OfficeExcelErrorPayload,
  OfficeExcelExportExcelOptions,
  OfficeExcelImportExcelInput,
  OfficeExcelImportExcelOptions,
  OfficeExcelLoadWorkbookOptions,
  OfficeExcelMode,
  OfficeExcelPermissions,
  OfficeExcelPlainTextSheetData,
  OfficeExcelProps,
  OfficeExcelPublicApi,
  OfficeExcelReadyPayload,
  OfficeExcelResolvedAsset,
  OfficeExcelSelectionRange,
  OfficeExcelSheet,
  OfficeExcelToolbarOptions,
  OfficeExcelToolbarTabId,
  OfficeExcelWorkbookSnapshot,
  VerticalAlign,
} from '@norio-office/office-excel'
```

如果外部确实需要新的稳定类型，请先把它加入 `public-types.ts`，并同步更新本 README。
