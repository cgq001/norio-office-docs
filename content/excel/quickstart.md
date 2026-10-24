---
{"title":"快速开始","description":"用一个明确高度的容器和完整工作簿快照接入在线表格。","order":10}
---

本例面向 Vue 3.5+ 和 TypeScript 项目。`vue` 与 `yjs` 是组件 peer dependencies；按实际包版本的声明安装兼容依赖。

## 1. 安装组件

```bash
npm install @norio-office/office-excel
```

包入口默认带入样式，下面仍显式导入 CSS，便于宿主构建链明确处理。

## 2. 创建编辑页面

```vue
<script setup lang="ts">
import { ref } from 'vue'
import {
  OfficeExcel,
  type OfficeExcelPublicApi,
  type OfficeExcelWorkbookSnapshot,
} from '@norio-office/office-excel'
import '@norio-office/office-excel/style.css'

const excelRef = ref<OfficeExcelPublicApi | null>(null)
const workbook = ref<OfficeExcelWorkbookSnapshot | null>(null)
</script>

<template>
  <div class="excel-container">
    <OfficeExcel ref="excelRef" v-model="workbook" mode="edit" />
  </div>
</template>

<style scoped>
.excel-container { width: 100%; height: 640px; }
</style>
```

初始 `workbook` 为 `null` 时，组件根据默认标题、工作表名称和行列数量创建工作簿，再通过 `v-model` 回传完整快照。

## 3. 确认输入和尺寸

点击一个单元格，输入内容后确认提交，再观察 `workbook` 的变化。如果编辑区域没有高度，先检查父容器；组件默认填满父级，不会替宿主决定页面布局。

也可以直接设置组件尺寸：

```vue
<OfficeExcel v-model="workbook" :height="640" width="100%" />
```

## 4. 切换阅读模式

以下是放入上例页面的局部片段：

```vue
<OfficeExcel v-model="workbook" mode="preview"
  :permissions="{ export: true }" />
```

`preview` 用于阅读；`disabled` 禁用交互。`permissions`、`featureCodes` 和工具栏隐藏项分别有不同职责，详见[参数与事件](/excel/api/)。隐藏按钮不是服务端权限校验。

## 下一步

按[保存与常用场景](/excel/recipes/)保存快照，按[文件导入与导出](/excel/files/)处理 XLSX。多人协作需部署 [Docker 版本](/guide/collaboration/)，不属于这个单人示例。
