---
{"title":"安装","description":"安装 @norio-office/office-ppt，确认环境、依赖和样式引入方式。","order":5}
---

PPT 演示文稿的 npm 包是 `@norio-office/office-ppt`。在你的业务项目中安装，接入一个编辑器只需要选择对应的包。

## 环境要求

| 项目 | 要求 |
| --- | --- |
| Vue | Vue 3.5+，当前包声明为 `^3.5.0` |
| 示例项目 | Vite + Vue + TypeScript |
| Node.js | 新建 Vite 示例建议使用 22.12+；具体版本需满足所用构建工具的要求 |
| 模块格式 | ESM，使用 `import` 引入组件与样式 |

当前 npm 组件面向 Vue 3。React 项目需接入 Docker 版本；编辑器的移动端功能正在设计中。

## 安装 npm 包

打开终端，先进入你的 Vue 项目根目录，也就是包含 `package.json` 的目录。以下包管理器选一种即可，不需要重复执行。

### npm

```bash
npm install @norio-office/office-ppt
```

### pnpm

```bash
pnpm add @norio-office/office-ppt
```

### Yarn

```bash
yarn add @norio-office/office-ppt
```

已有项目的 Vue 版本低于 3.5 时，需要先完成升级，再安装组件：

```bash
npm install vue@^3.5.0
```

如果还没有 Vue 项目，请直接阅读[快速开始](/ppt/quickstart/)，里面包含新建项目的命令。

## 引入组件和样式

下面两行放在 Vue 单文件组件的 `<script setup lang="ts">` 中，样式也可以统一放在 `src/main.ts`。同一份样式选择一个位置引入即可。

```ts
import OfficePpt from '@norio-office/office-ppt'
import '@norio-office/office-ppt/style.css'
```

本例使用局部组件导入，`<script setup>` 中导入后即可在模板使用，不需要额外调用 `app.use()`。完整初始数据、模板和容器样式见[快速开始](/ppt/quickstart/)。

PPT 需要完整文稿数据和有高度的容器。包提供 ESM import 入口，不能改用 require() 引入。

## 确认安装结果

npm 项目可运行：

```bash
npm ls @norio-office/office-ppt vue
```

输出应包含组件与 Vue 的版本，不应出现 `missing` 或 `invalid` 依赖错误。使用 pnpm 或 Yarn 时，可通过对应的依赖查看命令检查。

安装过程中出现 `ERESOLVE` 或 peer dependencies 冲突时，先检查项目的 Vue 版本及已安装的依赖，不要直接使用 `--force` 跳过冲突。可以查看当前组件要求：

```bash
npm view @norio-office/office-ppt peerDependencies
```

## 下一步：让编辑器运行起来

[PPT 演示文稿快速开始](/ppt/quickstart/)提供从创建项目、安装包到替换 `src/App.vue`、启动页面的完整步骤。首次接入先完成单人编辑；多人协作需要部署 [Docker 版本](/guide/collaboration/)。
