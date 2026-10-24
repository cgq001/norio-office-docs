---
{"title":"快速开始","description":"创建第一份演示文稿，并理解文档数据、容器和文件接口。","order":10}
---

组件需要 Vue 3.5+，npm 包只提供 ESM `import`。组件源码的构建环境要求 Node.js `>=22.12.0 <23`；这是编辑器项目的要求，与本静态文档站的构建配置分别管理。

## 1. 安装组件

```bash
npm install @norio-office/office-ppt
```

必须同时引入组件与样式。不要使用 `require()` 或假设存在 UMD 全局脚本入口。

## 2. 创建编辑页面

```vue
<script setup lang="ts">
import { ref } from 'vue'
import OfficePpt, {
  createOfficePptDeck,
  type OfficePptDeck,
  type OfficePptPublicApi,
} from '@norio-office/office-ppt'
import '@norio-office/office-ppt/style.css'

const editorRef = ref<OfficePptPublicApi | null>(null)
const deck = ref<OfficePptDeck>(
  createOfficePptDeck({ title: '季度业务汇报' }),
)
</script>

<template>
  <div class="ppt-container">
    <OfficePpt ref="editorRef" v-model="deck" />
  </div>
</template>

<style scoped>
.ppt-container { width: 100%; height: 720px; }
</style>
```

`deck` 是完整文稿数据。不要把幻灯片数组单独当作 `v-model`；父容器需要明确宽高。

## 3. 通过实例管理页面

以下函数放进上例的 `<script setup>`，在用户点击按钮时调用：

```ts
function addSlide() {
  const api = editorRef.value
  if (!api) return
  api.addSlide()
}
```

同类接口还有 `duplicateSlide()`、`removeSlide()` 和 `reorderSlide()`。非编辑模式或文档保护状态下，这些写入方法可能抛出错误，业务界面需要处理失败。

## 4. 选择显示模式

```vue
<!-- 允许查看、复制和底部放映，隐藏编辑工具 -->
<OfficePpt v-model="deck" mode="preview" />
<!-- 隐藏文件头，仍保留编辑模式的菜单 -->
<OfficePpt v-model="deck" mode="edit" :show-file-header="false" />
```

不提供 `readonly` 属性；请用 `mode`。`showFileHeader` 与模式独立。各模式下哪些行为仍可由宿主调用，见[参数、事件与方法](/ppt/api/)。

## 5. 接入保存

编辑数据变化不等于写入服务器。可以配置本地或 HTTP 存储适配器，启用自动保存与崩溃恢复；完整可运行的组合示例见[自动保存与崩溃恢复](/ppt/persistence/)。

部署宿主应用时保留完整组件资源，包含 Worker、PDF 引擎与动态加载文件。只复制主 JS 会使首次导出等操作失败。
