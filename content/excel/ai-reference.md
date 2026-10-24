---
{"title":"AI Bridge 与工具参考","description":"AI Bridge 与工具参考的接口、使用示例与行为说明。","order":45,"reference":true}
---

本页按主题整理项目公开说明，供完成快速接入后查阅。代码片段中的业务回调、服务地址和存储实现需要由宿主提供。

## AI 公共接口

### AI Skill

Excel 编辑器配套 Skill 已独立维护和发布：

- Skill 仓库：[norio-office-office-excel](https://github.com/cgq001/norio-office-office-excel)
- 可直接安装的 Skill 目录：[norio-office-excel](https://github.com/cgq001/norio-office-office-excel/tree/main/norio-office-excel)
- 主项目源码目录：`packages/skills/norio-office-excel`

接入时需要分别安装运行库和 Skill。运行库提供真实的工作簿、AI Bridge、工具处理器和 XLSX 能力；Skill 提供模型需要遵守的工作流、Schema、参考文档和示例。

1. 在宿主项目安装兼容版本的组件：

   ```bash
   npm install @norio-office/office-excel
   ```

2. 在支持 Skill 的 AI 宿主中安装上面的 `norio-office-excel` 目录。若宿主通过 Git 仓库导入，请选择仓库中的 `norio-office-excel/`，其入口文件是 `SKILL.md`。
3. 按下文创建 `createExcelAiBridge` 和 `createExcelToolHandlers`，并把 `getExcelToolDefinitions()` 返回的全部工具注册到宿主 AI Runtime。
4. 运行时先调用 `excel_get_capabilities`，再按 Skill 要求捕获真实目标、读取内容、预览并提交结构化 Patch。

Skill 也附带 Node.js 20+ 的离线 CLI，可用于校验工作簿、Patch、流事件以及生成真实 `.xlsx`：

```bash
node scripts/excel.mjs capabilities
node scripts/excel.mjs validate-workbook --input examples/basic-workbook.json
node scripts/excel.mjs validate-patch --input examples/header-style-patch.json
node scripts/excel.mjs validate-stream --input examples/streamed-workbook.ndjson
node scripts/excel.mjs create --input examples/basic-workbook.json --output result.xlsx
```

只安装 Skill 不会自动安装 npm 组件、注册 AI 工具、连接协作服务或获得工作簿权限；这些能力仍由宿主应用显式接入和授权。Skill 的版本与最低兼容包版本以其 `runtime-manifest.json` 为准。

AI 能力默认不显示定位按钮。宿主显式传入稳定文档 ID，并开启按钮：

```vue
<OfficeExcel
  ref="excelRef"
  document-id="workbook-42"
  show-ai-target-button
  @ai-target-change="syncTargetCard"
  @ai-target-invalidated="cancelTargetRequests"
/>
```

点击工具栏 AI 图标只冻结当前单元格、选区或对象，不调用模型、不修改工作簿。精确选中的 Table、命名区域以及当前选中的图表、浮动图片会按稳定对象 ID 捕获，而不是退化为活动单元格。冻结标记不受聊天输入框焦点影响；点击编辑器内容、关闭标记、切换工作簿或目标失效时清除。

公共运行入口相互独立：

```ts
import { createExcelAiBridge, createExcelToolHandlers } from '@norio-office/office-excel/ai'
import {
  createExcelStreamBuilder,
  createExcelStreamDecoder,
  getExcelToolDefinitions,
  validateExcelPatch,
  validateExcelWorkbook,
} from '@norio-office/office-excel/ai-protocol'
import { exportXlsx, importXlsx } from '@norio-office/office-excel/xlsx'

const bridge = createExcelAiBridge(excelRef.value!, {
  documentId: 'workbook-42',
})
const tools = createExcelToolHandlers(bridge)
```

宿主可以按真实 ID 捕获非当前工作表、空白目的地区域或对象，不需要切换用户界面：

```ts
const source = bridge.captureTarget({
  kind: 'range',
  sheetId: 'sheet-source',
  ranges: [{
    startRow: 1, endRow: 20,
    startCol: 1, endCol: 4,
    anchorRow: 1, anchorCol: 1,
    mode: 'cell',
  }],
  purpose: 'reference',
})

const destination = bridge.captureTarget({
  kind: 'range',
  sheetId: 'sheet-output',
  ranges: [{
    startRow: 2, endRow: 2,
    startCol: 6, endCol: 6,
    anchorRow: 2, anchorCol: 6,
    mode: 'cell',
  }],
  purpose: 'insert',
})

const sheetTarget = bridge.captureTarget({ kind: 'sheet', sheetId: 'sheet-output' })
const chartTarget = bridge.captureTarget({
  kind: 'object',
  objectKind: 'chart',
  objectId: 'chart-id-from-outline',
  sheetId: 'sheet-output',
})
```

`excel_capture_target` 暴露相同能力。组件负责校验对象存在、范围边界、保护状态和角色，并生成不透明 `targetRef`；传入 A1 字符串或对象名称不构成授权。

筛选操作区分五种语义：`enable` 只显示入口且不隐藏空白行，`apply` 应用条件，`clear-column` 清指定列条件，`clear-all` 保留入口并清空全部条件，`disable` 关闭筛选。`apply.col` 是从 1 开始的工作表绝对列号；`selectedValues: []` 表示不匹配任何行，`selectedValues: ['']` 表示选择空值；`mergeWithExisting` 默认 `true`。完整结构由 `excel_get_capabilities().patchSchema` 和 `excel_apply_patch` 工具 Schema 返回。

创建工作表、Table、图表和透视结果后，提交结果通过 `createdSheets`、`createdObjects` 返回真实 ID、名称和所在工作表。后续修改必须基于新版本重新捕获目标，不能继续使用旧上下文或自行拼接 `targetRef`。

`ai-protocol` 和 `xlsx` 可在 Node 20+ 使用，不需要导入 Vue 组件或 CSS。`exportXlsx` 返回真实 XLSX 字节且不会触发浏览器下载。正式文件仅支持 `.xlsx`；旧版 `.xls`、宏和外部连接不属于无损承诺。

筛选范围、启用状态、值/空值、非空、文本和数值条件使用标准 XLSX AutoFilter 往返。颜色筛选条件当前缺少可靠的 differential-style 映射，普通导出会在 compatibility report 中返回 `XLSX_FILTER_COLOR_LOSSY`，`strict: true` 会拒绝导出，避免静默丢失。

AI 补丁先预览、再按一次事务提交。相同 `requestId` 和相同内容幂等返回；相同 ID 不同内容报冲突。`answer` 上下文、保护工作表和只读目标都不能预览或提交写入。空白单元格作为 `insert` 锚点时允许向右下扩展生成矩阵，但碰到已有内容会明确拒绝。

除值、公式、样式、行列与工作表操作外，补丁还支持 `sortRange`、`filterRange`、`tableOperation`、`pivotTableOperation`、`chartOperation` 和 `imageOperation`。图表可创建、更新或删除；浮动图片可更新或删除。编辑流的 `cell.text.delta` 会累积为局部单元格预览，新建工作簿流通过 `previewAiWorkbook` 在编辑区增量显示。

协作实例在没有服务端原子 AI 批次命令时会拒绝写入，不使用客户端全量 `setWorkbook` 冒充权威提交。
