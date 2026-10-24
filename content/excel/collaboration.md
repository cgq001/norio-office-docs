---
{"title":"协作接入参考","description":"协作接入参考的接口、使用示例与行为说明。","order":44,"reference":true}
---

> **Docker 版本必需**：多人协作需要部署 Docker 版本并接通对应协作服务。以下是前端协议参考；开发服务示例不替代生产 Docker 部署。

本页按主题整理项目公开说明，供完成快速接入后查阅。代码片段中的业务回调、服务地址和存储实现需要由宿主提供。

## 协同前端接入

组件已经提供 Yjs 协同前端接入层。当前版本负责前端稳定 ID、本地命令转换、外部 Y.Doc 权威状态回投，以及 provider awareness 远程选区展示；真实 WebSocket 服务端、WebSocket command channel、业务鉴权和文件服务由宿主接入。

### 接入流程

1. 业务系统准备稳定的 `fileId` / `roomId`，同一个工作簿多人打开时必须一致。
2. 业务系统准备当前用户信息：`userId`、`userName`、`clientUniqueCode`、`token`。
3. 宿主创建 `Y.Doc`。
4. 宿主创建 `y-websocket` 的 `WebsocketProvider`，连接协同服务。
5. 宿主实现 `submitCommand`，把组件产生的命令通过 WebSocket command channel 提交到后端。
6. 把 `document`、`provider`、`user`、`submitCommand` 等字段传给 `OfficeExcel`。
7. 如果协同模式需要图片、背景图、水印或导入图片，继续实现 `uploadAsset` 和 `resolveAsset`。
8. 首次进入空房间时，组件会在 provider 首次同步完成后发送 `workbook.initialize`；后端必须只允许空房间初始化，已有内容时返回 ack 并保持现有文档不变。
9. 如果业务侧有本地初始工作簿，请通过 `v-model` / `modelValue` 传给组件。协同模式下组件会把它作为 `workbook.initialize` 的初始内容提交给后端，不会在服务端权威模式下直接把初始内容写进 Y.Doc。

标准协同模式下，Y.Doc 是服务端权威状态的载体。客户项目不要在页面初始化时直接把默认工作簿写进 Y.Doc，否则后端会误判房间已有内容，刷新或第二个人进入时就可能覆盖已有数据。初始化、编辑、样式、行列、sheet、锁定和抢占都应通过 `submitCommand` 走 WebSocket command channel。

### 完整示例：y-websocket + WebSocket 命令通道

下面是推荐的最小完整接入。业务项目只需要自己负责创建 `Y.Doc`、创建 `WebsocketProvider`、传入用户和房间信息，以及按业务文件服务实现资源上传下载；Excel 协同命令的 WebSocket 编码、pending、ack/reject、超时、`messageType=100` 兼容都交给 `createOfficeExcelYWebSocketCommandAdapter`。

```vue
<script setup lang="ts">
import { onBeforeUnmount } from 'vue'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import {
  OfficeExcel,
  createOfficeExcelYWebSocketCommandAdapter,
  type OfficeExcelCollaborationCommandEnvelope,
  type OfficeExcelCollaborationCommandResult,
  type OfficeExcelAssetContext,
  type OfficeExcelAssetReference,
} from '@norio-office/office-excel'

const serverWsUrl = 'ws://127.0.0.1:1234/collaboration'
const fileId = 'excel-demo-file-001'
const token = 'dev-token'
const user = {
  userId: 'user_001',
  userName: '张三',
  clientUniqueCode: 'browser-tab-001',
  color: '#3b82f6',
}

const ydoc = new Y.Doc()

const provider = new WebsocketProvider(
  serverWsUrl,
  fileId,
  ydoc,
  {
    params: {
      roomId: fileId,
      token,
      userId: user.userId,
      userName: user.userName,
      clientType: 'web',
      clientUniqueCode: user.clientUniqueCode,
      documentType: 'excel',
    },
  },
)

const commandAdapter = createOfficeExcelYWebSocketCommandAdapter(provider, {
  timeout: 15000,
  onError: (error) => {
    console.warn('[office-excel] 协同命令解析失败', error)
  },
})

async function submitCommand(
  envelope: OfficeExcelCollaborationCommandEnvelope,
): Promise<OfficeExcelCollaborationCommandResult> {
  return commandAdapter.submitCommand(envelope)
}

async function uploadAsset(
  file: File,
  context: OfficeExcelAssetContext,
): Promise<OfficeExcelAssetReference> {
  const form = new FormData()
  form.append('file', file)
  form.append('roomId', fileId)
  form.append('workbookId', context.workbookId ?? fileId)
  form.append('documentType', 'excel')
  form.append('usage', context.kind)
  if (context.sheetId) {
    form.append('sheetId', context.sheetId)
  }

  const response = await fetch('/office-assets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  })
  const result = await response.json()
  if (!response.ok || result.code !== 200) {
    throw new Error(result.message || '资源上传失败')
  }

  return result.data
}

async function resolveAsset(asset: OfficeExcelAssetReference) {
  const response = await fetch(`/office-assets/${asset.assetId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!response.ok) {
    throw new Error(`资源解析失败：${response.status}`)
  }
  return response.blob()
}

onBeforeUnmount(() => {
  commandAdapter.destroy()
  provider.destroy()
  ydoc.destroy()
})
</script>

<template>
  <OfficeExcel
    :collaboration="{
      enabled: true,
      workbookId: fileId,
      clientId: user.clientUniqueCode,
      document: ydoc,
      provider,
      submitCommand,
      uploadAsset,
      resolveAsset,
      user: {
        userId: user.userId,
        displayName: user.userName,
        color: user.color,
      },
    }"
    @collaboration-command-ack="(payload) => console.log('协同命令确认', payload)"
    @collaboration-command-reject="(payload) => console.warn('协同命令拒绝', payload)"
  />
</template>
```

示例字段说明：

| 字段 | 说明 |
| --- | --- |
| `serverWsUrl` | 协同 WebSocket 地址，传给 `WebsocketProvider`。Yjs sync、awareness、Excel command 都走这一条连接。 |
| `fileId` | 当前业务文件 ID。本示例同时作为 `roomId` 和 `workbookId` 使用。 |
| `token` | 业务系统签发的访问凭证。WebSocket 连接、WebSocket 命令上下文、资源上传下载建议使用同一套 token。 |
| `user.userId` | 当前登录用户 ID。用于识别“谁在编辑”。 |
| `user.userName` | 当前登录用户展示名。用于远端选区、在线用户、日志。 |
| `user.clientUniqueCode` | 当前客户端实例 ID。同一个用户开多个窗口时必须不同。 |
| `ydoc` | 当前协同文档。服务端权威协同时，后端把权威工作簿状态写入它，组件读取远端同步回来的更新。 |
| `provider` | `y-websocket` provider。负责连接服务端、同步 Yjs update 和 awareness。 |
| `commandAdapter` | 组件库提供的 y-websocket 命令适配器。它封装 `messageType=100`、协议字段、pending 队列、ack/reject 匹配、超时和 y-websocket 兼容处理。 |
| `submitCommand` | 把组件生成的 Excel 语义命令交给 `commandAdapter.submitCommand`，最终通过 WebSocket command channel 提交给后端。 |
| `uploadAsset` | 协同模式下上传图片等大资源。没有图片协同时可以不传。 |
| `resolveAsset` | 协同模式导出 Excel 时，根据资源引用换回真实图片。没有图片协同时可以不传。 |

组件字段说明：

| 字段 | 说明 |
| --- | --- |
| `enabled` | 是否开启协同。开启后组件会读取外部 `Y.Doc` 并提交协同命令。 |
| `workbookId` | 工作簿稳定 ID。多人进入同一份文件时必须一致，通常等于业务文件 ID 或 room ID。 |
| `clientId` | 当前客户端实例 ID。同一用户打开多个浏览器 tab 时必须不同，避免 presence 和命令排查混在一起。 |
| `document` | 外部创建的 `Y.Doc`。组件不创建连接，只读取和监听这里的权威工作簿状态。 |
| `provider` | 外部创建的 `WebsocketProvider`。组件使用它的 awareness 展示远端选区，也由 adapter 复用它的 WebSocket 发送命令。 |
| `submitCommand` | 命令提交函数。推荐直接返回 `commandAdapter.submitCommand(envelope)`。 |
| `uploadAsset` | 协同模式下插入图片、导入图片、背景图、水印等资源时调用。返回资源引用，真实文件由业务文件服务保存。 |
| `resolveAsset` | 导出 Excel 时把资源引用换成真实二进制，组件会把图片内嵌进 `.xlsx`。 |
| `user.userId` | 当前业务用户 ID。 |
| `user.displayName` | 当前用户展示名。 |
| `user.color` | 当前用户远端选区颜色。 |

函数职责说明：

| 函数 | 说明 |
| --- | --- |
| `createOfficeExcelYWebSocketCommandAdapter(provider, options?)` | 创建协同命令适配器。内部复用 `provider.ws`，不额外创建第二条 WebSocket。 |
| `commandAdapter.submitCommand(envelope)` | 发送 Excel 语义命令，返回后端 `command.ack` 或 `command.reject`。 |
| `commandAdapter.destroy()` | 页面卸载时清理 WebSocket message 监听和未完成命令。必须调用。 |
| `submitCommand(envelope)` | 传给组件的回调。一般只需要调用 `commandAdapter.submitCommand(envelope)`。 |
| `uploadAsset(file, context)` | 上传协同资源，返回 `{ assetId, url, name, mimeType }` 等引用信息。 |
| `resolveAsset(asset, context)` | 导出时下载或解析资源引用，返回 `Blob`、`ArrayBuffer`、`Uint8Array` 或 data URL。 |

### WebSocket 命令通道约定

正式协同命令建议和 Yjs sync / awareness 共用同一个协同 WebSocket 连接。前端发送的是一条二进制消息：

```text
varUint messageType = 100
varString JSON payload
```

JSON payload 是 `OfficeExcelCollaborationCommandEnvelope` 展开后的对象，并额外包含两个协议字段：

```json
{
  "protocol": "norio-office-excel-command",
  "version": 1,
  "type": "command.submit",
  "requestId": "req_xxx",
  "clientId": "browser-tab-001",
  "workbookId": "excel-demo-file-001",
  "localCommandId": "cell.set-value",
  "command": {
    "type": "cell.set-value",
    "opId": "op_xxx",
    "sheetId": "sheet_xxx"
  }
}
```

后端返回 `command.ack` 或 `command.reject` 时也使用同样的 `messageType=100` 和 `protocol/version`。如果宿主在 `submitCommand` 内等待 ack/reject，可以直接把结果作为 Promise 返回；如果 ack/reject 是异步推送到业务层，则业务层拿到结果后调用 `excelRef.value?.applyCollaborationCommandResult(result)` 回灌组件。

协同命令只走 WebSocket command channel，不再提供 HTTP command 接入。HTTP 仍可用于图片、背景图、附件等资源上传下载。

组件库已经内置了 y-websocket command adapter，客户项目通常不需要自己处理 WebSocket 编解码、pending 队列、ack/reject 匹配、超时清理和 `messageType=100` 兼容：

```ts
const commandAdapter = createOfficeExcelYWebSocketCommandAdapter(provider)

async function submitCommand(envelope: OfficeExcelCollaborationCommandEnvelope) {
  return commandAdapter.submitCommand(envelope)
}

onBeforeUnmount(() => {
  commandAdapter.destroy()
})
```

适配器内部会把 `provider.ws` 作为 command socket，注册 `messageType=100` 的 y-websocket 兼容 handler，并按 `requestId` 匹配 `command.ack` / `command.reject`。如果业务侧不用 y-websocket 或协议不一致，可以继续自己实现 `submitCommand`。

### `submitCommand` 收到的 envelope

```ts
interface OfficeExcelCollaborationCommandEnvelope {
  type: 'command.submit'
  requestId: string
  clientId: string
  workbookId: string
  sheetId?: string
  localCommandId: string
  command: {
    type: string
    opId: string
    sheetId?: string
    [key: string]: unknown
  }
}
```

`OfficeExcelCollaborationCommandEnvelope` 字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `type` | `'command.submit'` | envelope 类型。本地提交固定为 `command.submit`。 |
| `requestId` | `string` | 本次提交请求 ID。服务端应优先用它做幂等；重复 `requestId` 建议返回上一次处理结果。 |
| `clientId` | `string` | 当前客户端实例 ID，对应 `collaboration.clientId`。 |
| `workbookId` | `string` | 工作簿 ID，对应 `collaboration.workbookId`。 |
| `sheetId` | `string` | 命令关联的工作表 ID。部分工作簿级命令可能为空。 |
| `localCommandId` | `string` | 组件内部本地命令 ID，例如 `cell.set-value`、`structure.insert-row-above`、`sheet.rename`、`collab.lock-range`。它主要用于前端日志和排查，不建议后端用它做语义分发。 |
| `command` | `{ type: string; opId: string; ... }` | 发送给服务端的语义命令正文。不同命令字段不同，服务端应按 `command.type` 解析。 |

`command` 常见字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `type` | `string` | 服务端语义命令类型，例如 `cell.set-value`、`row.insert-above`、`structure.merge-range`。 |
| `opId` | `string` | 本次操作 ID，可用于日志追踪和去重辅助。 |
| `sheetId` | `string` | 命令目标工作表。 |
| `rowId` / `colId` | `string` | 稳定行列 ID。协同结构操作不应长期依赖数字行列号。 |
| `startRowId` / `endRowId` | `string` | 区域起止行稳定 ID。 |
| `startColId` / `endColId` | `string` | 区域起止列稳定 ID。 |
| `payload` | `object` | 部分命令会把原始参数放在 `payload` 中，服务端需要兼容平铺字段和嵌套 payload。 |

协同锁定 / 抢占命令映射：

| `localCommandId` | `command.type` | 说明 |
| --- | --- | --- |
| `collab.lock-range` | `cell-lock.set` | 锁定当前选中的区域。 |
| `collab.unlock-range` | `cell-lock.clear` | 取消指定锁定规则。部分取消时，前端会先清除原规则，再提交剩余区域的新锁定规则。 |
| `collab.claim-cell` | `cell-claim.acquire` | 抢占一个单元格。 |
| `collab.release-claim` | `cell-claim.release` | 释放指定抢占规则。关闭抢占并释放权限时，组件会按 sheet 分批释放当前用户在整个工作簿内的抢占规则。 |
| `image.delete-floating` | `floating-image.delete` | 删除当前 sheet 中指定的浮动图片。单元格内图片仍通过 `range.clear-content` 清除。 |

后端应始终按 `command.type` 做语义分发，`localCommandId` 只作为前端本地命令来源和调试信息。特别是锁定 / 抢占命令，前端本地 ID 是 `collab.*`，服务端语义命令是 `cell-lock.*` / `cell-claim.*`；浮动图片删除的前端本地 ID 是 `image.delete-floating`，服务端语义命令是 `floating-image.delete`。

`workbook.initialize` 是特殊的工作簿级命令，用于空房间首次初始化。它由组件在 provider 首次同步完成且 Y.Doc 没有工作簿内容时发送，后端需要在同一个 room 的串行队列里判断：房间为空才写入初始工作簿；房间已有内容时返回 ack，并保持已有内容不变。初始化判断不能依赖固定延迟，也不能由前端直接写入 Y.Doc 代替。

`cell-lock.set` / `cell-claim.acquire` 命令的 owner 建议以后端连接上下文为准：

| owner 字段 | 建议来源 | 说明 |
| --- | --- | --- |
| `userId` | WebSocket 参数或鉴权上下文里的 `userId` | 用于判断同一个业务用户是否拥有锁定或抢占。 |
| `clientId` | WebSocket 参数里的 `clientUniqueCode` | 用于区分同一个用户的不同浏览器 tab 或设备。 |
| `displayName` | WebSocket 参数里的 `userName` | 用于提示“已被某某锁定 / 抢占”。 |
| `color` | 前端 `collaboration.user.color` 或后端分配色 | 用于渲染覆盖层。 |

后端写入 Y.Doc 时，锁定和抢占规则应落在对应 sheet 的 `cellLocks` 中。前端会根据 `kind: 'lock' | 'claim'` 渲染不同背景，并根据 `owner.userId` / `owner.clientId` 判断当前用户是否有权操作。

### 服务端命令结果

```ts
interface OfficeExcelCollaborationCommandAck {
  type: 'command.ack'
  requestId: string
  opId?: string
  workbookId: string
  accepted: true
  serverSeq?: number
}

interface OfficeExcelCollaborationCommandReject {
  type: 'command.reject'
  requestId: string
  opId?: string
  workbookId: string
  accepted: false
  code: 'INVALID_COMMAND' | 'STALE_TARGET' | 'CONFLICT' | 'SERVER_ERROR'
  reason: string
}
```

`OfficeExcelCollaborationCommandAck` 字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `type` | `'command.ack'` | 服务端确认类型，固定为 `command.ack`。 |
| `requestId` | `string` | 对应提交时的 `requestId`。组件用它清理 pending 命令。 |
| `opId` | `string` | 对应 `command.opId`，可选但建议返回，方便日志排查。 |
| `workbookId` | `string` | 当前工作簿 ID。 |
| `accepted` | `true` | 是否接受命令。ack 固定为 `true`。 |
| `serverSeq` | `number` | 服务端顺序号，可选。建议服务端返回，方便排查命令顺序。 |

`OfficeExcelCollaborationCommandReject` 字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `type` | `'command.reject'` | 服务端拒绝类型，固定为 `command.reject`。 |
| `requestId` | `string` | 对应提交时的 `requestId`。组件用它找到需要回滚的 pending 命令。 |
| `opId` | `string` | 对应 `command.opId`，可选但建议返回。 |
| `workbookId` | `string` | 当前工作簿 ID。 |
| `accepted` | `false` | 是否接受命令。reject 固定为 `false`。 |
| `code` | `'INVALID_COMMAND' \| 'STALE_TARGET' \| 'CONFLICT' \| 'SERVER_ERROR'` | 拒绝原因代码。组件会把它透传给事件。 |
| `reason` | `string` | 面向开发和用户提示的拒绝原因。建议后端返回清晰中文或可翻译文案。 |

reject code 建议含义：

| code | 中文说明 | 常见场景 |
| --- | --- | --- |
| `INVALID_COMMAND` | 命令无效 | 命令类型不支持、字段缺失、格式错误。 |
| `STALE_TARGET` | 目标已失效 | 目标 sheet、行、列、区域、合并范围已经被其他人删除或不存在。 |
| `CONFLICT` | 状态冲突 | 合并区域重叠、结构操作无法安全应用。 |
| `SERVER_ERROR` | 服务端异常 | 后端执行异常、网络层转为统一错误。 |

协同接入建议：

- `workbookId` 和 `clientId` 保持稳定。
- 服务端建议按 `requestId` 做幂等，`opId` 用于操作追踪。
- 服务端必须按 `command.type` 分发语义命令，不能按 `localCommandId` 判断业务含义。
- 空房间初始化必须走 `workbook.initialize`，客户项目不要绕过组件直接写 Y.Doc。
- `submitCommand` 收到 `result.accepted === false` 时，应把标准 `command.reject` 返回给组件。
- 如果命令结果通过异步 WebSocket 返回，宿主拿到结果后调用 `excelRef.value?.applyCollaborationCommandResult(result)` 回灌组件。
- 组件收到 reject 后会把该命令的本地乐观修改回滚到提交前快照，并触发 `collaboration-command-reject` 事件。
- 外部 provider 如果提供 Yjs awareness，组件会用于远端选区展示。
- 未启用协同时，`collab` tab 不显示。

### 本地双窗口测试

如果使用本仓库 playground，可以按下面方式测试。示例假设 playground 运行在 `http://127.0.0.1:5173`；如果该端口被其他项目占用，请替换为 Vite 实际启动端口。

第一个窗口：

```text
http://127.0.0.1:5173/?collab=1&room=excel-demo-file-001&server=ws://127.0.0.1:1234/collaboration&token=dev-token&userId=user_001&name=Alice&clientUniqueCode=browser-tab-001
```

第二个窗口：

```text
http://127.0.0.1:5173/?collab=1&room=excel-demo-file-001&server=ws://127.0.0.1:1234/collaboration&token=dev-token&userId=user_002&name=Bob&clientUniqueCode=browser-tab-002
```

测试时需要保证：

- 两个窗口使用相同的 `room`。
- 两个窗口使用不同的 `clientUniqueCode`。
- 后端 WebSocket 地址能访问，且支持 `messageType=100` 的 Excel command channel。
- 页面 command 状态栏能看到 `submit`、`ack`、`reject` 计数。
- 刷新任意窗口后，已编辑内容、sheet、锁定和抢占状态都应从服务端持久化的 Y.Doc 恢复。
- 无后端命令服务时仍可测试 raw Yjs 同步；要测试服务端权威命令，必须实现 WebSocket command channel。

### 发版证据门禁

组件仓库提供了真实文件和真实协同后端的可选发版门禁。开发环境可以保持默认 skipped，发布前建议在 CI 中显式设置最低门槛：

```bash
$env:OFFICE_EXCEL_REAL_XLSX_DIR='D:\your-real-xlsx-samples'
$env:OFFICE_EXCEL_REAL_XLSX_MIN_SAMPLES='10'
$env:OFFICE_EXCEL_COLLAB_LIVE='1'
$env:OFFICE_EXCEL_COLLAB_LIVE_REQUIRED='1'
$env:OFFICE_EXCEL_COLLAB_SERVER='ws://127.0.0.1:1234/collaboration'
$env:OFFICE_EXCEL_COLLAB_HTTP='http://127.0.0.1:1234'
$env:OFFICE_EXCEL_COLLAB_TOKEN='dev-token'
$env:OFFICE_EXCEL_COLLAB_SOAK_ITERATIONS='10'
$env:OFFICE_EXCEL_COLLAB_SOAK_MIN_ITERATIONS='10'

npm run test:release-gate
```

`test:release-gate` 会依次执行真实 `.xlsx/.xlsm` 样本验收、真实协同 smoke、真实协同 soak，以及最终的证据检查。需要排查某个环节时，也可以分别运行 `test:real-xlsx`、`test:collab-live`、`test:collab-soak` 和 `test:release-evidence`。

`test:release-evidence` 不会重新跑浏览器或导入导出，它只读取 `test/test-results/real-xlsx-samples.json` 和 `test/test-results/collab-live-soak.json`。如果最低样本数或最低 soak 轮次没有满足，它会失败；如果没有设置最低门槛，skipped 只会作为 warning 输出。
