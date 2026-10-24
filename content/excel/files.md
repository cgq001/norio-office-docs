---
{"title":"文件导入与导出","description":"文件导入与导出的接口、使用示例与行为说明。","order":43,"reference":true}
---

本页按主题整理项目公开说明，供完成快速接入后查阅。代码片段中的业务回调、服务地址和存储实现需要由宿主提供。

## 导入导出

### 组件内按钮

- `开始 / 下载` 会导出 Excel。
- `数据 / 导入数据` 会打开本地文件选择器。
- `效率 / 导出图片` 会导出当前多单元格选区为图片。

导出 `.xlsx` 时，单元格值、公式、样式、合并单元格、图片、图表、条件格式快照、数据验证、命名区域和表对象会尽量写成 Excel/WPS 可识别的原生结构。其中表对象会导出为 Excel Table，命名区域会导出为 Excel definedName；导入时也会把 Excel 原生 Table 反解析为 `OfficeExcelTableObject`，把单段连续区域 definedName 反解析为 `OfficeExcelNamedRange`，并读取基础数据验证规则和常见条件格式。当前条件格式导入覆盖色阶、数据条、图标集、公式规则、Top/Bottom、平均值类规则和基础单元格比较规则，并保留规则优先级和 `stopIfTrue`（为真则停止）。

### 外部按钮

```vue
<script setup lang="ts">
async function exportWorkbook() {
  await excelRef.value?.exportExcel('业务数据.xlsx')
}

async function importWorkbook(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    await excelRef.value?.importExcel(file, { silent: true })
  }
}
</script>

<template>
  <button type="button" @click="exportWorkbook">导出</button>
  <input type="file" accept=".xlsx,.xlsm" @change="importWorkbook" />
</template>
```

### 错误处理

导入、导出、加载失败会抛出异常，同时触发 `error` 事件：

```ts
async function safeImport(file: File) {
  try {
    await excelRef.value?.importExcel(file, { silent: true })
  } catch (error) {
    console.error('导入失败', error)
  }
}

function handleError(payload: OfficeExcelErrorPayload) {
  console.error(payload.source, payload.message)
}
```
