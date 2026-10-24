---
{"title":"保存与常用场景","description":"保存完整工作簿，恢复编辑状态，并按业务要求控制交互。","order":20}
---

以下片段沿用[快速开始](/excel/quickstart/)的 `excelRef` 和 `workbook`。示例只涉及单人编辑。

## 保存并恢复工作簿

```ts
function saveWorkbook() {
  const api = excelRef.value
  if (!api) return
  try {
    localStorage.setItem('expenses-workbook', api.serialize())
  } catch (error) {
    console.error('工作簿未保存', error)
  }
}

function restoreWorkbook() {
  const api = excelRef.value
  if (!api) return
  try {
    const saved = localStorage.getItem('expenses-workbook')
    if (saved) api.load(saved, { history: false })
  } catch (error) {
    console.error('无法恢复工作簿', error)
  }
}
```

`serialize()` 保存结构化工作簿；不要仅保存当前可见单元格的文字。浏览器存储可能被清理或写满，这个示例用于理解流程，正式存储需要由宿主接入。

## 只读阅读与隐藏入口

```vue
<!-- 阅读并允许导出 -->
<OfficeExcel v-model="workbook" mode="preview"
  :permissions="{ export: true }" />

<!-- 编辑，但隐藏导入导出相关入口 -->
<OfficeExcel v-model="workbook"
  :permissions="{ import: false, export: false }"
  :toolbar="{ hiddenCommands: ['download', 'import-data', 'export-image'] }" />
```

这控制组件行为和界面。后端仍要根据用户身份判断文件是否可读、可写和可下载。

## 排序、筛选和空值

排序会改变区域中的数据顺序，筛选则控制哪些行可见，两者不要混用。API 详细参数见[实例方法参考](/excel/methods/)。

AI 筛选协议区分五类操作：`enable` 只显示筛选入口；`apply` 应用条件；`clear-column` 清除某列条件；`clear-all` 清除条件但保留入口；`disable` 关闭筛选。

例如 `selectedValues: []` 表示没有任何值匹配，`selectedValues: ['']` 才表示选择空值。`apply.col` 是从 1 开始的工作表绝对列号，并非选区里的相对第几列。

## 导入导出前验证什么

1. 用真实 XLSX 文件导入，检查公式、合并、样式、表对象和图表。
2. 修改一个值或格式，再导出并在目标软件中重开。
3. 检查兼容性报告，避免静默忽略有损特性。
4. 区分组件触发下载的方法和返回 Blob / 字节的方法，后者还需要宿主保存。

完整例子见[文件导入与导出](/excel/files/)。Node 场景可使用独立 `/xlsx` 入口；`exportXlsx` 返回真实文件字节，不弹出浏览器下载。
