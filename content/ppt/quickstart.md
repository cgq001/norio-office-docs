---
{"title":"快速开始","description":"从安装 @norio-office/office-ppt 到引入组件、运行第一个 Vue 编辑页面。","order":10}
---

本页用一个 Vue 3.5+、Vite、TypeScript 页面完成 PPT 演示文稿的首次接入。已有项目可以跳过下面的新建步骤，从第 1 步安装组件开始。

## 准备一个 Vue 项目

还没有项目时，在终端执行以下命令，创建一个独立的 Vue + TypeScript 项目。建议使用 Node.js 22.12+，更多环境要求见 [Vite 官方说明](https://vite.dev/guide/)。

```bash
npm create vite@latest norio-ppt-demo -- --template vue-ts
cd norio-ppt-demo
npm install
```

后续安装与启动命令都在这个包含 `package.json` 的目录执行。项目的 Vue 版本需满足 3.5+，pnpm / Yarn 安装方式和依赖说明见[安装](/ppt/installation/)。

## 1. 安装 npm 包

```bash
npm install @norio-office/office-ppt
```

必须同时引入组件与样式。不要使用 `require()` 或假设存在 UMD 全局脚本入口。

## 2. 引入组件和样式

将 `src/App.vue` 的内容替换为下面的完整示例。已有项目也可把它保存为自己的页面组件，再从路由或父组件中引用。`<script setup>` 中导入组件后即可在模板中使用，无需额外全局注册。

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

应看到幻灯片编辑界面。尝试修改标题或添加页面，`deck` 会回传完整文稿数据。

准备部署时运行：

```bash
npm run build
```

这是构建你自己的应用。编辑内容的保存仍需接入业务存储，页面上能编辑不代表刷新后会自动恢复。

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
