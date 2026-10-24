---
{"title":"自动保存与崩溃恢复","description":"自动保存与崩溃恢复的接口、使用示例与行为说明。","order":41,"reference":true}
---

本页按主题整理项目公开说明，供完成快速接入后查阅。代码片段中的业务回调、服务地址和存储实现需要由宿主提供。

## 持久化配置

持久化统一通过一个 `persistence` 对象传入：

```vue
<OfficePpt
  v-model="deck"
  :persistence="{
    documentId,
    adapter: storageAdapter,
    autosave: true,
  }"
/>
```

`OfficePptComponentPersistenceOptions`：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `documentId` | `string` | 是 | 外部系统中的文档唯一 ID |
| `adapter` | `OfficePptDocumentStorageAdapter` | 是 | 文档加载和保存适配器 |
| `autosave` | `boolean \| OfficePptAutosaveOptions` | 否 | 是否自动保存，或自动保存的详细配置 |
| `loadOnMount` | `boolean` | 否 | 组件挂载后是否调用适配器加载文档 |
| `recoveryStore` | `OfficePptRecoveryStore` | 否 | 崩溃恢复数据存储 |
| `recoverySessionId` | `string` | 否 | 崩溃恢复会话 ID |
| `initialRevision` | `OfficePptDocumentRevision` | 否 | 服务端已知的初始版本，用于并发冲突检测 |

组件包内置以下适配器：

- `LocalStorageOfficePptDocumentStorageAdapter`
- `InMemoryOfficePptDocumentStorageAdapter`
- `HttpOfficePptDocumentStorageAdapter`
- `LocalStorageOfficePptRecoveryStore`
- `InMemoryOfficePptRecoveryStore`

也可以实现自己的服务端适配器：

```ts
import type {
  OfficePptDocumentStorageAdapter,
  OfficePptDocumentLoadResult,
  OfficePptDocumentSaveRequest,
  OfficePptDocumentSaveResult,
} from '@norio-office/office-ppt'

class MyStorageAdapter implements OfficePptDocumentStorageAdapter {
  async load(documentId: string): Promise<OfficePptDocumentLoadResult | null> {
    // 从业务服务读取 PPTX Blob 和版本信息
    return null
  }

  async save(request: OfficePptDocumentSaveRequest): Promise<OfficePptDocumentSaveResult> {
    // 将 request.pptx 上传到业务服务
    return {
      status: 'saved',
      revision: {
        id: 'revision-1',
        sequence: 1,
        updatedAt: new Date().toISOString(),
      },
    }
  }
}
```


## 完整接入示例

下面的示例包含文档状态、自动保存、导入 PPTX 和导出下载。

```vue
<script setup lang="ts">
import { ref } from 'vue'
import OfficePpt, {
  LocalStorageOfficePptDocumentStorageAdapter,
  LocalStorageOfficePptRecoveryStore,
  createOfficePptDeck,
  type OfficePptChangePayload,
  type OfficePptDeck,
  type OfficePptPersistencePublicApi,
  type OfficePptPersistenceState,
  type OfficePptPublicApi,
} from '@norio-office/office-ppt'
import '@norio-office/office-ppt/style.css'

type EditorApi = OfficePptPublicApi & OfficePptPersistencePublicApi

const editorRef = ref<EditorApi | null>(null)
const deck = ref<OfficePptDeck>(createOfficePptDeck({ title: '演示文稿' }))
const documentId = 'presentation-001'
const storageAdapter = new LocalStorageOfficePptDocumentStorageAdapter()
const recoveryStore = new LocalStorageOfficePptRecoveryStore()

const persistence = {
  documentId,
  adapter: storageAdapter,
  recoveryStore,
  autosave: {
    enabled: true,
    debounceMs: 1000,
    maxRetries: 3,
  },
  loadOnMount: true,
}

function handleChange(payload: OfficePptChangePayload) {
  console.log('PPT 已变化', payload.source, payload.deck)
}

function handleSaveStateChange(state: OfficePptPersistenceState) {
  console.log('保存状态', state.status)
}

async function handleImport(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  await editorRef.value?.importPptx(file)
  input.value = ''
}

async function handleExport() {
  const blob = await editorRef.value?.exportPptx({
    fieldDate: new Date(),
    fieldDateFormat: 'yyyy/m/d',
    fieldDateLocale: 'zh-CN',
    fieldDateTimeZone: 'Asia/Shanghai',
  })
  if (!blob) return

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${deck.value.title || '演示文稿'}.pptx`
  anchor.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="actions">
    <input type="file" accept=".pptx" @change="handleImport">
    <button type="button" @click="handleExport">导出 PPTX</button>
  </div>

  <div class="ppt-editor-container">
    <OfficePpt
      ref="editorRef"
      v-model="deck"
      :feature-codes="['exportPPT', 'importPPT', 'exportImage', 'exportPDF']"
      :persistence="persistence"
      @change="handleChange"
      @save-state-change="handleSaveStateChange"
    />
  </div>
</template>

<style scoped>
.ppt-editor-container {
  width: 100%;
  height: calc(100vh - 48px);
}
</style>
```
