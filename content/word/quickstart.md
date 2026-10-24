---
{"title":"快速开始","description":"准备配套字体和运行资源，挂载你的第一个 Word 编辑器。","order":10}
---

本例面向已有的 Vue 3.5+、Vite、TypeScript 项目。先让单人编辑运行，再接文件存储和业务权限。

## 1. 安装组件

```bash
npm install @norio-office/office-word
```

## 2. 配置 Worker 与 WASM

在现有 `vite.config.ts` 中加入资源插件。它负责部署运行资源，不负责替你下载四个基础字体。

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { officeWordAssets } from '@norio-office/office-word/vite'

export default defineConfig({
  plugins: [vue(), officeWordAssets()],
  build: { target: 'esnext' },
})
```

字体引擎使用顶层 await，Vite 5 需要显式设置 `esnext`。其他构建工具应部署完整 Worker 依赖图和二进制，并保留相对路径，不能只复制一个 Worker 文件。

## 3. 准备四个配套字体

从当前版本的字体资源交付目录取得配套文件，将其托管到应用静态目录或资源服务。以下例子假设文件放在应用的 `public/fonts/` 中。

| 配置键 | 例子中的文件 | 用途 |
| --- | --- | --- |
| `text` | NotoSansSC-VF.ttf | 基础文字 |
| `symbols` | NotoSansSymbols2-Regular.ttf | 符号 |
| `emoji` | NotoEmoji-wght.ttf | 表情 |
| `cjk` | NotoSansCJKsc-Regular.otf | 中日韩文字 |

四项必须全部提供，字节需通过本版本 SHA-256 校验。文件名相同不等于字节匹配；网络或跨域错误也会阻止排版就绪。`fontUrls` 在初始化时读取，不能在挂载后随意热切换。

## 4. 创建编辑页面

下面是完整的 Vue 单文件组件；字体需要按上一步实际准备。

```vue
<script setup lang="ts">
import { shallowRef } from 'vue'
import {
  OfficeWord,
  createDefaultOfficeWordDocument,
  type OfficeWordFontUrls,
  type OfficeWordPublicApi,
} from '@norio-office/office-word'
import '@norio-office/office-word/style.css'

const wordRef = shallowRef<OfficeWordPublicApi | null>(null)
const document = shallowRef(createDefaultOfficeWordDocument('项目方案'))
const fontUrls: OfficeWordFontUrls = {
  text: '/fonts/NotoSansSC-VF.ttf',
  symbols: '/fonts/NotoSansSymbols2-Regular.ttf',
  emoji: '/fonts/NotoEmoji-wght.ttf',
  cjk: '/fonts/NotoSansCJKsc-Regular.otf',
}

function handleError(error: unknown) {
  console.error('文档操作失败', error)
}
</script>

<template>
  <div style="height: 720px">
    <OfficeWord ref="wordRef" v-model="document"
      :font-urls="fontUrls" mode="edit" @error="handleError" />
  </div>
</template>
```

## 5. 检查结果

页面应显示编辑器工具栏和文档页面，能够输入文字并更新 `document`。网络面板中的字体、Worker 和 WASM 应返回成功响应，不能返回 HTML 错误页。

`ready` 表示可以取得组件接口，不表示整篇字体、分页和画面已经全部完成。需要导出时使用公开异步方法，不要自行固定延时“等两秒”。

接下来按[保存与导出实战](/word/recipes/)完成保存闭环。要隐藏标题栏可设置 `showFileHeader`；要限制导入导出请查[参数与事件](/word/api/)。
