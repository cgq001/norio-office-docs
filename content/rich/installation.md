---
{"title":"安装","description":"安装 @norio-office/rich-text，确认环境、依赖和样式引入方式。","order":5}
---

富文本的 npm 包是 `@norio-office/rich-text`。在你的业务项目中安装，接入一个编辑器只需要选择对应的包。

## 环境要求

| 项目 | 要求 |
| --- | --- |
| Vue | Vue 3.5+，当前包声明为 `^3.5.0` |
| 示例项目 | Vite + Vue + TypeScript |
| Node.js | 新建 Vite 示例建议使用 22.12+；具体版本需满足所用构建工具的要求 |
| Tiptap | core、pm、vue-3、starter-kit 及扩展使用兼容的 3.x 版本；当前声明从 `^3.22.1` / `^3.22.2` 起 |
| 其他外部依赖 | `yjs ^13.6.30`、`y-prosemirror ^1.2.6`、`@tiptap/y-tiptap ^3.0.2`、`lowlight ^3.3.0` |

当前 npm 组件面向 Vue 3。React 项目需接入 Docker 版本；编辑器的移动端功能正在设计中。

## 安装 npm 包

打开终端，先进入你的 Vue 项目根目录，也就是包含 `package.json` 的目录。以下包管理器选一种即可，不需要重复执行。

### npm

```bash
npm install @norio-office/rich-text @tiptap/core@^3.22.1 --include=peer
```

### pnpm

```bash
pnpm add @norio-office/rich-text @tiptap/core@^3.22.1
```

### Yarn

Yarn 不会自动安装所有外部依赖，因此此命令同时列出本组件声明的 Tiptap 和其他 peer dependencies。命令较长，可以点击代码块右上角复制。

```bash
yarn add @norio-office/rich-text @tiptap/core@^3.22.1 @tiptap/extension-code-block@^3.22.1 @tiptap/extension-code-block-lowlight@^3.22.1 @tiptap/extension-collaboration@^3.22.2 @tiptap/extension-collaboration-caret@^3.22.2 @tiptap/extension-font-family@^3.22.1 @tiptap/extension-horizontal-rule@^3.22.1 @tiptap/extension-placeholder@^3.22.1 @tiptap/extension-subscript@^3.22.1 @tiptap/extension-superscript@^3.22.1 @tiptap/extension-table@^3.22.1 @tiptap/extension-table-cell@^3.22.1 @tiptap/extension-table-header@^3.22.1 @tiptap/extension-table-row@^3.22.1 @tiptap/extension-task-item@^3.22.1 @tiptap/extension-task-list@^3.22.1 @tiptap/extension-text-style@^3.22.1 @tiptap/extension-underline@^3.22.1 @tiptap/pm@^3.22.1 @tiptap/starter-kit@^3.22.1 @tiptap/vue-3@^3.22.1 @tiptap/y-tiptap@^3.0.2 lowlight@^3.3.0 y-prosemirror@^1.2.6 yjs@^13.6.30
```

示例显式安装 `@tiptap/core`，因为页面代码会直接使用其中的 `JSONContent` 类型。`--include=peer` 让 npm 一并安装包声明的外部依赖；pnpm 请保留自动安装 peer dependencies 的默认配置；Yarn 用户使用上面的完整命令。

已有项目的 Vue 版本低于 3.5 时，需要先完成升级，再安装组件：

```bash
npm install vue@^3.5.0
```

如果还没有 Vue 项目，请直接阅读[快速开始](/rich/quickstart/)，里面包含新建项目的命令。

## 引入组件和样式

下面两行放在 Vue 单文件组件的 `<script setup lang="ts">` 中，样式也可以统一放在 `src/main.ts`。同一份样式选择一个位置引入即可。

```ts
import { RichTextEditor } from '@norio-office/rich-text'
import '@norio-office/rich-text/style.css'
```

本例使用局部组件导入，`<script setup>` 中导入后即可在模板使用，不需要额外调用 `app.use()`。完整初始数据、模板和容器样式见[快速开始](/rich/quickstart/)。

富文本使用 Tiptap 3。快速开始会传入空文档 JSON，而不是 HTML 字符串。

## 确认安装结果

npm 项目可运行：

```bash
npm ls @norio-office/rich-text vue @tiptap/core @tiptap/vue-3 yjs
```

输出应包含组件与 Vue 的版本，不应出现 `missing` 或 `invalid` 依赖错误。使用 pnpm 或 Yarn 时，可通过对应的依赖查看命令检查。

安装过程中出现 `ERESOLVE` 或 peer dependencies 冲突时，先检查项目的 Vue 版本及已安装的依赖，不要直接使用 `--force` 跳过冲突。可以查看当前组件要求：

```bash
npm view @norio-office/rich-text peerDependencies
```

不要混装 Tiptap 2.x 和 3.x。core、vue-3、pm 与扩展应使用同一兼容版本系列；如果应用已经使用 Tiptap，先检查现有版本，再统一安装。

## 下一步：让编辑器运行起来

[富文本快速开始](/rich/quickstart/)提供从创建项目、安装包到替换 `src/App.vue`、启动页面的完整步骤。首次接入先完成单人编辑；多人协作需要部署 [Docker 版本](/guide/collaboration/)。
