---
{"title":"AI 局部修改","description":"精确捕获单元格、区域和对象，通过结构化补丁更新工作簿。","order":30}
---

Excel AI 可以读取授权范围，并修改值、公式、样式、行列、工作表和支持的表格/图表对象。组件不内置模型聊天；Skill、工具注册与模型连接分别配置。

## 1. 开启目标入口并创建 Bridge

在已完成基础接入的组件上开启目标按钮，使用稳定的业务文档 ID：

```vue
<OfficeExcel ref="excelRef" v-model="workbook"
  document-id="expenses-2026" show-ai-target-button />
```

组件挂载后执行：

```ts
import { createExcelAiBridge, createExcelToolHandlers }
  from '@norio-office/office-excel/ai'
import { getExcelToolDefinitions }
  from '@norio-office/office-excel/ai-protocol'

const bridge = createExcelAiBridge(excelRef.value!, {
  documentId: 'expenses-2026',
})
const handlers = createExcelToolHandlers(bridge)
const definitions = getExcelToolDefinitions()
// 将 definitions 和 handlers 中的同名工具注册到你的 AI Runtime。
```

目标按钮只冻结当前单元格、选区或对象，不调用模型，也不修改工作簿。

## 2. 使用真实目标

模型执行前调用 `excel_get_capabilities`。宿主可捕获非当前工作表的区域，但 `sheetId` 必须来自真实文档，不能直接照抄示例：

```ts
const target = bridge.captureTarget({
  kind: 'range',
  sheetId: 'replace-with-real-sheet-id',
  ranges: [{
    startRow: 1, endRow: 1,
    startCol: 1, endCol: 4,
    anchorRow: 1, anchorCol: 1,
    mode: 'cell',
  }],
})
```

Bridge 校验范围、保护状态和对象身份，生成不透明的 `targetRef`。A1 字符串或对象名称本身不是写入授权。

## 3. 表头格式补丁长什么样

以下仅展示**操作体**，不是完整可提交请求。文档 ID、上下文 ID、版本、请求 ID 和 `targetRef` 必须使用当前 Bridge 与工具返回的真实值。

```json
{
  "type": "setCellStyle",
  "targetRef": "由当前上下文返回的真实引用",
  "style": {
    "bold": true,
    "foregroundColor": "#FFFFFF",
    "backgroundColor": "#1677FF",
    "horizontalAlign": "center"
  }
}
```

先读取目标，按当前 Schema 创建补丁并预览，再作为一次事务提交。同一 `requestId` 和相同内容可幂等返回；同一 ID 对应不同内容会冲突。新建工作表或对象后，要使用回执中的真实 ID，并在新版本重新捕获目标。

## 4. 处理边界

- `answer` 上下文和只读/受保护目标不能写入。
- 空白插入锚点可以按规则向右下扩展矩阵，遇到已有内容会明确拒绝。
- 流式单元格文字先进入局部预览，不应按每个 token 覆盖整个工作簿。
- 协作实例缺少服务端原子 AI 批次命令时拒绝写入；Docker 部署仍需验证对应后端能力。

详细目标类型、筛选语义和独立 Node 入口见 [AI Bridge 与工具参考](/excel/ai-reference/)。
