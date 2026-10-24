---
{"title":"协作接入参考","description":"协作接入参考的接口、使用示例与行为说明。","order":43,"reference":true}
---

> **Docker 版本必需**：多人协作需要部署 Docker 版本并接通对应协作服务。以下是前端协议参考；开发服务示例不替代生产 Docker 部署。

本页按主题整理项目公开说明，供完成快速接入后查阅。代码片段中的业务回调、服务地址和存储实现需要由宿主提供。

## 协同编辑

推荐使用统一协同服务接入当前富文本组件。当前富文本组件的类型是 `rich`，不要把它作为未来 Word 组件的 `documentType=word` 接入。

```bash
npm install yjs y-websocket
```

最小接入示例：

```vue
<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import type { JSONContent } from '@tiptap/core'
import { RichTextEditor } from '@norio-office/rich-text'
import '@norio-office/rich-text/style.css'

const fileId = 'rich-demo-file-001'
const content = ref<JSONContent | null>(null)
const ydoc = new Y.Doc()

const user = {
  userId: 'user_001',
  userName: 'Alice',
  clientUniqueCode: crypto.randomUUID(),
  color: '#3b82f6',
}

const provider = new WebsocketProvider(
  'ws://127.0.0.1:1234/collaboration',
  fileId,
  ydoc,
  {
    params: {
      roomId: fileId,
      token: 'dev-token',
      userId: user.userId,
      userName: user.userName,
      clientType: 'web',
      clientUniqueCode: user.clientUniqueCode,
      documentType: 'rich',
    },
  },
)

const collaboration = computed(() => ({
  document: ydoc,
  field: 'content',
  provider,
  user: {
    name: user.userName,
    color: user.color,
    userId: user.userId,
    clientUniqueCode: user.clientUniqueCode,
  },
}))

onBeforeUnmount(() => {
  provider.destroy()
  ydoc.destroy()
})
</script>

<template>
  <RichTextEditor
    v-model="content"
    :collaboration="collaboration"
  />
</template>
```

关键规则：

- `WebsocketProvider` 的 room name 和 query 里的 `roomId` 建议保持同一个值。
- 同一个协同房间里的所有客户端必须使用同一个 `field`，普通一文档一编辑器场景固定用 `content`。
- 同一个用户开两个浏览器窗口时，`clientUniqueCode` 必须不同；后端不会按 `userId` 去重在线客户端。
- `provider + user` 都传入时，组件才会显示远程光标和远程选区。
- 协同模式下 Y.Doc/Yjs fragment 是内容事实来源，外部 `modelValue` 不会再作为远程内容的权威写入源。
- 协同扩展在组件创建时配置。切换文档/房间或从单人切换到协同时，应销毁旧 provider/Y.Doc，并用新的 `key` 重新挂载编辑器；只改 prop 不会重建协同扩展。

初始化规则：

- 默认情况下，组件不会把 `modelValue` 写入空的协同 fragment。
- 如果后端已有 Yjs 快照，必须以快照为准，不要传 `initializeContent: true`。
- 如果是全新的空房间，宿主业务必须先确认当前客户端拥有初始化权，再传 `initializeContent: true` 和 `initialContent`。

```ts
const collaboration = computed(() => ({
  document: ydoc,
  field: 'content',
  provider,
  user: { name: user.userName, color: user.color, userId: user.userId },
  initializeContent: ownsInitialContent,
  initialContent: ownsInitialContent ? businessContent : null,
}))
```

两窗口测试时，保持相同 `roomId`，但使用不同 `userId` 和 `clientUniqueCode`。只有第一个窗口应该带初始化权：

```text
http://127.0.0.1:5177/?collab=1&room=rich-demo-file-001&server=ws://127.0.0.1:1234/collaboration&token=dev-token&userId=user_001&name=Alice&clientUniqueCode=browser-tab-001&init=1

http://127.0.0.1:5177/?collab=1&room=rich-demo-file-001&server=ws://127.0.0.1:1234/collaboration&token=dev-token&userId=user_002&name=Bob&clientUniqueCode=browser-tab-002
```

> 本包内置的 `yjs/` 服务示例只适合快速本地验证。生产或完整联调建议使用统一协同后端，例如 `ws://127.0.0.1:1234/collaboration`。

组件支持普通单人编辑，也支持可选的 Yjs 协同编辑。

```vue
<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import type { JSONContent } from '@tiptap/core'
import { RichTextEditor } from '@norio-office/rich-text'
import '@norio-office/rich-text/style.css'

const ydoc = new Y.Doc()
const provider = new WebsocketProvider('ws://localhost:1234', 'office-word-demo', ydoc)
const content = ref<JSONContent | null>(null)
onBeforeUnmount(() => {
  provider.destroy()
  ydoc.destroy()
})
</script>

<template>
  <RichTextEditor
    v-model="content"
    :collaboration="{
      document: ydoc,
      field: 'content',
      provider,
      user: {
        name: '张三',
        color: '#3b82f6',
      },
    }"
  />
</template>
```

协同模式下，Yjs fragment 是内容的事实来源。组件仍会 emit JSON 更新，但外部 `modelValue` 的变化不会再反向写入编辑器。如果需要远程光标，请在宿主项目安装 `y-websocket`，并传入 `provider` 和 `user`。

不要把 `modelValue` 当作协同房间的初始化种子。默认情况下，组件不会把 `modelValue` 写入空的协同 fragment；如果全新房间需要默认内容，请先确认当前客户端拥有初始化权，再在 `collaboration` 里传入 `initializeContent: true` 和 `initialContent`。如果后端已经有 Yjs 快照，不要传初始化开关。


## 内置 Yjs 服务示例

发布包内包含一个最小 Yjs WebSocket 服务示例：

```bash
cd node_modules/@norio-office/rich-text/yjs
npm install
npm run start
```

默认监听地址为 `ws://0.0.0.0:1234`。客户端需要使用相同 WebSocket 地址和房间名：

```ts
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

const ydoc = new Y.Doc()
const provider = new WebsocketProvider('ws://127.0.0.1:1234', 'office-word-demo', ydoc)
```
