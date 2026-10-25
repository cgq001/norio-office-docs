---
{"title":"快速开始","description":"从安装 @norio-office/office-excel 到引入组件、运行第一个 Vue 编辑页面。","order":10}
---

本页用一个 Vue 3.5+、Vite、TypeScript 页面完成 Excel 表格的首次接入。已有项目可以跳过下面的新建步骤，从第 1 步安装组件开始。

## 准备一个 Vue 项目

还没有项目时，在终端执行以下命令，创建一个独立的 Vue + TypeScript 项目。建议使用 Node.js 22.12+，更多环境要求见 [Vite 官方说明](https://vite.dev/guide/)。

```bash
npm create vite@latest norio-excel-demo -- --template vue-ts
cd norio-excel-demo
npm install
```

后续安装与启动命令都在这个包含 `package.json` 的目录执行。项目的 Vue 版本需满足 3.5+，pnpm / Yarn 安装方式和依赖说明见[安装](/excel/installation/)。

## 1. 安装 npm 包

```bash
npm install @norio-office/office-excel yjs@^13.6.30
```

`yjs` 是组件要求的外部依赖，单人示例也一起安装。包入口默认带入样式，下面仍显式导入 CSS，便于构建工具明确处理。

## 2. 引入组件和样式

将 `src/App.vue` 的内容替换为下面的完整示例。已有项目也可把它保存为自己的页面组件，再从路由或父组件中引用。`<script setup>` 中导入组件后即可在模板中使用，无需额外全局注册。

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

## 运行前：清理脚手架默认样式

如果使用上面的 Vite 新项目，将 `src/style.css` 替换为以下基础样式，避免脚手架自带的居中、内边距和最大宽度挤压编辑区域。已有业务项目保留自己的布局，只需保证编辑器容器尺寸正确。

```css
* { box-sizing: border-box; }
html, body, #app { width: 100%; min-height: 100%; margin: 0; }
body { font-family: Arial, "Microsoft YaHei", sans-serif; }
```

`src/main.ts` 保留脚手架生成的 `createApp(App).mount('#app')` 和对 `./style.css` 的导入即可。组件样式已在上面的 `App.vue` 中引入。

## 运行并检查页面

保存文件后，在项目根目录启动开发服务：

```bash
npm run dev
```

打开终端输出的本地地址。默认通常是 `http://localhost:5173`；端口被占用时以终端显示的地址为准。

应看到工具栏和表格网格。点击单元格输入文字并提交，`workbook` 会回传工作簿快照。

准备部署时运行：

```bash
npm run build
```

这是构建你自己的应用。编辑内容的保存仍需接入业务存储，页面上能编辑不代表刷新后会自动恢复。

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
