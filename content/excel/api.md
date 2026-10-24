---
{"title":"参数与事件","description":"参数与事件的接口、使用示例与行为说明。","order":40,"reference":true}
---

本页按主题整理项目公开说明，供完成快速接入后查阅。代码片段中的业务回调、服务地址和存储实现需要由宿主提供。

## Props API

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `modelValue` / `v-model` | `OfficeExcelWorkbookSnapshot \| null` | `null` | 外部绑定的完整工作簿数据。传 `null` 时组件会创建默认工作簿。 |
| `title` | `string` | `在线表格` | 默认工作簿标题，也会作为默认导出文件名来源之一。 |
| `showFileHeader` | `boolean` | `true` | 是否显示最上方的文件图标与文件名栏。编辑模式下隐藏文件栏不会影响下方菜单和工具栏。 |
| `sheetName` | `string` | `Sheet1` | 默认工作表名称，仅在没有 `modelValue` 时用于初始化。 |
| `rowCount` | `number` | `40` | 默认工作表初始化行数，仅在没有 `modelValue` 时生效。 |
| `colCount` | `number` | `26` | 默认工作表初始化列数，仅在没有 `modelValue` 时生效。 |
| `mode` | `'edit' \| 'preview' \| 'disabled'` | `edit` | 组件运行模式。`preview` 和 `disabled` 都隐藏菜单栏、工具栏和公式栏。 |
| `width` | `number \| string` | `undefined` | 组件宽度。不传时自动撑满父容器宽度。数字按 `px` 处理。 |
| `height` | `number \| string` | `undefined` | 组件高度。不传时自动撑满父容器高度。数字按 `px` 处理。 |
| `toolbar` | `OfficeExcelToolbarOptions \| null` | `null` | 工具栏可见性配置，可隐藏 tab 或命令，也可以只开放指定 tab/命令。 |
| `permissions` | `OfficeExcelPermissions \| null` | `null` | 功能权限配置，例如导入、导出、编辑、增删 sheet、插入图片、插入图表、格式化。 |
| `featureCodes` | `OfficeExcelFeatureCode[] \| null` | `null` | 授权码白名单，只控制指定功能入口是否显示。不传或传空数组时，受授权码控制的入口都不显示。 |
| `backgroundImages` | `OfficeExcelBackgroundImage[]` | `[]` | 外部传入的背景图列表。每项必须包含 `id`、`name`、`url`，缺字段会被忽略。 |
| `collaboration` | `OfficeExcelCollaborationOptions \| null` | `null` | 可选协同配置。开启后组件读取外部 Y.Doc 的权威工作簿状态，并把本地编辑转换成外部服务可消费的 command envelope。 |

### mode

```vue
<OfficeExcel mode="edit" />
<OfficeExcel mode="preview" />
<OfficeExcel mode="disabled" />
```

| 值 | 说明 |
| --- | --- |
| `edit` | 默认编辑模式，显示文件栏、一级菜单、二级工具栏和公式栏，允许按权限编辑。 |
| `preview` | 预览模式，只显示文件栏和表格；允许选择单元格、复制、切换工作表和通过公开 API 导出，禁止内容、格式和结构修改。 |
| `disabled` | 完全禁用模式，只显示文件栏和表格，同时禁止选择、复制、切换工作表和编辑等组件内交互。 |

### toolbar

```ts
type OfficeExcelToolbarTabId =
  | 'start'
  | 'insert'
  | 'chart'
  | 'data'
  | 'formula'
  | 'collab'
  | 'view'
  | 'efficiency'

interface OfficeExcelToolbarOptions {
  visibleTabs?: OfficeExcelToolbarTabId[]
  hiddenTabs?: OfficeExcelToolbarTabId[]
  visibleCommands?: string[]
  hiddenCommands?: string[]
}
```

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `visibleTabs` | `OfficeExcelToolbarTabId[]` | `undefined` | tab 白名单。传入后只显示数组里的 tab。 |
| `hiddenTabs` | `OfficeExcelToolbarTabId[]` | `undefined` | tab 黑名单。传入后隐藏数组里的 tab。 |
| `visibleCommands` | `string[]` | `undefined` | 命令白名单。传入后只显示数组里的工具栏命令。父级命令和二级命令都按 `id` 判断。 |
| `hiddenCommands` | `string[]` | `undefined` | 命令黑名单。传入后隐藏数组里的工具栏命令。 |

`visibleTabs` / `visibleCommands` 是白名单；`hiddenTabs` / `hiddenCommands` 是黑名单。两者同时存在时，先满足白名单，再排除黑名单。

```vue
<OfficeExcel
  :toolbar="{
    visibleTabs: ['start', 'data', 'view'],
    hiddenCommands: ['image', 'bar-chart', 'watermark']
  }"
/>
```

### featureCodes

`featureCodes` 用于按授权码控制功能入口是否显示，只影响组件内按钮和菜单入口，不删除实例 API 能力。业务侧需要真正禁止执行时，请同时配置 `permissions`。

这是白名单配置：不传 `featureCodes` 或传空数组时，下面这些受授权码控制的入口都不显示；传入哪个授权码，就显示哪个入口。

```vue
<OfficeExcel
  :feature-codes="[
    'exportExcel',
    'importExcel',
    'exportImageExcel',
    'createTemplateExcel',
  ]"
/>
```

| 授权码 | 控制的入口 | 说明 |
| --- | --- | --- |
| `exportExcel` | `开始 / 下载`、底部 `+ / 导出 Excel` | 控制导出 Excel 入口是否显示。 |
| `importExcel` | `数据 / 导入数据`、底部 `+ / 导入本地数据` | 控制本地 Excel 数据导入入口是否显示。 |
| `exportImageExcel` | `效率 / 导出图片` | 控制选区导出图片入口是否显示。 |
| `createTemplateExcel` | 底部 `+ / 通过模板新建工作表` | 控制通过模板创建工作表入口是否显示。 |

例如只开放导出 Excel 和导出图片：

```vue
<OfficeExcel :feature-codes="['exportExcel', 'exportImageExcel']" />
```

上面的配置只显示导出 Excel 和导出图片相关入口，本地导入和模板新建入口会隐藏。

常用 tab id：

| tab id | 展示名称 | 说明 |
| --- | --- | --- |
| `start` | 开始 | 复制、粘贴、格式、边框、冻结、下载等。 |
| `insert` | 插入 | 行列、单元格、符号、链接、图片、水印等。 |
| `chart` | 图表 | 柱状图、条形图、折线图、面积图、饼图、雷达图、组合图、散点图、迷你图等。 |
| `data` | 数据 | 筛选、排序、条件格式、分列、分组、数据验证、导入数据等。 |
| `formula` | 公式 | 常用函数、财务、逻辑、文本、日期时间、查找引用等。 |
| `collab` | 协作 | 仅在 `collaboration.enabled` 为 `true` 时显示。 |
| `view` | 查看 | 冻结、高亮行列、缩放、网格线、行高列宽、全屏等。 |
| `efficiency` | 效率 | 背景、导出图片等定制能力。 |

常用 command id：

| command id | 所属 tab | 说明 |
| --- | --- | --- |
| `copy` / `cut` / `paste` | `start` | 复制、剪切、粘贴。 |
| `format-painter` / `clear-style` | `start` | 格式刷、清除格式。 |
| `font-size` / `font-color` / `fill-color` | `start` | 字号、字体颜色、填充颜色。 |
| `bold` / `italic` / `underline` | `start` | 文本样式。 |
| `number-format` / `border` / `freeze` | `start` | 数字格式、边框、冻结。 |
| `cell-style` / `style-template` / `download` | `start` | 单元格样式、样式模板、下载 Excel。 |
| `row-column` / `cell-action` / `symbol` / `link` | `insert` | 行列、单元格、符号、链接。 |
| `image` / `watermark` | `insert` | 图片、水印。 |
| `bar-chart` / `horizontal-bar-chart` / `line-chart` / `area-chart` | `insert` | 柱状图、条形图、折线图、面积图。 |
| `pie-chart` / `radar-chart` / `combo-chart` / `scatter-chart` | `insert` | 饼图、雷达图、组合图、散点图。 |
| `sparkline` | `insert` | 迷你图。 |
| `filter` / `sort` / `conditional-format` | `data` | 筛选、排序、条件格式。 |
| `split` / `group` / `text-to-number` | `data` | 分列、分组、文本转数字。 |
| `data-validation` / `dropdown` / `checkbox` / `import-data` | `data` | 数据验证、下拉、复选框、导入数据。 |
| `common-formula` / `financial-formula` / `logical-formula` | `formula` | 常用函数、财务函数、逻辑函数。 |
| `text-formula` / `date-time-formula` / `lookup-reference-formula` | `formula` | 文本、日期时间、查找引用函数。 |
| `math-trig-formula` / `statistical-formula` / `engineering-formula` / `information-formula` / `database-formula` | `formula` | 数学三角、统计、工程、信息、数据库函数。 |
| `collab-lock-cells` / `collab-claim-cells` | `collab` | 协同锁定单元格、抢占单元格菜单。 |
| `view-freeze` / `highlight-axis` / `zoom` | `view` | 查看模式下的冻结、高亮行列、缩放。 |
| `gridlines` / `gridline-color` / `row-column-size` / `fullscreen` | `view` | 网格线、网格线颜色、行高列宽、全屏。 |
| `background` / `export-image` | `efficiency` | 背景、导出图片。 |

二级菜单命令也可以隐藏，例如 `sort-asc`、`sort-desc`、`filter-clear`、`freeze-first-row`、`view-freeze-clear`、`zoom-100`、`data-validation-clear` 等。协同菜单二级命令包括 `collab-lock-selected-cells`、`collab-unlock-selected-cells`、`collab-enable-cell-claim`、`collab-release-selected-cell-claim`、`collab-disable-cell-claim-keep`、`collab-disable-cell-claim-release`。函数菜单会按 `common-formula-SUM`、`logical-formula-IF` 这类格式生成。

### permissions

```ts
interface OfficeExcelPermissions {
  edit?: boolean
  import?: boolean
  export?: boolean
  manageSheets?: boolean
  insertImages?: boolean
  insertCharts?: boolean
  format?: boolean
}
```

权限字段默认都是允许。显式传 `false` 时会关闭对应能力：

```vue
<OfficeExcel
  mode="preview"
  :permissions="{
    export: true,
    import: false,
    edit: false,
    manageSheets: false,
    insertImages: false,
    insertCharts: false,
    format: false
  }"
/>
```

| 字段 | 类型 | 默认值 | 设置为 `false` 时的影响范围 |
| --- | --- | --- | --- |
| `edit` | `boolean` | `true` | 禁止单元格内容编辑、清空内容、粘贴写入、数据验证、条件格式、排序筛选写入、结构变更等写操作。 |
| `import` | `boolean` | `true` | 禁止组件内导入入口和 `importExcel` 实例方法。 |
| `export` | `boolean` | `true` | 禁止组件内导出入口、`exportExcel` 和 `downloadJson`。 |
| `manageSheets` | `boolean` | `true` | 禁止新增、复制、重命名、移动、删除、隐藏、固定、保护 sheet 等管理操作。 |
| `insertImages` | `boolean` | `true` | 禁止插入图片。 |
| `insertCharts` | `boolean` | `true` | 禁止插入图表。 |
| `format` | `boolean` | `true` | 禁止字体、字号、颜色、边框、样式模板、数字格式等格式化能力。 |

`mode="preview"` 面向查看场景，仍允许选择、切换 sheet、复制和通过公开 API 导出；`mode="disabled"` 会禁用全部组件内交互。实例 API 中 `importExcel`、`exportExcel`、`downloadJson` 会尊重对应权限；`getWorkbook`、`getPlainText`、`getSelection` 等读取方法不受限制。

### backgroundImages

`效率 / 背景` 内置 9 个纯色背景和 9 个渐变背景。背景图片不再由组件内部预置，需要业务侧通过 `backgroundImages` 传入：

```vue
<script setup lang="ts">
import courtyardUrl from './assets/bg/courtyard.png'

const backgroundImages = [
  { id: 'courtyard', name: '橙树庭院', url: courtyardUrl },
  { id: 'window', name: '蓝窗花墙', url: '/images/window.png' },
]
</script>

<template>
  <OfficeExcel :background-images="backgroundImages" />
</template>
```

```ts
interface OfficeExcelBackgroundImage {
  id: string
  name: string
  url: string
}
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | 是 | 背景图唯一标识，用于记录当前 sheet 选择了哪张背景图。建议业务侧使用长期稳定的业务 ID。 |
| `name` | `string` | 是 | 背景图展示名称，会显示在背景选择弹层里，也会用于图片 `alt` 文本。 |
| `url` | `string` | 是 | 背景图地址。可以是静态资源 import 后的 URL、远程图片 URL、base64 data URL 或对象地址。 |

规则：

- `id`、`name`、`url` 缺一不可，缺字段或空字符串会被忽略。
- `id` 用于保存当前 sheet 的背景选择，建议在业务数据中保持稳定。
- `url` 可以是打包后的静态资源 URL、远程图片 URL 或业务侧生成的对象地址。
- 不传或传空数组时，背景弹层不显示 `背景图` 分组，只显示纯色和渐变分组。

### collaboration

用于接入多人协同。组件本身不内置固定服务端，也不直接创建 WebSocket；宿主需要把 `Y.Doc`、`y-websocket` provider、当前用户、命令提交函数传进来。这样组件可以适配私有部署、业务鉴权、文件服务、网关和不同后端实现。

```ts
type OfficeExcelCollaborationRole = 'owner' | 'editor' | 'commenter' | 'viewer'

interface OfficeExcelCollaborationUser {
  userId?: string
  displayName: string
  color?: string
}

interface OfficeExcelCollaborationOptions {
  enabled?: boolean
  mode?: 'server-authoritative'
  workbookId?: string
  clientId?: string
  token?: string
  endpoint?: string
  role?: OfficeExcelCollaborationRole
  document?: unknown
  provider?: OfficeExcelCollaborationProvider | null
  user?: OfficeExcelCollaborationUser | null
  submitCommand?: (envelope: OfficeExcelCollaborationCommandEnvelope) =>
    void | OfficeExcelCollaborationCommandResult | Promise<void | OfficeExcelCollaborationCommandResult>
  uploadAsset?: (file: File, context: OfficeExcelAssetContext) => Promise<OfficeExcelAssetReference>
  resolveAsset?: (asset: OfficeExcelAssetReference, context: OfficeExcelAssetContext) => Promise<OfficeExcelResolvedAsset>
}
```

`OfficeExcelCollaborationRole` 取值：

| 值 | 中文说明 | 建议用途 |
| --- | --- | --- |
| `owner` | 所有者 | 文档创建者或最高权限用户。组件只记录该值，不内置权限判断。 |
| `editor` | 编辑者 | 可编辑内容的普通协作者。业务侧可用它决定是否允许编辑。 |
| `commenter` | 评论者 | 预留给只批注、不改正文的角色。当前表格组件不内置批注权限。 |
| `viewer` | 查看者 | 只读查看角色。业务侧通常应同时传 `mode="preview"` 或 `mode="disabled"` 控制交互。 |

`OfficeExcelCollaborationUser` 字段：

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `userId` | `string` | `undefined` | 当前登录用户的业务 ID，例如数据库用户 ID。用于区分“谁在编辑”。同一个用户打开多个窗口时，`userId` 可以相同，但 `clientId` 应不同。 |
| `displayName` | `string` | 必填 | 当前用户展示名，例如 `张三`。远端选区、在线用户、协同状态展示会使用它。 |
| `color` | `string` | 组件生成默认色 | 当前用户在远端选区中的标识颜色，建议传稳定的十六进制颜色，例如 `#3b82f6`。 |

`OfficeExcelCollaborationOptions` 字段：

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `false` | 是否开启协同接入。`false` 时组件按单人本地模式运行，不显示协同相关 UI，也不会提交协同命令。 |
| `mode` | `'server-authoritative'` | `server-authoritative` | 协同模式。当前公开模式是“服务端权威命令流”：组件生成语义命令，宿主提交到服务端，服务端落到权威 Y.Doc 后同步给其他客户端。 |
| `workbookId` | `string` | `undefined` | 工作簿业务 ID，也可以直接使用协同房间 ID。必须稳定，刷新页面、重连、多人打开同一文件时应保持一致。 |
| `clientId` | `string` | `undefined` | 当前客户端实例 ID。用于区分浏览器 tab、桌面端实例或移动端设备。同一个用户开两个窗口时，应传两个不同的 `clientId`。 |
| `token` | `string` | `undefined` | 业务鉴权 token 的透传字段。组件本身不会用它请求服务端，但宿主的 `submitCommand`、`uploadAsset`、`resolveAsset` 可以读取同一份 token。 |
| `endpoint` | `string` | `undefined` | 协同服务地址的透传字段。组件本身不会自动连接该地址；建议宿主自己创建 provider，并在 `submitCommand` 中接入 WebSocket command channel。 |
| `role` | `'owner' \| 'editor' \| 'commenter' \| 'viewer'` | `undefined` | 当前用户协同角色。组件只记录角色，不替业务系统做权限判断；需要只读时请配合 `mode="preview"`、`mode="disabled"` 或 `permissions`。 |
| `document` | `unknown` | `undefined` | 外部创建的 `Y.Doc`。服务端权威协同时，组件会读取该文档中的权威工作簿状态，并监听远端 Yjs 更新回投到本地表格。开启协同时建议必传。 |
| `provider` | `OfficeExcelCollaborationProvider \| null` | `null` | 外部创建的 Yjs provider。组件主要读取 `provider.awareness`，用于同步远端选区、在线用户和编辑状态。 |
| `user` | `OfficeExcelCollaborationUser \| null` | `null` | 当前协同用户信息。建议协同时必传，方便远端选区和在线状态展示。 |
| `submitCommand` | `(envelope) => void \| OfficeExcelCollaborationCommandResult \| Promise<void \| OfficeExcelCollaborationCommandResult>` | `undefined` | 本地命令提交函数。组件会把编辑、样式、行列、sheet 等操作转换成 `envelope` 交给该函数。返回 `command.ack` 表示服务端确认；返回 `command.reject` 表示服务端拒绝；抛错会被组件视为 `SERVER_ERROR`。 |
| `uploadAsset` | `(file, context) => Promise<OfficeExcelAssetReference>` | `undefined` | 协同模式下上传图片、导入图片、背景图或水印等大资源。插入图片时通过该函数保存真实文件，Y.Doc 中只保存资源引用。 |
| `resolveAsset` | `(asset, context) => Promise<OfficeExcelResolvedAsset>` | `undefined` | 协同模式导出 `.xlsx` 时，把资源引用解析成真实图片内容。组件拿到图片内容后会内嵌到 Excel 文件中，保证 WPS 和 Microsoft Excel 离线打开也能看到图片。 |

`OfficeExcelCollaborationProvider` / `awareness` 字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `provider.awareness` | `OfficeExcelCollaborationAwareness \| null` | Yjs provider 的 awareness 对象。组件用它广播本地用户状态，并读取其他客户端状态。 |
| `provider.synced` | `boolean` | provider 是否已经完成首次服务端同步。组件会在协同初始化时读取它；如果同步后发现房间为空，会通过 `submitCommand` 发送 `workbook.initialize`，由后端决定是否初始化。 |
| `provider.on('sync', callback)` | `function` | 监听 provider 首次同步状态。组件会等待 `synced === true` 后再判断是否需要初始化空房间。 |
| `provider.off('sync', callback)` | `function` | 移除 provider 同步监听。组件卸载时会清理，避免重复监听。 |
| `awareness.clientID` | `number` | Yjs awareness 当前连接 ID。可用于区分同一用户的多个连接。 |
| `awareness.getStates()` | `() => Map<number, unknown>` | 读取所有在线客户端的 awareness 状态。组件用它生成远端用户列表和远端选区。 |
| `awareness.setLocalStateField(field, value)` | `function` | 写入当前客户端的局部状态。组件会写入 Office Excel 的协同状态。 |
| `awareness.on('update', callback)` | `function` | 监听 awareness 更新。远端用户选区、编辑状态变化时会触发。 |
| `awareness.off('update', callback)` | `function` | 移除 awareness 更新监听。组件卸载时会清理。 |

协同关闭时组件按单人本地模式运行。协同开启时组件不会直接连接服务端，而是通过 `submitCommand` 把稳定 ID 命令交给外部接入层。

协同工具栏能力：

| 能力 | 菜单项 | 说明 |
| --- | --- | --- |
| 锁定单元格 | `锁定当前选中的单元格` | 必须先选中一块区域。锁定成功后，其他用户不能编辑该区域；锁定区域内如果已经存在任何抢占单元格，锁定会失败并提示。 |
| 取消锁定 | `取消当前选中的单元格` | 只能取消当前用户自己的锁定。支持部分取消，例如先锁定一大片，再选中其中一小片取消，组件会把剩余区域拆回新的锁定规则。 |
| 开启抢占 | `开启抢占单元格` | 开启后，当前用户点击可操作单元格时会抢占该单元格。抢占成功后，该单元格归当前用户操作，其他用户不能选中或编辑。 |
| 取消抢占 | `取消当前抢占单元格` | 只取消当前选区里属于当前用户的抢占单元格。 |
| 关闭抢占并保留权限 | `关闭抢占单元格（保留抢占权限）` | 只关闭当前用户继续抢占的模式，已经抢占的单元格仍然保留。 |
| 关闭抢占并释放权限 | `关闭抢占单元格（取消抢占权限）` | 关闭抢占模式，并释放当前用户在整个工作簿内已经抢占的单元格。 |

锁定和抢占不会互相覆盖：锁定区域不能再被抢占，已抢占区域也不能被锁定。当前用户操作自己锁定或抢占的区域时不会重复提示；其他用户操作受限区域时，组件会提示该区域已被谁锁定或抢占。

这条约束已经下沉到组件命令层：`collab.lock-range` 会拒绝与任何已有锁定 / 抢占规则重叠的区域，`collab.claim-cell` 会拒绝已经被锁定或抢占的单元格；`collab.unlock-range` 只会清除锁定规则，不会误释放抢占规则，释放抢占必须走 `collab.release-claim`。

协同锁定 / 抢占状态会保存在每张工作表的 `cellLocks` 中：

```ts
type OfficeExcelCellAccessKind = 'lock' | 'claim'

interface OfficeExcelCellAccessOwner {
  userId?: string
  clientId: string
  displayName: string
  color?: string
}

interface OfficeExcelCellAccessRule {
  id: string
  kind: OfficeExcelCellAccessKind
  range: OfficeExcelSelectionRange
  owner: OfficeExcelCellAccessOwner
  createdAt: number
  updatedAt?: number
}
```

`OfficeExcelCellAccessRule` 字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | 规则 ID。锁定、取消锁定、抢占、释放抢占都通过它定位规则。 |
| `kind` | `'lock' \| 'claim'` | 规则类型。`lock` 表示锁定区域，`claim` 表示抢占单元格。 |
| `range` | `OfficeExcelSelectionRange` | 规则覆盖的区域。锁定通常是一片区域，抢占通常是单个单元格。 |
| `owner.userId` | `string` | 规则所属用户的业务用户 ID。建议后端按 WebSocket 连接上下文写入。 |
| `owner.clientId` | `string` | 规则所属客户端实例 ID。建议使用 `clientUniqueCode`。 |
| `owner.displayName` | `string` | 规则所属用户展示名。用于受限提示和覆盖层标签。 |
| `owner.color` | `string` | 规则所属用户颜色。用于覆盖层背景和边框。 |
| `createdAt` | `number` | 创建时间戳。 |
| `updatedAt` | `number` | 更新时间戳。可选。 |

协同资源字段：

```ts
interface OfficeExcelAssetReference {
  assetId: string
  url: string
  name?: string
  mimeType?: string
  width?: number
  height?: number
}

interface OfficeExcelAssetContext {
  kind: 'image' | 'background-image' | 'watermark' | 'import-image'
  workbookId?: string
  sheetId?: string
  fileName?: string | null
}

type OfficeExcelResolvedAsset = Blob | ArrayBuffer | ArrayBufferView | string
```

`OfficeExcelAssetReference` 字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `assetId` | `string` | 是 | 业务文件服务返回的资源 ID。协同文档中保存这个 ID，后续导出或展示时可用它换回真实文件。 |
| `url` | `string` | 是 | 当前可访问的资源地址。可以是长期 URL、短期签名 URL 或业务网关地址。 |
| `name` | `string` | 否 | 原始文件名或展示名，例如 `logo.png`。用于导出和调试。 |
| `mimeType` | `string` | 否 | 文件 MIME 类型，例如 `image/png`、`image/jpeg`。建议上传接口返回，方便导出判断格式。 |
| `width` | `number` | 否 | 图片原始宽度，单位通常为像素。组件可用于还原图片尺寸。 |
| `height` | `number` | 否 | 图片原始高度，单位通常为像素。组件可用于还原图片尺寸。 |

`OfficeExcelAssetContext` 字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `kind` | `'image' \| 'background-image' \| 'watermark' \| 'import-image'` | 资源用途。`image` 是插入图片，`background-image` 是背景图，`watermark` 是水印，`import-image` 是导入 Excel 时解析出的图片。 |
| `workbookId` | `string` | 当前工作簿 ID。宿主上传时可以作为业务归属字段。 |
| `sheetId` | `string` | 当前工作表 ID。资源属于某张 sheet 时会传入。 |
| `fileName` | `string \| null` | 导入或上传时的源文件名。没有文件名时可能为空。 |

`OfficeExcelResolvedAsset` 允许返回：

| 返回类型 | 说明 |
| --- | --- |
| `Blob` | 推荐浏览器端返回值，适合从 `fetch` 直接读取图片。 |
| `ArrayBuffer` | 二进制图片内容。 |
| `ArrayBufferView` | 例如 `Uint8Array`。 |
| `string` | data URL 或可解析的图片字符串。 |

资源处理规则：

- 非协同模式继续使用组件原来的图片插入和导出逻辑。
- 协同模式插入图片时，组件会调用 `uploadAsset`，并只把 `assetId` / `url` 等引用写入工作簿。
- 协同模式导入 Excel 时，如果文件里包含图片，组件也会调用 `uploadAsset` 把导入图片转换成资源引用。
- 协同模式导出 `.xlsx` 时，组件会调用 `resolveAsset` 把引用解析成真实图片内容，再内嵌到 Excel 文件里，保证 WPS / Microsoft Excel 离线打开也能识别图片。
- `uploadAsset` 返回值必须包含 `assetId` 和 `url`。
- 如果业务文件服务需要 `token`、`roomId`、`userId` 等字段，请在宿主的 `uploadAsset` / `resolveAsset` 闭包里自行组合，并保持组件传入的 `OfficeExcelAssetContext` 类型稳定。


## Events API

| 事件 | 参数 | 触发时机 |
| --- | --- | --- |
| `update:modelValue` | `OfficeExcelWorkbookSnapshot` | 工作簿快照同步给外部，支持 `v-model`。 |
| `change` | `OfficeExcelChangePayload` | 工作簿内容变化。 |
| `file-name-change` | `OfficeExcelFileNameChangePayload` | 文件名通过组件内编辑或公开实例方法发生变化。 |
| `selection-change` | `OfficeExcelSelectionRange` | 当前选区变化。 |
| `ready` | `OfficeExcelReadyPayload` | 组件初始化完成并完成首轮数据准备。 |
| `error` | `OfficeExcelErrorPayload` | 导入、导出、加载等错误统一抛出。 |
| `active-sheet-change` | `OfficeExcelActiveSheetChangePayload` | 当前工作表切换。 |
| `cell-click` | `OfficeExcelCellEventPayload` | 单击单元格。 |
| `cell-dblclick` | `OfficeExcelCellEventPayload` | 双击单元格。 |
| `cell-edit-start` | `OfficeExcelCellEditEventPayload` | 单元格进入编辑。 |
| `cell-edit-end` | `OfficeExcelCellEditEventPayload` | 单元格结束编辑。 |
| `before-export` | `OfficeExcelBeforeExportPayload` | 开始导出 Excel 前。 |
| `after-export` | `OfficeExcelAfterExportPayload` | 导出 Excel 成功后。 |
| `before-import` | `OfficeExcelBeforeImportPayload` | 开始导入 Excel 前。 |
| `after-import` | `OfficeExcelAfterImportPayload` | 导入 Excel 成功并替换工作簿后。 |
| `collaboration-command-ack` | `OfficeExcelCollaborationCommandAck` | 协同命令被服务端确认。 |
| `collaboration-command-reject` | `OfficeExcelCollaborationCommandReject` | 协同命令被服务端拒绝或 `submitCommand` 抛错。 |

```vue
<OfficeExcel
  v-model="workbook"
  @ready="({ activeSheetId }) => console.log('ready', activeSheetId)"
  @change="handleChange"
  @selection-change="handleSelectionChange"
  @error="handleError"
/>
```

### 事件类型

```ts
type OfficeExcelChangeSource = 'edit' | 'api' | 'import' | 'collab'
type OfficeExcelErrorSource = 'import' | 'export' | 'load' | 'runtime'

interface OfficeExcelChangePayload {
  workbook: OfficeExcelWorkbookSnapshot
  selection: OfficeExcelSelectionRange
  activeSheetId: string
  source: OfficeExcelChangeSource
}

interface OfficeExcelFileNameChangePayload {
  fileName: string
  previousFileName: string
}

interface OfficeExcelReadyPayload {
  workbook: OfficeExcelWorkbookSnapshot
  activeSheetId: string
}

interface OfficeExcelErrorPayload {
  source: OfficeExcelErrorSource
  message: string
  error: unknown
}

interface OfficeExcelActiveSheetChangePayload {
  activeSheetId: string
  previousActiveSheetId: string | null
  sheet: OfficeExcelSheet
}

interface OfficeExcelCellEventPayload {
  row: number
  col: number
  sheetId: string
  value: string
  displayValue: string
  event: MouseEvent
}

interface OfficeExcelCellEditEventPayload {
  row: number
  col: number
  sheetId: string
  value: string
}

interface OfficeExcelBeforeImportPayload {
  fileName: string
}

interface OfficeExcelAfterImportPayload {
  fileName: string
  workbook: OfficeExcelWorkbookSnapshot
}

interface OfficeExcelBeforeExportPayload {
  fileName: string
}

interface OfficeExcelAfterExportPayload {
  fileName: string
}
```

事件 payload 字段说明：

| 类型 | 字段 | 说明 |
| --- | --- | --- |
| `OfficeExcelChangePayload` | `workbook` | 变化后的完整工作簿快照，可直接用于外部保存。 |
| `OfficeExcelChangePayload` | `selection` | 变化发生时的当前选区。 |
| `OfficeExcelChangePayload` | `activeSheetId` | 当前激活工作表 ID。 |
| `OfficeExcelChangePayload` | `source` | 变化来源，见下方 `change.source` 表。 |
| `OfficeExcelFileNameChangePayload` | `fileName` | 修改后的文件名。 |
| `OfficeExcelFileNameChangePayload` | `previousFileName` | 修改前的文件名。 |
| `OfficeExcelReadyPayload` | `workbook` | 初始化完成后的工作簿快照。 |
| `OfficeExcelReadyPayload` | `activeSheetId` | 初始化完成后的激活工作表 ID。 |
| `OfficeExcelErrorPayload` | `source` | 错误来源，可能是 `import`、`export`、`load`、`runtime`。 |
| `OfficeExcelErrorPayload` | `message` | 可直接展示给用户的错误信息。 |
| `OfficeExcelErrorPayload` | `error` | 原始错误对象，便于业务侧记录日志。 |
| `OfficeExcelActiveSheetChangePayload` | `activeSheetId` | 切换后的工作表 ID。 |
| `OfficeExcelActiveSheetChangePayload` | `previousActiveSheetId` | 切换前的工作表 ID，初始场景可能为 `null`。 |
| `OfficeExcelActiveSheetChangePayload` | `sheet` | 切换后的工作表快照。 |
| `OfficeExcelCellEventPayload` | `row` | 单元格行号，从 `1` 开始。 |
| `OfficeExcelCellEventPayload` | `col` | 单元格列号，从 `1` 开始。 |
| `OfficeExcelCellEventPayload` | `sheetId` | 事件所属工作表 ID。 |
| `OfficeExcelCellEventPayload` | `value` | 单元格原始值。 |
| `OfficeExcelCellEventPayload` | `displayValue` | 单元格显示文本。 |
| `OfficeExcelCellEventPayload` | `event` | 原始 `MouseEvent`。 |
| `OfficeExcelCellEditEventPayload` | `row` / `col` | 编辑单元格位置，行列从 `1` 开始。 |
| `OfficeExcelCellEditEventPayload` | `sheetId` | 编辑所属工作表 ID。 |
| `OfficeExcelCellEditEventPayload` | `value` | 编辑开始或结束时的单元格值。 |
| `OfficeExcelBeforeImportPayload` | `fileName` | 即将导入的文件名；二进制来源未传文件名时可能为空字符串。 |
| `OfficeExcelAfterImportPayload` | `fileName` | 已导入的文件名。 |
| `OfficeExcelAfterImportPayload` | `workbook` | 导入后的完整工作簿快照。 |
| `OfficeExcelBeforeExportPayload` | `fileName` | 导出前计算出的目标文件名。 |
| `OfficeExcelAfterExportPayload` | `fileName` | 实际下载文件名。 |

`change.source` 的常见含义：

| source | 说明 |
| --- | --- |
| `edit` | 用户在组件内编辑、格式化、结构调整等。 |
| `api` | 外部通过 `setWorkbook` / `load` 写入。 |
| `import` | 外部或组件内导入 Excel。 |
| `collab` | 协同层回投远端变更。 |
