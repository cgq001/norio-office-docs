---
{"title":"实例方法参考","description":"实例方法参考的接口、使用示例与行为说明。","order":41,"reference":true}
---

本页按主题整理项目公开说明，供完成快速接入后查阅。代码片段中的业务回调、服务地址和存储实现需要由宿主提供。

## 实例 API

通过 `ref` 可以拿到组件对外暴露的方法：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import {
  OfficeExcel,
  type OfficeExcelPublicApi,
  type OfficeExcelWorkbookSnapshot,
} from '@norio-office/office-excel'

const excelRef = ref<OfficeExcelPublicApi | null>(null)
const workbook = ref<OfficeExcelWorkbookSnapshot | null>(null)

async function exportExcel() {
  await excelRef.value?.exportExcel('demo.xlsx')
}

async function uploadExcel() {
  const result = await excelRef.value?.exportExcelBlob({
    type: 'xlsx',
    fileName: 'demo.xlsx',
  })
  if (!result) return

  const formData = new FormData()
  formData.append('file', result.blob, result.fileName)
  formData.append('mimeType', result.mimeType)
  formData.append('size', String(result.size))
  await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })
}
</script>

<template>
  <OfficeExcel ref="excelRef" v-model="workbook" />
  <button type="button" @click="exportExcel">导出 Excel</button>
  <button type="button" @click="uploadExcel">生成文件并上传</button>
</template>
```

```ts
type ExcelExportType = 'xlsx' | 'xls'

interface ExportExcelBlobOptions {
  type?: ExcelExportType
  fileName?: string
}

interface ExportExcelBlobResult {
  blob: Blob
  fileName: string
  mimeType: string
  size: number
}

type OfficeExcelCreateTableOptions = Partial<Pick<
  OfficeExcelTableObject,
  'name' | 'headerRow' | 'totalRow' | 'bandedRows' | 'filterEnabled' | 'styleId'
>>

interface OfficeExcelPublicApi {
  setFileName: (fileName: string) => void
  importExcel: (source: OfficeExcelImportExcelInput, options?: OfficeExcelImportExcelOptions) => Promise<OfficeExcelWorkbookSnapshot>
  exportExcel: (options?: OfficeExcelExportExcelOptions | string) => Promise<string>
  exportExcelBlob: (options?: ExportExcelBlobOptions) => Promise<ExportExcelBlobResult>
  exportJson: () => OfficeExcelWorkbookSnapshot
  downloadJson: (options?: OfficeExcelDownloadJsonOptions | string) => string
  getWorkbook: () => OfficeExcelWorkbookSnapshot
  setWorkbook: (workbook: OfficeExcelWorkbookSnapshot, options?: OfficeExcelLoadWorkbookOptions) => void
  serialize: () => string
  load: (snapshot: string | OfficeExcelWorkbookSnapshot, options?: OfficeExcelLoadWorkbookOptions) => void
  applyCollaborationCommandResult: (result: OfficeExcelCollaborationCommandResult) => void
  getSelection: () => OfficeExcelSelectionRange
  setSelection: (selection: OfficeExcelSelectionRange) => void
  getSelections: () => OfficeExcelSelectionRange[]
  setSelections: (selections: OfficeExcelSelectionRange[]) => void
  addSelection: (selection: OfficeExcelSelectionRange) => void
  clearSelections: () => void
  getPlainText: {
    (): OfficeExcelPlainTextSheetData[]
    (sheetId: string): string[][]
  }
  getActiveSheetData: () => string[][]
  findText: (query: string, options?: OfficeExcelFindOptions) => OfficeExcelFindMatch[]
  replaceText: (query: string, replacement: string, options?: OfficeExcelReplaceOptions) => OfficeExcelReplaceResult
  getFormulaDependencyGraph: () => OfficeExcelFormulaDependencyGraph
  getFormulaRecalculationPlan: (changes: Array<Partial<OfficeExcelFormulaCellAddress> & { row: number; col: number }>) => OfficeExcelFormulaRecalculationPlan
  recalculateFormulas: (changes: Array<Partial<OfficeExcelFormulaCellAddress> & { row: number; col: number }>) => OfficeExcelFormulaRecalculationResult
  getLastFormulaRecalculation: () => OfficeExcelFormulaRecalculationResult | null
  getFormulaSuggestions: (query?: string, limit?: number) => OfficeExcelFormulaSuggestion[]
  getFormulaFunctionHelp: (formula: string, caret?: number) => OfficeExcelFormulaFunctionHelp | null
  getCommandHistory: () => OfficeExcelCommandHistoryItem[]
  createNamedRange: (name: string, range: OfficeExcelSelectionRange, sheetId?: string) => OfficeExcelNamedRange
  removeNamedRange: (nameOrId: string) => void
  getNamedRanges: () => OfficeExcelNamedRange[]
  createTable: (range: OfficeExcelSelectionRange, options?: OfficeExcelCreateTableOptions) => OfficeExcelTableObject
  removeTable: (tableId: string) => void
  getTables: (sheetId?: string) => OfficeExcelTableObject[]
  createPivotTable: (config: OfficeExcelPivotTableConfig) => OfficeExcelPivotTableResult
  getPivotTables: (sheetId?: string) => OfficeExcelPivotTableResult[]
  refreshPivotTable: (sheetId?: string) => OfficeExcelPivotTableResult
  refreshAllPivotTables: (sheetIds?: string[]) => OfficeExcelPivotTableResult[]
  applySort: (range: OfficeExcelSelectionRange, rules: OfficeExcelSortRule[], options?: OfficeExcelApplySortOptions) => OfficeExcelSortState | null
  clearSort: (range?: OfficeExcelSelectionRange) => void
  getSort: (sheetId?: string) => OfficeExcelSortState | null
}
```

| 方法 | 参数 | 返回值 | 中文说明 |
| --- | --- | --- | --- |
| `setFileName(fileName)` | 非空且不超过 255 个字符的文件名。 | `void` | 从组件外修改当前文件名；同时更新工作簿快照并触发 `file-name-change` 和常规 `change` 事件。 |
| `importExcel(source, options?)` | `source` 是 Excel 文件或二进制数据；`options` 是导入配置。 | `Promise<OfficeExcelWorkbookSnapshot>` | 导入 `.xlsx` / `.xlsm`，解析后替换当前工作簿。会读取单元格、样式、合并单元格、隐藏行列、冻结窗格、原生 Table、基础数据验证和常见条件格式，包括公式条件格式。受 `permissions.import` 影响。 |
| `exportExcel(options?)` | 可传文件名字符串，或 `{ fileName, silent }`。 | `Promise<string>` | 导出并下载 `.xlsx` 文件，返回实际下载文件名。受 `permissions.export` 影响。 |
| `exportExcelBlob(options?)` | `options.type` 支持 `xlsx` / `xls`，`options.fileName` 是可选文件名。 | `Promise<ExportExcelBlobResult>` | 只生成 Excel 文件 Blob，不触发浏览器下载，适合 SDK 上传。返回真实 Excel 二进制、实际文件名、MIME 类型和文件大小。导出内容与组件内“导出 Excel”按钮使用同一套导出链路。受 `permissions.export` 影响。 |
| `exportJson()` | 无 | `OfficeExcelWorkbookSnapshot` | 返回当前完整工作簿快照，不触发下载，不受导出权限影响。 |
| `downloadJson(options?)` | 可传文件名字符串，或 `{ fileName, pretty }`。 | `string` | 下载当前工作簿 JSON 文件，返回实际下载文件名。受 `permissions.export` 影响。 |
| `getWorkbook()` | 无 | `OfficeExcelWorkbookSnapshot` | 获取当前完整工作簿快照，适合业务侧保存。 |
| `setWorkbook(workbook, options?)` | `workbook` 是完整快照；`options` 控制选区、历史和 change 来源。 | `void` | 用外部工作簿快照覆盖当前组件数据。 |
| `serialize()` | 无 | `string` | 将当前工作簿序列化为 JSON 字符串，适合存入数据库或 localStorage。 |
| `load(snapshot, options?)` | `snapshot` 是 JSON 字符串或完整快照；`options` 控制加载行为。 | `void` | 加载 JSON 字符串或工作簿快照。 |
| `applyCollaborationCommandResult(result)` | `result` 是服务端返回的 command ack/reject。 | `void` | 协同命令结果回灌入口。异步 WebSocket 返回结果时调用；reject 会触发本地乐观修改回滚。 |
| `getSelection()` | 无 | `OfficeExcelSelectionRange` | 获取当前选区。 |
| `setSelection(selection)` | `selection` 是要设置的选区。 | `void` | 设置当前选区。 |
| `getSelections()` | 无 | `OfficeExcelSelectionRange[]` | 获取当前多选区列表。数组最后一项是主选区，兼容旧的 `getSelection()`。 |
| `setSelections(selections)` | `selections` 是多个选区数组。 | `void` | 设置多个选区。组件会把最后一项作为主选区，并在画布上显示其余附加选区。 |
| `addSelection(selection)` | `selection` 是要追加的选区。 | `void` | 在当前多选区列表末尾追加一个选区，适合业务侧做 Ctrl/Command 多区域选择。 |
| `clearSelections()` | 无 | `void` | 清空附加选区，只保留当前主选区。 |
| `moveRange(sourceRange, targetRow, targetCol)` | `sourceRange` 是要移动的源区域；`targetRow` / `targetCol` 是目标左上角行列号。 | `OfficeExcelSelectionRange` | 移动单元格区域。会一起移动值、样式、超链接、单元格备注、单元格内图片、完整包含在源区域内的合并区域、数据验证和条件格式；会拒绝和表对象重叠的移动。 |
| `getPlainText()` | 无 | `OfficeExcelPlainTextSheetData[]` | 获取整本工作簿所有工作表的纯文本二维数组。 |
| `getPlainText(sheetId)` | `sheetId` 是工作表 ID。 | `string[][]` | 获取指定工作表的纯文本二维数组。找不到 `sheetId` 时会抛错。 |
| `getActiveSheetData()` | 无 | `string[][]` | 获取当前工作表纯文本二维数组。 |
| `findText(query, options?)` | `query` 是查找文本；`options` 是范围、大小写、查值/查公式等配置。 | `OfficeExcelFindMatch[]` | 在当前工作簿中查找单元格文本或公式文本。 |
| `replaceText(query, replacement, options?)` | `query` 是查找文本；`replacement` 是替换文本；`options` 是替换配置。 | `OfficeExcelReplaceResult` | 替换工作簿内容。公式单元格默认替换公式文本，不会把公式计算结果误写成普通值。 |
| `getFormulaDependencyGraph()` | 无 | `OfficeExcelFormulaDependencyGraph` | 获取公式依赖图，包含每个公式单元格依赖的单元格、区域、整行或整列引用。 |
| `getFormulaRecalculationPlan(changes)` | `changes` 是已变更的单元格数组，至少传 `row`、`col`，建议同时传 `sheetId`。 | `OfficeExcelFormulaRecalculationPlan` | 根据变更单元格计算受影响的公式链路，返回按依赖顺序排列的公式单元格。 |
| `recalculateFormulas(changes)` | `changes` 是已变更的单元格数组，至少传 `row`、`col`，建议同时传 `sheetId`。 | `OfficeExcelFormulaRecalculationResult` | 执行一次受影响公式重算，返回重算计划以及每个受影响公式当前的公式文本、原始值和显示值。适合协作层、业务侧校验和性能观测。 |
| `getLastFormulaRecalculation()` | 无 | `OfficeExcelFormulaRecalculationResult \| null` | 获取最近一次内容类命令产生的公式增量重算结果。适合外部历史面板、性能观测、协作调试或局部渲染失效；如果最近没有受影响公式则返回 `null`。返回的是快照，外部修改不会影响组件内部状态。 |
| `getFormulaSuggestions(query?, limit?)` | `query` 是用户输入的函数名前缀或公式片段；`limit` 是最大返回数量。 | `OfficeExcelFormulaSuggestion[]` | 获取公式函数提示，包含函数名、分类、签名、中文说明和示例。 |
| `getFormulaFunctionHelp(formula, caret?)` | `formula` 是完整公式文本；`caret` 是光标位置，不传时使用公式末尾。 | `OfficeExcelFormulaFunctionHelp \| null` | 获取当前光标所在函数的参数提示，包含当前函数、当前参数下标、参数区间、括号位置和参数说明。 |
| `getCommandHistory()` | 无 | `OfficeExcelCommandHistoryItem[]` | 获取当前可撤销命令历史摘要。每条记录包含命令 ID、payload、执行前后选区、影响范围、目标工作表、来源、耗时和时间戳，不包含内部 before/after workbook 大对象。 |
| `createNamedRange(name, range, sheetId?)` | `name` 是命名区域名称；`range` 是引用区域；`sheetId` 不传时使用当前工作表。 | `OfficeExcelNamedRange` | 创建或覆盖一个工作簿级命名区域。公式中可以直接使用，例如 `=SUM(SalesAmount)`。 |
| `removeNamedRange(nameOrId)` | `nameOrId` 是命名区域名称或 ID。 | `void` | 删除命名区域。删除后引用该名称的公式会显示引用错误。 |
| `getNamedRanges()` | 无 | `OfficeExcelNamedRange[]` | 获取当前工作簿全部命名区域，返回拷贝，外部修改不会直接影响组件内部状态。 |
| `createTable(range, options?)` | `range` 是要转换为表对象的单元格区域；`options` 是表名、表头、汇总行、筛选和样式配置。 | `OfficeExcelTableObject` | 在当前工作表创建表对象。会拒绝和已有表对象或合并单元格重叠的区域。 |
| `removeTable(tableId)` | `tableId` 是表对象 ID。 | `void` | 删除指定表对象。如果表对象自带的筛选范围正好命中当前筛选，会一并清理筛选状态。 |
| `getTables(sheetId?)` | `sheetId` 是可选工作表 ID。 | `OfficeExcelTableObject[]` | 获取当前工作表或指定工作表的表对象列表。返回的是拷贝，外部修改不会直接影响组件内部状态。 |
| `createPivotTable(config)` | `config` 是数据源、行字段、列字段、值字段和聚合方式配置。 | `OfficeExcelPivotTableResult` | 根据源区域生成一个只读的数据透视结果工作表。当前是 Web 在线版透视表雏形，不依赖桌面 Excel 进程。 |
| `getPivotTables(sheetId?)` | `sheetId` 是可选透视结果工作表 ID。 | `OfficeExcelPivotTableResult[]` | 获取已有透视表结果快照。不传时返回工作簿内全部透视表；传入普通工作表或不存在的 ID 时返回空数组。适合做透视表管理面板、刷新按钮状态或定位结果表。 |
| `refreshPivotTable(sheetId?)` | `sheetId` 是可选透视结果工作表 ID；不传时刷新当前工作表。 | `OfficeExcelPivotTableResult` | 按创建透视表时保存的源区域和字段配置，重新计算已有透视结果表。结果表 ID 和名称保持不变。 |
| `refreshAllPivotTables(sheetIds?)` | `sheetIds` 是可选透视结果工作表 ID 数组；不传时刷新工作簿内全部透视结果表。 | `OfficeExcelPivotTableResult[]` | 批量刷新透视表。适合导入数据、接口回填或表对象扩展后一次性更新所有透视结果。 |
| `applySort(range, rules, options?)` | `range` 是排序覆盖区域；`rules` 是排序条件数组；`options.hasHeader` 控制首行是否作为表头。 | `OfficeExcelSortState \| null` | 在当前工作表应用多级排序。会走统一命令链、撤销历史和协作命令。 |
| `clearSort(range?)` | `range` 是可选排序区域；不传时清除当前活动排序区域。 | `void` | 取消排序并按组件保存的原始行顺序恢复数据。 |
| `getSort(sheetId?)` | `sheetId` 是可选工作表 ID。 | `OfficeExcelSortState \| null` | 获取当前工作表或指定工作表的排序状态。返回的是拷贝，外部修改不会直接影响组件内部状态。 |
| `applyFilter(range, col, state, options?)` | `range` 是筛选覆盖区域；`col` 是要应用筛选的列号；`state` 是筛选条件；`options` 控制是否和已有筛选合并。 | `OfficeExcelFilterState \| null` | 在当前工作表应用高级筛选。支持非空、值列表、填充色、文字色、文本条件、数值条件，并走统一命令链、撤销历史和协作命令。 |
| `clearFilter(sheetId?)` | `sheetId` 是可选工作表 ID。 | `void` | 清除当前工作表或指定工作表的筛选状态。 |
| `getFilter(sheetId?)` | `sheetId` 是可选工作表 ID。 | `OfficeExcelFilterState \| null` | 获取当前工作表或指定工作表的筛选状态。返回的是拷贝，外部修改不会直接影响组件内部状态。 |

`exportExcelBlob` 参数说明：

| 字段 | 类型 | 默认值 | 中文说明 |
| --- | --- | --- | --- |
| `type` | `ExcelExportType` | `'xlsx'` | 导出文件类型。当前组件导出链路完整支持 `xlsx`；旧版 BIFF `.xls` 二进制暂不支持，传 `xls` 会抛出错误，避免生成扩展名和内容不一致的假文件。 |
| `fileName` | `string` | 当前工作簿名或默认名 | 导出文件名。可以不带扩展名，组件会按 `type` 自动补齐扩展名。 |

`ExportExcelBlobResult` 返回字段说明：

| 字段 | 类型 | 中文说明 |
| --- | --- | --- |
| `blob` | `Blob` | 真实 Excel 文件二进制 Blob，可直接放入 `FormData` 上传。 |
| `fileName` | `string` | 组件最终生成的文件名，包含扩展名。 |
| `mimeType` | `string` | 文件 MIME 类型，`xlsx` 为 `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`。 |
| `size` | `number` | Blob 字节大小，等同于 `blob.size`，方便 SDK 上传前校验。 |

`OfficeExcelCommandHistoryItem` 字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | 历史记录 ID，仅用于前端观测和排查。 |
| `commandId` | `OfficeExcelCommandId \| 'workbook.load' \| 'command.batch'` | 触发这条历史的命令 ID。普通编辑来自命令链；通过 `load` / `setWorkbook` 导入快照时为 `workbook.load`；一次 UI 操作合并多条命令时为 `command.batch`。 |
| `payload` | `unknown` | 命令参数的只读拷贝。不同命令结构不同，业务侧不要直接修改它。`command.batch` 时结构为 `{ commands: Array<{ commandId, payload }> }`。 |
| `selectionBefore` | `OfficeExcelSelectionRange` | 命令执行前的主选区。 |
| `selectionAfter` | `OfficeExcelSelectionRange` | 命令执行后的主选区。 |
| `createdAt` | `number` | 历史记录创建时间戳，单位毫秒。 |
| `sheetId` | `string \| undefined` | 触发该命令时的目标工作表 ID。工作簿级加载或特殊命令也会尽量记录当时的活动工作表 ID。 |
| `affectedRanges` | `OfficeExcelSelectionRange[] \| undefined` | 该命令实际影响的单元格区域列表。普通单格编辑通常只有一个区域，批量命令会返回多个区域；不直接修改返回值，重新调用 `getCommandHistory()` 获取最新快照。 |
| `formulaRecalculation` | `OfficeExcelFormulaRecalculationResult \| undefined` | 内容类命令触发的公式增量重算结果。包含受影响公式、`affectedRanges`、`recalculatedCells` 和 `recalculatedCellMap`，可用于历史面板、协作调试、性能观测或后续局部渲染失效；纯样式命令通常为空。 |
| `durationMs` | `number \| undefined` | 命令在组件内部执行和记录历史的耗时，单位毫秒，用于性能观测和问题排查。 |
| `source` | `'local' \| 'collab' \| 'import'` | 历史来源。当前本地编辑为 `local`，加载/导入快照为 `import`，协作回灌预留 `collab`。 |

### findText / replaceText

组件内置查找替换面板：

| 快捷键 | 说明 |
| --- | --- |
| `Ctrl+F` / `Command+F` | 打开查找面板。 |
| `Ctrl+H` / `Command+H` | 打开替换面板。 |

面板支持查找上一个/下一个、替换当前项、全部替换、区分大小写、整格匹配、仅当前工作表、按显示值/公式/两者查找。组件内部面板和下面的实例 API 共用同一套查找替换核心逻辑。

```ts
const matches = excelRef.value?.findText('销售额', {
  sheetId: workbook.value?.activeSheetId,
  matchCase: false,
  wholeCell: false,
  lookIn: 'both',
  maxResults: 50,
})

const result = excelRef.value?.replaceText('旧部门', '新部门', {
  sheetId: workbook.value?.activeSheetId,
  lookIn: 'values',
  replaceAll: true,
})
```

`OfficeExcelFindOptions` 字段：

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `sheetId` | `string` | 查找全部工作表 | 限定只查找指定工作表。 |
| `range` | `OfficeExcelSelectionRange` | 工作表全部有内容区域 | 限定查找范围。 |
| `matchCase` | `boolean` | `false` | 是否区分大小写。 |
| `wholeCell` | `boolean` | `false` | 是否要求整个单元格文本完全匹配。 |
| `lookIn` | `'values' \| 'formulas' \| 'both'` | `'values'` | 查找显示值、公式文本，或两者都查。 |
| `maxResults` | `number` | 不限制 | 最大返回匹配数量。 |

`OfficeExcelReplaceOptions` 继承 `OfficeExcelFindOptions`，并额外支持：

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `replaceAll` | `boolean` | `true` | 是否替换全部匹配。传 `false` 时只替换第一处。 |

### 多选区 API

组件保留 `getSelection()` / `setSelection()` 的单选区 API，同时提供多选区 API。多选区数组中最后一项是主选区，公式栏、名称框、协作光标和大部分旧逻辑仍读取主选区；前面的项目会作为附加选区显示在画布上。

```ts
excelRef.value?.setSelections([
  {
    startRow: 2,
    startCol: 1,
    endRow: 4,
    endCol: 2,
    anchorRow: 2,
    anchorCol: 1,
    mode: 'cell',
  },
  {
    startRow: 8,
    startCol: 4,
    endRow: 8,
    endCol: 6,
    anchorRow: 8,
    anchorCol: 4,
    mode: 'cell',
  },
])

const selections = excelRef.value?.getSelections()

excelRef.value?.addSelection({
  startRow: 12,
  startCol: 2,
  endRow: 12,
  endCol: 2,
  anchorRow: 12,
  anchorCol: 2,
  mode: 'cell',
})

excelRef.value?.clearSelections()
```

当前版本已支持 Shift 单击从当前锚点扩展选区；也支持 Ctrl/Command 单击追加单元格选区，或按住 Ctrl/Command 拖拽追加一块区域，并支持对多个选区统一应用常见样式，例如加粗、字号、前景色、背景色等。`Delete` / `Backspace` 会清除所有选区内容；右键菜单和工具栏的清除内容、清除格式、全部清除也会作用于全部选区。

复制多个不连续选区时，组件会向系统剪贴板写入纯文本和 HTML：每个选区保持自己的二维结构，选区之间用空行分隔，便于粘贴到文本编辑器、WPS、Excel 或其他表格工具中。组件内部会额外保存结构化多选区剪贴板，`Ctrl+V` 或右键粘贴会按源选区之间的相对位置粘贴到目标左上角；多选区剪切也会在粘贴完成后清空原区域。当前图表数据源、合并单元格等高阶场景仍以主选区为准，后续会继续纳入多选区命令链。

### 高级排序 API

`applySort` 用于从组件外部应用单列或多级排序。它和组件内置排序菜单、撤销历史、协作命令共用同一套命令链。组件内置的“自定义排序”面板也使用同一套 `OfficeExcelSortRule`，支持按单元格值、填充色或文字色排序。

如果当前工作表已经启用筛选，并且排序区域覆盖当前筛选区域，组件会只重排筛选命中的可见数据行；未命中的隐藏行保持在原行位。这样可以支持“筛选后只对结果排序”的常见 Excel 使用方式。没有筛选，或排序区域没有覆盖当前筛选区域时，会按普通连续区域排序。

```ts
excelRef.value?.applySort(
  {
    startRow: 1,
    startCol: 1,
    endRow: 100,
    endCol: 5,
    anchorRow: 1,
    anchorCol: 1,
    mode: 'cell',
  },
  [
    { col: 2, direction: 'asc' },
    { col: 5, direction: 'desc' },
  ],
  { hasHeader: true },
)

const sortState = excelRef.value?.getSort()

excelRef.value?.clearSort()
```

`OfficeExcelSortRule` 字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `col` | `number` | 排序列号，从 `1` 开始。必须落在 `range.startCol` 到 `range.endCol` 内。 |
| `direction` | `'asc' \| 'desc'` | 排序方向。`asc` 为升序，`desc` 为降序。 |
| `sortOn` | `'values' \| 'background-color' \| 'foreground-color'` | 可选排序依据。默认 `values` 表示按单元格显示值排序；`background-color` 表示按填充色排序；`foreground-color` 表示按文字色排序。 |
| `color` | `string` | 颜色排序的目标颜色，例如 `#ff0000`。当 `sortOn` 是颜色排序并传入 `color` 时，`direction: 'asc'` 会把命中颜色的行排到前面，`direction: 'desc'` 会把命中颜色的行排到后面；不传 `color` 时按颜色值本身排序，空颜色靠后。 |
| `customOrder` | `string[]` | 可选自定义排序序列。命中序列的值会按数组顺序排序，例如 `['高', '中', '低']` 或 `['未开始', '进行中', '已完成']`；未命中的值排在命中值后面，并继续使用普通文本/数字规则比较。`direction: 'desc'` 会反向使用该序列。 |

`OfficeExcelApplySortOptions` 字段：

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `hasHeader` | `boolean` | `false` | 是否把排序区域首行作为表头。为 `true` 时首行不参与排序，数据从下一行开始排序。 |

`OfficeExcelSortState` 字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `col` | `number` | 主排序列。多级排序时等于 `rules[0].col`。 |
| `direction` | `'asc' \| 'desc'` | 主排序方向。多级排序时等于 `rules[0].direction`。 |
| `startRow` / `endRow` | `number` | 实际参与排序的数据行范围。传 `hasHeader: true` 时，`startRow` 会从表头下一行开始。 |
| `startCol` / `endCol` | `number` | 排序覆盖的列范围。 |
| `rules` | `OfficeExcelSortRule[]` | 多级排序规则，按数组顺序依次比较。 |

### 高级筛选 API

`applyFilter` 用于从组件外部应用筛选条件。它和组件内置筛选面板、撤销历史、协作命令共用同一套命令链。

```ts
excelRef.value?.applyFilter(
  {
    startRow: 1,
    startCol: 1,
    endRow: 100,
    endCol: 5,
    anchorRow: 1,
    anchorCol: 1,
    mode: 'cell',
  },
  3,
  {
    mode: 'condition',
    conditionJoin: 'and',
    conditions: [
      { type: 'number', operator: 'gte', value: '1000' },
      { type: 'number', operator: 'lt', value: '5000' },
    ],
  },
)

const filterState = excelRef.value?.getFilter()

excelRef.value?.clearFilter()
```

`OfficeExcelFilterColumnState` 字段：

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `mode` | `'non-empty' \| 'values' \| 'colors' \| 'condition' \| 'background-color' \| 'foreground-color'` | 必填 | 筛选模式。`non-empty` 表示保留非空值；`values` 表示按值列表保留；`colors` 表示按填充色或文字色保留；`condition` 表示按文本或数值条件保留。`background-color` / `foreground-color` 是兼容旧状态的单色筛选模式。 |
| `selectedValues` | `string[]` | `undefined` | `mode` 为 `values` 时使用。只有显示值在该数组里的行会保留。 |
| `selectedColor` | `string` | `undefined` | 兼容旧状态的单色筛选字段。新代码建议使用 `selectedFillColors` 或 `selectedTextColors`。 |
| `selectedFillColors` | `string[]` | `undefined` | `mode` 为 `colors` 或 `background-color` 时使用。只有填充色命中的行会保留。颜色会按组件内部规则归一化。 |
| `selectedTextColors` | `string[]` | `undefined` | `mode` 为 `colors` 或 `foreground-color` 时使用。只有文字色命中的行会保留。超链接和负数红字会按显示效果参与判断。 |
| `conditionJoin` | `'and' \| 'or'` | `'or'` | 多个条件之间的关系。`and` 表示全部满足，`or` 表示满足任意一个。 |
| `conditions` | `OfficeExcelFilterConditionClause[]` | `undefined` | 条件筛选列表。当前支持文本条件和数值条件。 |
| `matchedRows` | `number[]` | 由组件计算 | 筛选命中的行号。外部调用 `applyFilter` 时不需要传，组件会按当前工作表数据重新计算。 |

`OfficeExcelFilterConditionClause` 字段：

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `type` | `'none' \| 'text' \| 'number'` | 必填 | 条件类型。`none` 表示空条件；`text` 按显示文本判断；`number` 按单元格原始数值判断。 |
| `operator` | 文本或数值操作符 | `undefined` | 条件操作符。文本支持 `eq`、`ne`、`starts-with`、`ends-with`、`contains`、`not-contains`；数值支持 `eq`、`ne`、`gt`、`gte`、`lt`、`lte`、`between`。 |
| `value` | `string` | `''` | 第一个条件值。文本条件按字符串比较，数值条件会转换为数字。 |
| `secondaryValue` | `string` | `''` | 第二个条件值。仅 `operator` 为 `between` 时使用。 |

`OfficeExcelApplyFilterOptions` 字段：

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `mergeWithExisting` | `boolean` | `false` | 是否和当前已有筛选合并。传 `true` 时可以形成多列组合筛选，最终显示行需要同时命中所有活跃列筛选。 |

### 常用快捷键

| 快捷键 | 说明 |
| --- | --- |
| `Ctrl+Z` / `Command+Z` | 撤销。 |
| `Ctrl+Y` / `Command+Y` | 重做。 |
| `Ctrl+C` / `Command+C` | 复制当前选区。 |
| `Ctrl+X` / `Command+X` | 剪切当前选区。 |
| `Ctrl+V` / `Command+V` | 粘贴。 |
| `Delete` / `Backspace` | 清除当前选区内容。 |
| `F2` | 进入当前单元格编辑。 |
| `Ctrl+A` / `Command+A` | 全选当前工作表。 |
| `Ctrl+B` / `Command+B` | 切换当前选区加粗。 |
| `Ctrl+I` / `Command+I` | 切换当前选区斜体。 |
| `Ctrl+U` / `Command+U` | 切换当前选区下划线。 |
| `Ctrl+1` / `Command+1` | 打开单元格格式对话框。 |
| `Ctrl+K` / `Command+K` | 打开单元格链接对话框，用于插入或编辑当前活动单元格的网页/工作表链接。 |
| `Alt+=` | 自动求和：优先识别当前单元格上方连续数字区域，没有上方数据时识别左侧连续数字区域，并写入 `SUM` 公式。 |
| `Ctrl+;` / `Command+;` | 在当前活动单元格插入本机当前日期，格式为 `YYYY-MM-DD`。 |
| `Ctrl+Shift+;` / `Command+Shift+;` | 在当前活动单元格插入本机当前时间，格式为 `HH:mm`。 |
| `Ctrl+Shift+=` / `Command+Shift+=` | 插入当前选区：行选区会在上方插入等量行，列选区会在左侧插入等量列，普通单元格选区会执行“插入单元格并下移”。 |
| `Ctrl+-` / `Command+-` | 删除当前选区：行选区会删除整行，列选区会删除整列，普通单元格选区会执行“删除单元格并上移”。 |
| `Shift+方向键` | 以当前锚点为固定点扩展或收缩选区。 |
| `Ctrl+方向键` / `Command+方向键` | 跳到当前方向的数据边界；如果前方为空，则跳到下一个有内容的单元格或工作表边界。 |
| `Ctrl+Shift+方向键` / `Command+Shift+方向键` | 以当前锚点为固定点扩展选区到数据边界。 |
| `Ctrl+Shift+L` / `Command+Shift+L` | 按当前选区切换筛选：没有筛选时启用当前选区筛选，已有筛选时取消当前工作表筛选。 |
| `Home` | 跳到当前行第一列。 |
| `Shift+Home` | 以当前锚点为固定点扩展选区到当前行第一列。 |
| `Ctrl+D` / `Command+D` | 向下填充：复制选区第一行到下方；单个单元格时复制上方单元格。 |
| `Ctrl+R` / `Command+R` | 向右填充：复制选区第一列到右侧；单个单元格时复制左侧单元格。 |
| `Ctrl+Space` / `Command+Space` | 选择当前列。 |
| `Shift+Space` | 选择当前行。 |
| `Ctrl+Home` / `Command+Home` | 跳到 `A1`。 |
| `Ctrl+End` / `Command+End` | 跳到当前工作表最后一个有内容或样式的单元格。 |
| `Ctrl+Shift+Home` / `Command+Shift+Home` | 以当前锚点为固定点扩展选区到 `A1`。 |
| `Ctrl+Shift+End` / `Command+Shift+End` | 以当前锚点为固定点扩展选区到最后使用单元格。 |
| `Ctrl+PageUp` / `Command+PageUp` | 切换到上一个可见工作表。 |
| `Ctrl+PageDown` / `Command+PageDown` | 切换到下一个可见工作表。 |

### 拖拽填充

选中单元格或区域后，可以拖动选区右下角的填充柄做 `range.autofill`。拖拽填充会走统一命令链，并受只读、工作表保护、协作锁定和抢占规则约束。

| 能力 | 说明 |
| --- | --- |
| 四向填充 | 支持向下、向上、向右、向左拖拽。 |
| 公式偏移 | 公式里的相对引用会按目标单元格偏移，例如 `=SUM(A6:B6)` 向下填充会变成 `=SUM(A7:B7)`；整列/整行引用也会随方向偏移，例如 `A:A` 向右变成 `B:B`、`1:1` 向下变成 `2:2`；绝对引用如 `$A$1`、`$A:$A`、`$1:$1` 会保持不变。 |
| 数字序列 | `1、2` 这类等差数字会继续递推；单个数字按步长 `1` 推断。 |
| 日期序列 | 支持 `2026-06-18`、`2026/6/18`、`2026年06月18日` 这类日期文本按天递推，并保留原始分隔符和补零格式。 |
| 文本序列 | 支持中文星期、中文月份、英文月份缩写和英文月份全称，例如 `周一` 可填充为 `周二、周三`，`三月` 向左填充为 `二月、一月`。 |
| 数据格式保护 | 下拉、复选、进度等特殊列格式默认按复制处理，不做序列推断。 |

### 移动单元格区域

`moveRange` 是拖拽移动区域的核心能力。组件内部已经接入选区边框拖拽：选中一块单元格后拖动蓝色选区边框，可以把整块区域移动到新的位置；组件外部也可以用下面的实例 API 做业务侧按钮或快捷入口。

```ts
const targetRange = excelRef.value?.moveRange(
  {
    startRow: 2,
    startCol: 1,
    endRow: 6,
    endCol: 3,
    anchorRow: 2,
    anchorCol: 1,
    mode: 'cell',
  },
  10,
  5,
)
```

移动时会覆盖目标区域已有单元格内容。组件会移动源区域里的值、样式、超链接、单元格备注、单元格内图片、sparkline、完整包含在源区域内的合并区域、数据验证和条件格式；源区域会被清空。当前版本会拒绝源区域或目标区域与表对象重叠，避免破坏表对象结构。浮动图片和图表仍然通过各自的拖拽能力移动，不跟随普通单元格区域移动。

### 粘贴特殊

复制单元格区域后，右键菜单的“粘贴”子菜单支持以下模式。所有模式都会走组件内部统一命令链，因此会和只读、工作表保护、协作锁定、撤销历史等规则保持一致。

| 菜单项 | 命令 ID | 说明 |
| --- | --- | --- |
| `保留源格式` | `clipboard.paste-range` | 粘贴源单元格原始值、公式、样式、超链接、单元格备注和列格式识别信息。公式会按目标位置偏移相对引用。 |
| `合并格式` | `clipboard.paste-merge-style` | 粘贴源值，并把源样式合并到目标原有样式上。 |
| `仅粘贴格式` | `clipboard.paste-format` | 只复制源单元格样式和列格式识别信息，不改变目标值。 |
| `仅粘贴公式` | `clipboard.paste-formulas` | 粘贴源单元格原始值。公式会按目标位置偏移相对引用，但保留目标原有样式。 |
| `仅粘贴边框` | `clipboard.paste-borders` | 只复制边框相关样式，不改变目标值、填充色、字体等其它样式。 |
| `仅粘贴列宽` | `clipboard.paste-column-widths` | 只复制源区域列宽到目标起始列，不改变任何单元格内容。 |
| `仅粘贴条件格式` | `clipboard.paste-conditional-formats` | 只复制源区域内命中的条件格式规则，不改变目标值、普通样式、数据验证或备注；规则范围和公式引用会按目标位置偏移。 |
| `仅粘贴超链接` | `clipboard.paste-hyperlinks` | 只复制源单元格超链接，不改变目标值、样式、数据验证、条件格式或备注；源单元格没有超链接时会清除目标对应单元格的超链接。 |
| `运算粘贴：加/减/乘/除` | `clipboard.paste-operation` | 把剪贴板中的数值和目标单元格显示值做加、减、乘、除运算，结果写回目标单元格并保留目标原有样式；非数值或除以 0 会跳过。 |
| `跳过空单元格` | `clipboard.paste-skip-blanks` | 粘贴时源区域里的空白单元格不会覆盖目标已有内容；非空单元格按普通粘贴处理。 |
| `仅粘贴验证` | `clipboard.paste-validation` | 只复制源单元格的数据验证规则，不改变目标值和样式；源单元格没有验证时会清除目标对应单元格的验证。 |
| `仅粘贴备注` | `clipboard.paste-notes` | 只复制源单元格备注，不改变目标值、样式、超链接和验证；源单元格没有备注时会清除目标对应单元格的备注。 |
| `仅粘贴值` | `clipboard.paste-values` | 粘贴显示值，不保留公式。 |
| `转置行列` | `clipboard.paste-transpose` | 粘贴时交换行列方向。 |

当用户通过 `Ctrl/Command` 追加多个不连续选区后，使用工具栏粘贴或快捷键粘贴会自动走 `clipboard.paste-multiple`：组件会把同一份剪贴板内容分别粘贴到每个选区的左上角。普通粘贴、仅粘贴值、合并格式、仅粘贴格式、仅粘贴公式、仅粘贴边框、仅粘贴列宽、仅粘贴条件格式、仅粘贴超链接、运算粘贴、跳过空单元格、仅粘贴验证和仅粘贴备注都支持这种多目标粘贴。剪切粘贴和转置粘贴仍按单个目标处理。

### Excel 导入导出兼容

组件导入 `.xlsx` 时会尽量保留 Excel 原生结构，导出时也会写回对应结构，方便在 Microsoft Excel、WPS 和其它表格软件里继续打开。

| 能力 | 说明 |
| --- | --- |
| 表对象 | Excel 原生 Table 会保留表范围、表头、筛选按钮和基础表样式。 |
| 命名区域 | 工作簿级单段连续 definedName 会导入为命名区域，导出时继续写回 Excel definedName。 |
| 单元格样式 | 常见字体、字号、文字颜色、默认主题色、纯色填充、图案填充、渐变填充、对齐、换行、缩小字体填充、基础边框、对角线边框和常见数字格式会尽量随 `.xlsx` 往返保留。 |
| 工作表状态 | 默认列宽、自定义行高列宽、合并单元格、冻结窗格、隐藏行、隐藏列、sheet 标签颜色、工作表保护状态和当前激活的可见工作表会随 `.xlsx` 导入导出往返保留。 |
| 超链接 | URL 超链接和指向工作表的内部跳转链接会随 `.xlsx` 导入导出往返保留；内部跳转会转换为 `{ kind: 'sheet', sheetId }`。 |
| 单元格备注 | Excel 单元格备注会导入为 `OfficeExcelCell.note`，导出 `.xlsx` 时会写回单元格备注；复杂富文本备注会按纯文本保留。 |
| 图片锚点 | `.xlsx` 导入会把普通嵌入图片读取为 `sheet.images` 浮动图片，并保留图片 dataUrl、尺寸、基础锚点模式、旋转角度、透明度、裁剪比例和图片超链接；浮动图片支持 `anchorMode`、`rotation`、`opacity`、`crop` 和 `hyperlinkUrl`，导出 `.xlsx` 时会写成 Excel 可识别的随单元格移动/缩放规则、图片旋转角度、透明度、裁剪区域和点击跳转链接。单元格内图片继续按所在单元格锚定导出。 |
| 图表对象 | `.xlsx` 导入会读取基础图表对象为 `sheet.charts`，当前覆盖图表锚点、图表类型、常见图表子类型、标题、图例位置、数据标签、坐标轴标题、系列引用、主轴/副轴绑定、图表文字样式、背景色和系列趋势线；导出 `.xlsx` 时会写回 Excel/WPS 可识别的图表 XML。复杂 Excel 原生图表扩展会继续逐步补齐。 |
| 数据验证 | 支持列表验证和数字验证；数字验证会区分整数 `whole` 和小数 `decimal`，组件导出的隐藏 helper sheet 列表验证可以再次导入识别。 |
| 条件格式 | 支持色阶、数据条、基础单元格比较、公式规则、Top/Bottom、平均值类规则和图标集条件格式导入；规则优先级和 `stopIfTrue`（为真则停止）会随 `.xlsx` 往返保留；组件内创建的图标集、公式和 Top/Bottom 条件格式可以导出后再导入保留关键配置。 |
| 条件格式导出环境 | 条件格式、分组、sparkline、图表等导出后处理不依赖浏览器 DOM，Node/SSR 或自动化测试环境也可以生成 `.xlsx`。 |

### 数据验证字段

`OfficeExcelValidationRule` 用于描述工作表上的数据验证区域。它会进入工作簿快照、复制粘贴的“仅粘贴验证”、协作命令链以及 `.xlsx` 导入导出。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `startRow` / `endRow` | `number` | 验证规则覆盖的起止行号，从 `1` 开始。 |
| `startCol` / `endCol` | `number` | 验证规则覆盖的起止列号，从 `1` 开始。 |
| `type` | `'list' \| 'number' \| 'date' \| 'textLength' \| 'custom'` | 验证类型。`list` 表示下拉列表；`number` 表示数字输入验证；`date` 表示日期验证；`textLength` 表示文本长度验证；`custom` 表示 Excel 自定义公式验证。 |
| `options` | `string[]` | `type` 为 `list` 时的可选值数组。导出 `.xlsx` 时会写入 Excel 可识别的列表验证。 |
| `numberMode` | `'integer' \| 'decimal'` | `type` 为 `number` 时生效。`integer` 对应 Excel 的整数验证 `whole`；`decimal` 对应 Excel 的小数验证 `decimal`。不传时按 `decimal` 处理。 |
| `operator` | `'between' \| 'notBetween' \| 'equal' \| 'notEqual' \| 'greaterThan' \| 'lessThan' \| 'greaterThanOrEqual' \| 'lessThanOrEqual'` | `type` 为 `number`、`date` 或 `textLength` 时生效。表示比较方式，会随 `.xlsx` 导入导出保留。 |
| `formulae` | `Array<number \| string>` | 验证公式或比较阈值。`number` / `date` / `textLength` 通常使用阈值；`custom` 通常使用一条 Excel 公式。`between` / `notBetween` 通常需要两个值，其它比较方式通常需要一个值。 |
| `allowBlank` | `boolean` | 是否允许空白单元格通过验证。 |
| `showInputMessage` | `boolean` | 选中单元格时是否显示输入提示。导入 `.xlsx` 时会读取 Excel 的 `showInputMessage`，导出时会写回。 |
| `promptTitle` | `string` | 输入提示标题。通常配合 `prompt` 使用。 |
| `prompt` | `string` | 输入提示正文，用于告诉用户应该填写什么内容。 |
| `showErrorMessage` | `boolean` | 输入不符合验证规则时是否显示错误提示。 |
| `errorStyle` | `'error' \| 'warning' \| 'information'` | 错误提示样式，对应 Excel 的停止、警告和信息提示。 |
| `errorTitle` | `string` | 错误提示标题。 |
| `error` | `string` | 错误提示正文。 |

### 公式依赖图 / 重算计划

```ts
const graph = excelRef.value?.getFormulaDependencyGraph()

const plan = excelRef.value?.getFormulaRecalculationPlan([
  { sheetId: workbook.value?.activeSheetId, row: 1, col: 1 },
])

const result = excelRef.value?.recalculateFormulas([
  { sheetId: workbook.value?.activeSheetId, row: 1, col: 1 },
])

console.log(result?.recalculatedCells)
```

公式依赖图会解析普通单元格引用、区域引用、跨工作表引用、连续工作表 3D 引用、整列引用、整行引用、结构化表引用和命名区域引用，例如 `A1`、`A1:C10`、`Sheet2!A:A`、`'明细表'!2:2`、`Sheet1:Sheet3!A1`、`'一月':'三月'!B2:C10`、`Sales[Amount]`、`Sales[#Data]`、`Sales[@Amount]`、`Sales[[#Data],[Amount]]`、`SalesAmount`。它适合用于协作层、性能分析、公式链路提示和增量重算。

3D 引用当前支持连续工作表范围内的单元格或普通区域引用，常用于跨月、跨季度工作表汇总，例如 `=SUM(Jan:Mar!B2)`。整列/整行形式的 3D 引用和外部工作簿 3D 引用暂不作为稳定 API。

`getFormulaRecalculationPlan` 只返回“哪些公式会受影响以及顺序”，并额外返回 `affectedRanges`，便于外部产品按区域做局部刷新或性能观测；`recalculateFormulas` 会在这个计划基础上执行当前值计算，返回 `recalculatedCells` 和 `recalculatedCellMap`。`recalculatedCells` 适合顺序展示重算结果，`recalculatedCellMap` 适合按公式 key 快速读取某个公式的新值。

组件内部的内容类命令也会自动生成最近一次公式重算结果，可通过 `getLastFormulaRecalculation()` 读取。它和 `recalculateFormulas()` 返回同一类结构，不需要外部再次传入 changes；组件内部公式显示读取会优先使用最近重算命中的 `displayValue`，后续可继续扩展到更细粒度的视口缓存。这个能力适合接历史面板、局部刷新调试或协作问题排查。

`OfficeExcelFormulaDependencyRange` 字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `sheetId` | `string` | 被依赖工作表 ID。 |
| `sheetName` | `string` | 被依赖工作表名称。 |
| `startRow` / `endRow` | `number` | 被依赖区域的起止行。 |
| `startCol` / `endCol` | `number` | 被依赖区域的起止列。 |
| `sourceText` | `string` | 公式里原始引用文本。 |
| `kind` | `'cell' \| 'range' \| 'column' \| 'row'` | 引用类型：单格、区域、整列或整行。 |

`OfficeExcelFormulaAffectedRange` 字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `sheetId` | `string` | 受影响公式所在工作表 ID。 |
| `sheetName` | `string` | 受影响公式所在工作表名称。 |
| `startRow` / `endRow` | `number` | 需要刷新的公式区域起止行。 |
| `startCol` / `endCol` | `number` | 需要刷新的公式区域起止列。 |
| `formulaKeys` | `string[]` | 该区域内包含的公式 key。相邻公式会尽量合并成一个区域，便于虚拟渲染或协作层做局部失效。 |

`OfficeExcelFormulaRecalculatedCell` 字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `sheetId` / `sheetName` | `string` | 公式所在工作表。 |
| `row` / `col` | `number` | 公式单元格位置。 |
| `key` | `string` | 稳定公式 key，格式为 `${sheetId}:${row}:${col}`。 |
| `formula` | `string` | 公式原文。 |
| `rawValue` | `string` | 当前公式计算出的原始值。 |
| `displayValue` | `string` | 结合格式后的显示值。 |

### 公式提示

组件内置公式提示 UI。用户在公式栏或单元格编辑器里输入 `=` 后继续输入函数名前缀，例如 `=su`，会弹出函数建议列表。`↑` / `↓` 可以切换建议，`Enter` / `Tab` 会把当前函数插入到光标位置，例如插入为 `=SUM(`，`Esc` 会关闭建议列表。进入函数括号后，组件会继续显示当前函数签名，并高亮当前光标所在参数。

公式提示 UI 和下面的实例 API 共用同一份函数目录与排序规则。外部项目如果要自己做公式编辑器，也可以直接调用 `getFormulaSuggestions`。

```ts
const suggestions = excelRef.value?.getFormulaSuggestions('sum', 8)
const help = excelRef.value?.getFormulaFunctionHelp('=IF(A1>0, SUM(B1, C1), 0)', 18)
```

当前函数目录覆盖常用聚合、逻辑、条件统计、查找引用、动态数组、LAMBDA 辅助函数、文本、日期时间、数学、财务、信息和数据库类函数。已验证的高频函数包括 `SUMIF`、`SUMIFS`、`COUNTIF`、`COUNTIFS`、`AVERAGEIF`、`AVERAGEIFS`、`MAXIFS`、`MINIFS`、`IF`、`IFS`、`IFERROR`、`IFNA`、`SWITCH`、`CHOOSE`、`CHOOSECOLS`、`CHOOSEROWS`、`LET`、`LAMBDA`、`MAP`、`BYROW`、`BYCOL`、`MAKEARRAY`、`REDUCE`、`SCAN`、`VLOOKUP`、`HLOOKUP`、`XLOOKUP`、`XMATCH`、`INDEX`、`MATCH`、`FILTER`、`SORT`、`SORTBY`、`UNIQUE`、`SEQUENCE`、`RANDARRAY`、`TAKE`、`DROP`、`EXPAND`、`HSTACK`、`VSTACK`、`TOCOL`、`TOROW`、`TRANSPOSE`、`WRAPROWS` 和 `WRAPCOLS`。函数提示只表示组件会给出签名和参数帮助；复杂 Excel 函数仍以实际计算结果和测试覆盖为准。

条件统计函数的 criteria 支持常见 Excel 写法：比较符如 `">100"`、`"<>空"`，文本通配符 `*` 和 `?`，以及 `~*`、`~?`、`~~` 转义。比如 `=SUMIF(A:A,"华东*",B:B)`、`=COUNTIF(A:A,"华?食品")`、`=COUNTIF(A:A,"华~*特殊")`。

`OfficeExcelFormulaSuggestion` 字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `name` | `string` | 函数名，例如 `SUM`。 |
| `category` | `OfficeExcelFormulaSuggestionCategory` | 函数分类，例如 `common`、`logical`、`lookup-reference`。 |
| `signature` | `string` | 函数签名，用于公式提示 UI 展示。 |
| `description` | `string` | 中文说明。 |
| `example` | `string \| undefined` | 示例公式。 |

`OfficeExcelFormulaFunctionHelp` 字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `functionName` | `string` | 当前光标所在函数名，统一为大写，例如 `SUM`、`IF`。 |
| `suggestion` | `OfficeExcelFormulaSuggestion` | 当前函数对应的函数目录项，包含签名、分类、中文说明和示例。 |
| `argumentIndex` | `number` | 当前参数下标，从 `0` 开始。 |
| `argumentStartIndex` | `number` | 当前参数在公式字符串中的起始位置，可用于外部公式编辑器做参数高亮。 |
| `argumentEndIndex` | `number` | 当前参数在公式字符串中的结束位置，不包含分隔逗号或右括号。 |
| `openParenIndex` | `number` | 当前函数左括号 `(` 在公式字符串中的位置。 |
| `closeParenIndex` | `number \| null` | 当前函数匹配的右括号 `)` 在公式字符串中的位置；公式未闭合时为 `null`。 |
| `argumentRanges` | `OfficeExcelFormulaFunctionArgumentRange[]` | 当前函数每个参数在公式字符串中的区间。已闭合函数会返回完整参数区间，未闭合函数返回截至光标的已知区间。 |
| `parenthesisPairs` | `OfficeExcelFormulaParenthesisMatch[]` | 当前公式中已识别的括号配对。会忽略字符串里的括号，未闭合左括号的 `closeIndex` 为 `null`，可用于外部公式编辑器做括号高亮。 |
| `unmatchedCloseParenIndexes` | `number[]` | 没有匹配左括号的右括号位置列表，可用于提示多余右括号。 |
| `isParenthesisBalanced` | `boolean` | 当前公式括号是否平衡。只要存在未闭合左括号或多余右括号，就会返回 `false`。 |
| `arguments` | `OfficeExcelFormulaFunctionArgument[]` | 从函数签名解析出的参数列表。 |
| `activeArgument` | `OfficeExcelFormulaFunctionArgument \| undefined` | 当前参数说明。函数支持可重复参数时，超出固定参数数量后会继续使用最后一个可重复参数。 |

`OfficeExcelFormulaParenthesisMatch` 字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `openIndex` | `number` | 左括号 `(` 在公式字符串中的位置。 |
| `closeIndex` | `number \| null` | 匹配的右括号 `)` 位置；未闭合时为 `null`。 |
| `depth` | `number` | 括号嵌套深度，从 `1` 开始。 |
| `functionName` | `string \| undefined` | 如果该左括号属于已知函数调用，则返回函数名，例如 `SUM`、`IF`；普通括号为空。 |

`OfficeExcelFormulaFunctionArgumentRange` 字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `index` | `number` | 参数下标，从 `0` 开始。 |
| `startIndex` | `number` | 该参数在公式字符串中的起始位置。 |
| `endIndex` | `number` | 该参数在公式字符串中的结束位置，不包含分隔逗号或右括号。 |

`OfficeExcelFormulaFunctionArgument` 字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `label` | `string` | 参数名，例如 `number1`、`value_if_true`。 |
| `optional` | `boolean` | 是否为可选参数。签名中带 `[]` 的参数会标记为 `true`。 |
| `repeating` | `boolean` | 是否为可重复参数。签名中带 `...` 的参数会标记为 `true`。 |

### 命名区域 API

命名区域用于给一个单元格区域起一个稳定名称，公式里可以直接引用。例如把 `B2:B10` 命名为 `SalesAmount` 后，可以写 `=SUM(SalesAmount)`。命名区域会进入工作簿快照、JSON 序列化、公式依赖图和协作命令链；导出 `.xlsx` 时会写成 Excel 原生 definedName，导入 `.xlsx` 时也会把单段连续区域 definedName 反解析为 `OfficeExcelNamedRange`。

```ts
const namedRange = excelRef.value?.createNamedRange(
  'SalesAmount',
  {
    startRow: 2,
    startCol: 2,
    endRow: 10,
    endCol: 2,
    anchorRow: 2,
    anchorCol: 2,
    mode: 'cell',
  },
)

const namedRanges = excelRef.value?.getNamedRanges()

if (namedRange) {
  excelRef.value?.removeNamedRange(namedRange.id)
}
```

`OfficeExcelNamedRange` 字段：
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | 命名区域唯一 ID，由组件生成。删除时可以传给 `removeNamedRange`。 |
| `name` | `string` | 命名区域名称。公式中直接使用这个名称，例如 `=SUM(SalesAmount)`。 |
| `sheetId` | `string` | 该命名区域引用的工作表 ID。 |
| `range` | `OfficeExcelSelectionRange` | 该命名区域引用的单元格区域。 |

命名区域导入导出说明：
| 场景 | 说明 |
| --- | --- |
| 导出 `.xlsx` | 工作簿级命名区域会写入 Excel 原生 definedName，WPS / Microsoft Excel 打开后可以在名称管理器中识别。 |
| 导入 `.xlsx` | 组件会读取用户自定义 definedName，并转换为 `OfficeExcelNamedRange`。当前只导入单一连续单元格区域，例如 `'Sheet1'!$B$2:$B$10`。 |
| 内置名称 | Excel 内置名称，例如打印区域、筛选数据库等不会转换为业务命名区域。 |
| 复杂引用 | 多段区域、外部工作簿引用、公式型名称暂不转换，避免外部误以为这些高级 definedName 已经是稳定 API。 |

### 表对象 API

表对象用于把一块普通区域标记为 Excel 原生意义上的 Table。它是高级筛选、结构化引用、透视表数据源和高保真导出的基础能力。

```ts
const table = excelRef.value?.createTable(
  {
    startRow: 1,
    startCol: 1,
    endRow: 20,
    endCol: 6,
    anchorRow: 1,
    anchorCol: 1,
    mode: 'cell',
  },
  {
    name: 'SalesTable',
    headerRow: true,
    totalRow: false,
    bandedRows: true,
    filterEnabled: true,
    styleId: 'blue',
  },
)

const tables = excelRef.value?.getTables()

if (table) {
  excelRef.value?.removeTable(table.id)
}
```

`createTable` 当前只在当前工作表创建表对象。传入区域不能和已有表对象或合并单元格重叠；如果当前组件不可编辑，或当前工作表受保护，会抛出错误。创建成功后，如果 `filterEnabled` 为 `true`，组件会把表对象范围设置为当前筛选范围。

表对象会跟随常见编辑动作自动扩展：

| 场景 | 行为 |
| --- | --- |
| 在无汇总行表格的下一行、表格列范围内输入或粘贴内容 | 表对象 `range.endRow` 自动扩展到该行；如果当前筛选范围正好来自该表对象，筛选范围也同步扩展。 |
| 在表格右侧相邻一列、表格行范围内输入或粘贴内容 | 表对象 `range.endCol` 自动扩展到该列，并根据表头重新生成列定义；如果当前筛选范围正好来自该表对象，筛选范围也同步扩展。 |
| 自动填充到表格下一行或右侧相邻列 | 写入目标单元格后自动触发表对象扩展，公式相对引用仍按目标位置偏移。 |
| 目标扩展范围会碰到其他表对象或合并单元格 | 不自动扩展，避免破坏已有结构。 |
| 表对象开启 `totalRow` 后在表格下方输入内容 | 不自动向下扩展，避免覆盖汇总行。需要先调整表范围或插入数据行。 |

`OfficeExcelTableObject` 字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | 表对象唯一 ID。由组件生成，删除表对象时传给 `removeTable`。 |
| `name` | `string` | 表对象名称。导出 `.xlsx` 时会转换为 Excel 原生表名；同一工作表内重名会自动追加后缀。 |
| `range` | `OfficeExcelSelectionRange` | 表对象覆盖的单元格区域。插入或删除行列时会自动移动或伸缩。 |
| `headerRow` | `boolean` | 是否把第一行作为表头。为 `true` 时列名优先读取表头单元格文本。 |
| `totalRow` | `boolean` | 是否启用汇总行。开启后第一列默认写入 `总计`，后续明显数值列默认使用 `sum` 汇总函数，并会导出为 Excel 原生 Table 汇总行。 |
| `bandedRows` | `boolean` | 是否使用隔行底色。导出 `.xlsx` 时会映射到 Excel 表样式。 |
| `filterEnabled` | `boolean` | 是否启用表头筛选按钮。创建时也会同步组件当前筛选范围。 |
| `styleId` | `'blue' \| 'green' \| 'orange' \| 'purple' \| 'gray'` | 表对象样式 ID。当前用于 `.xlsx` 原生表样式映射。 |
| `columns` | `OfficeExcelTableColumn[]` | 表列定义。组件根据表范围和表头自动生成。 |

`OfficeExcelTableColumn` 字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | 表列唯一 ID。 |
| `name` | `string` | 表列名称。`headerRow` 为 `true` 时来自表头单元格；没有表头文本时使用 `列1`、`列2` 等默认名。 |
| `col` | `number` | 表列所在的工作表列号，从 `1` 开始。 |
| `totalRowLabel` | `string` | 汇总行标签。通常只有第一列会自动生成 `总计`。导出 `.xlsx` 时会映射为 Excel Table 的 `totalsRowLabel`。 |
| `totalRowFunction` | `'none' \| 'sum' \| 'average' \| 'count' \| 'countNums' \| 'max' \| 'min' \| 'stdDev' \| 'var' \| 'custom'` | 汇总函数。创建表对象且 `totalRow` 为 `true` 时，组件会给数值列默认生成 `sum`，文本列为 `none`。 |
| `totalRowFormula` | `string` | 自定义或生成的汇总公式。默认 `sum` 会生成类似 `=SUM(B2:B10)` 的公式，便于组件内部显示和导出。 |

`createTable` 的 `options` 字段：

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `name` | `string` | `Table1`、`Table2` 等自动名称 | 表对象名称。会清理空格和特殊字符，并保证同一工作表内唯一。 |
| `headerRow` | `boolean` | `true` | 是否使用第一行作为表头。 |
| `totalRow` | `boolean` | `false` | 是否创建汇总行。开启后组件会自动生成第一列标签和数值列默认汇总公式。 |
| `bandedRows` | `boolean` | `true` | 是否开启隔行底色。 |
| `filterEnabled` | `boolean` | `true` | 是否启用表头筛选。 |
| `styleId` | `'blue' \| 'green' \| 'orange' \| 'purple' \| 'gray'` | `'blue'` | 表样式。 |

导出 `.xlsx` 时，组件会把表对象写成 Excel 原生 Table，而不是只保存 Web 私有字段。WPS 和 Microsoft Excel 打开后可以识别表范围、表头、筛选按钮、基础表样式和汇总行函数。导入 `.xlsx` 时，Excel 原生 Table 也会反解析为 `OfficeExcelTableObject`，包括 `totalsRowLabel`、`totalsRowFunction` 和 `totalsRowFormula`，用于后续筛选、序列化和再次导出。公式引擎当前支持结构化引用：`TableName[ColumnName]`、`TableName[#Data]`、`TableName[#All]`、`TableName[#Headers]`、`TableName[#Totals]`、`TableName[@ColumnName]`、`TableName[[#Data],[ColumnName]]`、`TableName[[#This Row],[ColumnName]]`。

### 数据透视表 API

`createPivotTable` 会读取源区域数据，生成一个新的只读结果工作表，并自动切换到该工作表。当前实现的是 Web 在线版透视表雏形：适合按一个行字段、一个可选列字段和一个值字段做基础聚合。

```ts
const result = excelRef.value?.createPivotTable({
  sourceRange: {
    startRow: 1,
    startCol: 1,
    endRow: 100,
    endCol: 5,
    anchorRow: 1,
    anchorCol: 1,
    mode: 'cell',
  },
  rowFieldCol: 1,
  columnFieldCol: 2,
  valueFieldCol: 5,
  aggregate: 'sum',
  headerRow: true,
  includeGrandTotal: true,
  targetSheetName: '销售透视表',
})
```

多行字段透视表可以使用 `rowFieldCols`：

```ts
const result = excelRef.value?.createPivotTable({
  sourceRange: {
    startRow: 1,
    startCol: 1,
    endRow: 100,
    endCol: 6,
    anchorRow: 1,
    anchorCol: 1,
    mode: 'cell',
  },
  rowFieldCols: [1, 2],
  valueFieldCol: 5,
  aggregate: 'sum',
  sortRows: 'asc',
  targetSheetName: '地区产品透视表',
})
```

多指标透视表可以使用 `valueFields`：

```ts
const result = excelRef.value?.createPivotTable({
  sourceRange: {
    startRow: 1,
    startCol: 1,
    endRow: 100,
    endCol: 6,
    anchorRow: 1,
    anchorCol: 1,
    mode: 'cell',
  },
  rowFieldCol: 1,
  columnFieldCol: 2,
  valueFields: [
    { col: 5, aggregate: 'sum', label: '销售额' },
    { col: 6, aggregate: 'sum', label: '数量' },
  ],
  includeGrandTotal: true,
  targetSheetName: '销售多指标透视表',
})
```

也可以直接绑定表对象作为动态数据源：

```ts
const table = excelRef.value?.createTable(
  {
    startRow: 1,
    startCol: 1,
    endRow: 100,
    endCol: 5,
    anchorRow: 1,
    anchorCol: 1,
    mode: 'cell',
  },
  { name: 'SalesTable' },
)

const result = table
  ? excelRef.value?.createPivotTable({
      sourceSheetId: workbook.value?.activeSheetId,
      sourceTableId: table.id,
      rowFieldCol: 1,
      columnFieldCol: 2,
      valueFieldCol: 5,
      aggregate: 'sum',
      targetSheetName: '销售透视表',
    })
  : null
```

也可以在创建透视表时先筛选源数据行。筛选只影响透视表统计结果，不会修改源工作表内容；后续调用 `refreshPivotTable` 或 `refreshAllPivotTables` 时会继续使用同一组筛选条件：

```ts
const result = excelRef.value?.createPivotTable({
  sourceRange: {
    startRow: 1,
    startCol: 1,
    endRow: 100,
    endCol: 5,
    anchorRow: 1,
    anchorCol: 1,
    mode: 'cell',
  },
  rowFieldCols: [1, 2],
  valueFields: [
    { col: 5, aggregate: 'sum', label: '销售额' },
    { col: 4, aggregate: 'counta', label: '订单数' },
  ],
  filters: [
    { col: 3, values: ['华东', '华南'] },
    { col: 4, excludeValues: ['作废'], nonEmpty: true },
  ],
  sortRows: 'asc',
  targetSheetName: '筛选后的销售透视表',
})
```

创建成功后，组件会在透视结果工作表上保存一份 `pivotTable` 元数据。后续源区域内的单元格值发生变化时，可以调用 `refreshPivotTable` 刷新已有结果表，而不是重新创建一张新表：

```ts
// 刷新刚才创建的透视结果表
if (result) {
  excelRef.value?.refreshPivotTable(result.sheetId)
}

// 如果当前激活的工作表就是透视结果表，也可以不传 sheetId
excelRef.value?.refreshPivotTable()

// 刷新当前工作簿内全部透视结果表
const refreshedPivots = excelRef.value?.refreshAllPivotTables()

// 只刷新指定几张透视结果表
excelRef.value?.refreshAllPivotTables(['sheet-pivot-1', 'sheet-pivot-2'])
```

`refreshPivotTable(sheetId?)` 和 `refreshAllPivotTables(sheetIds?)` 都会走组件统一命令链，因此会进入撤销历史和协作命令流。刷新会保留透视结果表的 `sheetId`、`sheetName`、标签颜色、隐藏状态和固定状态，然后按原始 `sourceSheetId`、`sourceRange`、字段列号、筛选条件和聚合方式重算结果。如果创建时传了 `sourceTableId`，刷新时会优先读取该表对象的当前范围；表对象因为新增行自动扩展后，刷新透视表会自动纳入新增明细。表对象开启汇总行时，透视表会排除汇总行，避免把总计再次参与聚合。

`getPivotTables(sheetId?)` 用于读取已经存在的透视结果快照，不会触发重算，也不会修改工作簿。不传参数时返回整本工作簿内全部透视结果表；传入透视结果工作表 ID 时只返回该透视表；传入普通工作表 ID 或不存在的 ID 时返回空数组。

`refreshAllPivotTables()` 不传参数时会刷新工作簿内全部透视结果表；如果当前工作簿没有透视表，返回空数组。传入 `sheetIds` 时，只刷新这些指定工作表，并要求每个 ID 都指向透视结果表，否则会抛出错误。

`OfficeExcelPivotTableConfig` 字段：

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `sourceSheetId` | `string` | 当前工作表 | 数据源所在工作表 ID。不传时使用当前工作表。 |
| `sourceRange` | `OfficeExcelSelectionRange` | 和 `sourceTableId` 二选一 | 固定数据源区域。通常第一行是表头，后续行是明细数据。 |
| `sourceTableId` | `string` | 和 `sourceRange` 二选一 | 表对象 ID。传入后透视表会使用该表对象当前范围作为数据源；刷新时也会重新读取表对象范围。 |
| `rowFieldCol` | `number` | 和 `rowFieldCols` 二选一 | 单行字段列号，从 `1` 开始。为了兼容旧版本保留；新项目需要多层分组时建议使用 `rowFieldCols`。 |
| `rowFieldCols` | `number[]` | 和 `rowFieldCol` 二选一 | 多行字段列号数组。传入后结果表左侧会按数组顺序展开多列维度，例如 `[地区列, 产品列]`。 |
| `valueFieldCol` | `number` | 和 `valueFields` 二选一 | 单指标透视表的值字段列号，从 `1` 开始。为了兼容旧版本保留；新项目需要多个指标时建议使用 `valueFields`。 |
| `valueFields` | `OfficeExcelPivotTableValueField[]` | 和 `valueFieldCol` 二选一 | 多指标配置数组。每一项代表一个需要汇总的值字段。传入后会按数组顺序生成多列指标。 |
| `columnFieldCol` | `number` | `undefined` | 可选列字段所在列号。传入后生成交叉透视表，不传时生成普通分组汇总表。 |
| `aggregate` | `'sum' \| 'count' \| 'counta' \| 'average' \| 'min' \| 'max'` | `'sum'` | 聚合方式。`sum` 求和；`count` 统计记录数；`counta` 统计非空值；`average` 平均值；`min` 最小值；`max` 最大值。 |
| `sortRows` | `'source' \| 'asc' \| 'desc'` | `'source'` | 行字段分组排序。`source` 表示按源数据出现顺序输出；`asc` 升序；`desc` 降序。多行字段会按第一维、第二维依次比较。 |
| `sortColumns` | `'source' \| 'asc' \| 'desc'` | `'source'` | 列字段分组排序。仅设置 `columnFieldCol` 时有明显效果。 |
| `filters` | `OfficeExcelPivotTableFilter[]` | `[]` | 源数据行筛选条件。多条筛选按 AND 关系同时生效，筛选发生在透视表聚合前；刷新透视表时会继续沿用。 |
| `headerRow` | `boolean` | `true` | 是否把源区域第一行作为表头。为 `true` 时，透视结果表会用表头文本作为字段名。 |
| `includeGrandTotal` | `boolean` | `true` | 兼容旧版本的总计开关。未传 `includeGrandTotalRow` / `includeGrandTotalColumn` 时，同时控制底部总计行和右侧总计列。 |
| `includeGrandTotalRow` | `boolean` | 继承 `includeGrandTotal` | 是否生成底部总计行。 |
| `includeGrandTotalColumn` | `boolean` | 继承 `includeGrandTotal` | 是否生成右侧总计列。仅设置 `columnFieldCol` 时有明显效果。 |
| `targetSheetName` | `string` | `'数据透视表'` | 结果工作表名称。如果已有同名工作表，会自动追加后缀。 |

`OfficeExcelPivotTableValueField` 字段：

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `col` | `number` | 必填 | 值字段所在列号，从 `1` 开始。必须在数据源范围内。 |
| `aggregate` | `OfficeExcelPivotTableAggregate` | `config.aggregate` 或 `'sum'` | 当前值字段自己的聚合方式。不同指标可以使用不同聚合方式。 |
| `label` | `string` | 表头文本或列标 | 当前指标显示名称。未传时，如果 `headerRow` 为 `true` 会读取源区域表头，否则使用列标，例如 `E`。 |

`OfficeExcelPivotTableFilter` 字段：
| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `col` | `number` | 必填 | 筛选字段所在列号，从 `1` 开始，必须在透视表数据源范围内。 |
| `values` | `string[]` | `undefined` | 包含值白名单。传入后，只有该列显示文本命中这些值的源数据行才会参与透视表统计。 |
| `excludeValues` | `string[]` | `undefined` | 排除值黑名单。传入后，该列显示文本命中这些值的源数据行不会参与透视表统计。 |
| `nonEmpty` | `boolean` | `false` | 是否要求该列非空。为 `true` 时，空白值不会参与透视表统计。 |

同一个 `OfficeExcelPivotTableFilter` 内会先检查 `nonEmpty`，再检查 `values`，最后检查 `excludeValues`；多个筛选条件之间是 AND 关系。`values` 和 `excludeValues` 使用单元格显示文本比较，传入值会自动去掉首尾空格并去重。

`OfficeExcelPivotTableResult` 字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `sheetId` | `string` | 新生成的透视结果工作表 ID。 |
| `sheetName` | `string` | 新生成的透视结果工作表名称。 |
| `sourceSheetId` | `string` | 数据源工作表 ID。 |
| `sourceRange` | `OfficeExcelSelectionRange` | 本次透视使用的数据源区域。 |
| `sourceTableId` | `string \| undefined` | 表对象数据源 ID。未使用表对象作为数据源时为空。 |
| `rowFieldCol` | `number` | 主行字段列号。单行字段时等于 `config.rowFieldCol`；多行字段时等于 `rowFieldCols[0]`。 |
| `rowFieldCols` | `number[]` | 实际使用的行字段列号数组。 |
| `valueFieldCol` | `number` | 主值字段列号。单指标时等于 `config.valueFieldCol`；多指标时等于 `valueFields[0].col`。 |
| `valueFields` | `OfficeExcelPivotTableResolvedValueField[]` | 实际使用的值字段数组。每项都包含归一化后的 `col`、`aggregate` 和可选 `label`。 |
| `columnFieldCol` | `number \| undefined` | 列字段列号。未传列字段时为空。 |
| `aggregate` | `OfficeExcelPivotTableAggregate` | 实际使用的聚合方式。 |
| `sortRows` | `OfficeExcelPivotTableSortOrder` | 实际使用的行分组排序方式。 |
| `sortColumns` | `OfficeExcelPivotTableSortOrder` | 实际使用的列分组排序方式。 |
| `filters` | `OfficeExcelPivotTableFilter[]` | 实际生效的源数据行筛选条件。 |
| `includeGrandTotalRow` | `boolean` | 是否实际生成底部总计行。 |
| `includeGrandTotalColumn` | `boolean` | 是否实际生成右侧总计列。 |
| `rowCount` | `number` | 生成的行字段分组数量，不包含表头和总计。 |
| `colCount` | `number` | 生成的列字段分组数量；未设置列字段时为 `1`。 |

`OfficeExcelSheet.pivotTable` 字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `sourceSheetId` | `string` | 透视表数据源工作表 ID。 |
| `sourceRange` | `OfficeExcelSelectionRange` | 透视表本次使用的数据源区域。未绑定表对象时，刷新仍按这个范围读取数据；绑定表对象时，刷新后会更新为表对象的当前范围。 |
| `sourceTableId` | `string \| undefined` | 表对象数据源 ID。存在时刷新会优先读取该表对象的当前范围。 |
| `rowFieldCol` | `number` | 主行字段所在列号。 |
| `rowFieldCols` | `number[]` | 透视表实际使用的行字段列号数组。刷新时会按这里的维度重新分组。 |
| `valueFieldCol` | `number` | 主值字段所在列号。 |
| `valueFields` | `OfficeExcelPivotTableResolvedValueField[]` | 透视表实际使用的值字段数组。刷新时会按这里的指标重新聚合。 |
| `columnFieldCol` | `number \| undefined` | 可选列字段所在列号。 |
| `aggregate` | `OfficeExcelPivotTableAggregate` | 聚合方式。 |
| `sortRows` | `OfficeExcelPivotTableSortOrder` | 行分组排序方式。刷新时继续使用该排序规则。 |
| `sortColumns` | `OfficeExcelPivotTableSortOrder` | 列分组排序方式。刷新时继续使用该排序规则。 |
| `filters` | `OfficeExcelPivotTableFilter[]` | 透视表实际保存的源数据行筛选条件。刷新、序列化、协作投影都会保留该字段。 |
| `headerRow` | `boolean` | 是否把源区域第一行作为表头。 |
| `includeGrandTotal` | `boolean` | 兼容旧版本的总计总开关。 |
| `includeGrandTotalRow` | `boolean` | 是否生成底部总计行。 |
| `includeGrandTotalColumn` | `boolean` | 是否生成右侧总计列。 |
| `targetSheetName` | `string \| undefined` | 创建时使用的目标工作表名称。 |

透视结果表会被设置为受保护工作表，避免用户误把结果当成普通明细数据直接编辑。`pivotTable` 元数据会进入 `v-model`、`serialize()`、`exportJson()` 和协作投影，所以外部保存快照后重新加载，仍然可以继续调用 `refreshPivotTable`。当前版本暂不做自动刷新、透视缓存、字段拖拽面板和复杂透视布局。

### importExcel

```ts
type OfficeExcelImportExcelInput = Blob | ArrayBuffer | ArrayBufferView

interface OfficeExcelImportExcelOptions extends OfficeExcelLoadWorkbookOptions {
  fileName?: string
  title?: string
  silent?: boolean
}
```

`OfficeExcelImportExcelOptions` 字段：

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `fileName` | `string` | 从 `File.name` 读取，二进制输入为空 | 导入文件名。用于格式校验、事件 payload、默认标题推导和提示文案。 |
| `title` | `string` | 文件名去掉扩展名 | 导入后工作簿标题。 |
| `silent` | `boolean` | `false` | 是否关闭组件内成功/失败 toast。业务侧自行提示时建议传 `true`。 |
| `selection` | `OfficeExcelSelectionRange` | `A1` | 导入完成后恢复的选区。 |
| `history` | `boolean` | 由内部加载逻辑决定 | 是否写入撤销历史。外部初始化或远端覆盖时建议传 `false`。 |
| `source` | `'edit' \| 'api' \| 'import' \| 'collab'` | `import` | 导入触发 `change` 时使用的来源标记。 |

```ts
async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }

  await excelRef.value?.importExcel(file)
}
```

也可以传接口返回的二进制数据：

```ts
const response = await fetch('/api/workbook.xlsx')
const buffer = await response.arrayBuffer()

await excelRef.value?.importExcel(buffer, {
  fileName: 'workbook.xlsx',
  title: '业务数据',
  silent: true,
  history: false,
})
```

导入成功后会同步 `v-model`，触发 `before-import`、`after-import` 和 `change`。默认 `change.source` 是 `import`。

### exportExcel

```ts
interface OfficeExcelExportExcelOptions {
  fileName?: string
  silent?: boolean
  resolveAsset?: (asset: OfficeExcelAssetReference, context: OfficeExcelAssetContext) => Promise<OfficeExcelResolvedAsset>
}
```

`OfficeExcelExportExcelOptions` 字段：

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `fileName` | `string` | 当前工作簿标题、首个 sheet 名称或默认文件名 | 导出的 `.xlsx` 文件名。 |
| `silent` | `boolean` | `false` | 是否关闭组件内成功/失败 toast。 |
| `resolveAsset` | `(asset, context) => Promise<OfficeExcelResolvedAsset>` | `collaboration.resolveAsset` | 单次导出时覆盖协同资源解析方法，用于把图片引用下载并内嵌进 `.xlsx`。 |

```ts
await excelRef.value?.exportExcel('客户数据.xlsx')

await excelRef.value?.exportExcel({
  fileName: '客户数据.xlsx',
  silent: true,
})
```

`silent: true` 时不显示组件内导出成功或失败提示，适合业务侧自行接管 toast。

### exportExcelBlob

`exportExcelBlob` 只生成 Excel 文件，不触发浏览器下载，适合 WebOffice SDK、业务后端上传、归档或自定义文件流处理。

```ts
type ExcelExportType = 'xlsx' | 'xls'

interface ExportExcelBlobOptions {
  type?: ExcelExportType
  fileName?: string
}

interface ExportExcelBlobResult {
  blob: Blob
  fileName: string
  mimeType: string
  size: number
}
```

```ts
const result = await excelRef.value?.exportExcelBlob({
  type: 'xlsx',
  fileName: '客户数据.xlsx',
})

if (result) {
  const formData = new FormData()
  formData.append('file', result.blob, result.fileName)
  await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })
}
```

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `type` | `ExcelExportType` | `xlsx` | 导出类型。当前完整支持 `xlsx`。`xls` 是旧版 BIFF 二进制格式，当前导出引擎暂不支持，调用时会抛出错误。 |
| `fileName` | `string` | 当前工作簿标题、首个 sheet 名称或默认文件名 | 返回文件名。可以不传扩展名，组件会自动补 `.xlsx`。 |

| 返回字段 | 类型 | 说明 |
| --- | --- | --- |
| `blob` | `Blob` | 真实 Excel 二进制 Blob，不是 JSON 快照。 |
| `fileName` | `string` | 实际文件名，包含扩展名。 |
| `mimeType` | `string` | 文件 MIME 类型，上传 SDK 可直接使用。 |
| `size` | `number` | 文件大小，单位字节。 |

`exportExcelBlob` 和组件内“导出 Excel”按钮复用同一套导出链路，会包含组件当前支持导出的单元格内容、样式、合并单元格、行高列宽、图片、图表、数据验证、条件格式等内容。协同模式下会读取当前组件内的工作簿状态，并使用 `collaboration.resolveAsset` 解析协同图片资源；它不依赖协同连接状态。

### JSON 快照

```ts
const snapshot = excelRef.value?.exportJson()
const json = excelRef.value?.serialize()

excelRef.value?.downloadJson({
  fileName: 'workbook.json',
  pretty: true,
})
```

`OfficeExcelDownloadJsonOptions` 字段：

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `fileName` | `string` | 当前工作簿文件名加 `.json` | 下载的 JSON 文件名。 |
| `pretty` | `boolean` | `true` | 是否使用缩进格式化 JSON。传 `false` 时输出紧凑 JSON。 |

`exportJson` 只返回数据，不触发下载，也不受导出权限限制。`downloadJson` 会下载文件，并受 `permissions.export` 影响。

### 外部加载数据

```ts
interface OfficeExcelLoadWorkbookOptions {
  selection?: OfficeExcelSelectionRange
  history?: boolean
  source?: 'edit' | 'api' | 'import' | 'collab'
}
```

```ts
excelRef.value?.setWorkbook(nextWorkbook, {
  history: false,
  source: 'api',
})

excelRef.value?.load(savedSnapshotJson, {
  history: false,
  selection: {
    startRow: 1,
    endRow: 1,
    startCol: 1,
    endCol: 1,
    anchorRow: 1,
    anchorCol: 1,
    mode: 'cell',
  },
})
```

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `selection` | `OfficeExcelSelectionRange` | 当前选区 | 加载后要恢复的选区，不传时沿用当前选区。 |
| `history` | `boolean` | 由内部加载逻辑决定 | 是否写入组件内部撤销历史。外部初始化、远端覆盖、导入时通常传 `false`。 |
| `source` | `'edit' \| 'api' \| 'import' \| 'collab'` | `api` | 本次加载触发 `change` 时使用的来源标记。 |

### 纯文本读取

当前数据结构里工作簿没有单独的 workbook id，工作表有稳定的 `sheet.id`。所以这里按 `sheetId` 取某张表；不传参数时取整本工作簿的所有工作表。

```ts
const workbook = excelRef.value?.getWorkbook()
const activeSheetText = workbook
  ? excelRef.value?.getPlainText(workbook.activeSheetId)
  : []

const allSheetsText = excelRef.value?.getPlainText()
const activeSheetData = excelRef.value?.getActiveSheetData()
```

返回结构：

```ts
interface OfficeExcelPlainTextSheetData {
  sheetId: string
  sheetName: string
  data: string[][]
}
```

`OfficeExcelPlainTextSheetData` 字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `sheetId` | `string` | 工作表 ID。 |
| `sheetName` | `string` | 工作表名称。 |
| `data` | `string[][]` | 工作表纯文本二维数组。第一层是行，第二层是列，行列顺序按表格位置排列。 |

纯文本只包含单元格显示文本。不会包含样式、合并、图片、图表、水印等元信息。

### 选区

```ts
interface OfficeExcelSelectionRange {
  startRow: number
  endRow: number
  startCol: number
  endCol: number
  anchorRow: number
  anchorCol: number
  mode: 'cell' | 'row' | 'col'
}
```

`OfficeExcelSelectionRange` 字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `startRow` | `number` | 选区起始行号，从 `1` 开始。 |
| `endRow` | `number` | 选区结束行号，从 `1` 开始。 |
| `startCol` | `number` | 选区起始列号，从 `1` 开始。 |
| `endCol` | `number` | 选区结束列号，从 `1` 开始。 |
| `anchorRow` | `number` | 当前活动单元格行号。 |
| `anchorCol` | `number` | 当前活动单元格列号。 |
| `mode` | `'cell' \| 'row' \| 'col'` | 选区类型：单元格区域、整行或整列。 |

行列索引从 `1` 开始。`anchorRow` / `anchorCol` 表示当前活动单元格。

```ts
excelRef.value?.setSelection({
  startRow: 2,
  endRow: 10,
  startCol: 1,
  endCol: 4,
  anchorRow: 2,
  anchorCol: 1,
  mode: 'cell',
})
```
