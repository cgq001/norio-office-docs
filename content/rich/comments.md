---
{"title":"评论与业务数据","description":"评论与业务数据的接口、使用示例与行为说明。","order":44,"reference":true}
---

本页按主题整理项目公开说明，供完成快速接入后查阅。代码片段中的业务回调、服务地址和存储实现需要由宿主提供。

## 评论功能对接

评论功能由组件负责右侧栏 UI、正文锚点标注、回复交互、图片预览和评论输入框里的 `@` 弹层；评论数据本身由业务系统保存。对接时可以把它理解成：组件抛事件，业务保存数据，然后把新的 `comments` 数组再传回组件。

下面是一个完整的本地演示，包含：

- 当前评论用户假数据
- 已有评论线程假数据
- 评论图片上传 mock
- 评论里的 `@用户` / `@文档` 查询假数据
- 新建、回复、编辑、删除、完成评论的本地更新逻辑
- `comment-submit` 统一通知事件，用来拿到“评论了谁、@了谁、评论内容”等信息

```vue
<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { RichTextEditor } from '@norio-office/rich-text'
import type {
  RichTextEditorCommentCreatePayload,
  RichTextEditorCommentDeletePayload,
  RichTextEditorCommentMentionProviderPayload,
  RichTextEditorCommentReplyPayload,
  RichTextEditorCommentResolvePayload,
  RichTextEditorCommentSubmitPayload,
  RichTextEditorCommentThread,
  RichTextEditorCommentUpdatePayload,
  RichTextEditorCommentUser,
  RichTextEditorMentionItem,
  RichTextEditorUploadInput,
  RichTextEditorUploadResult,
} from '@norio-office/rich-text'
import '@norio-office/rich-text/style.css'

const content = ref({
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: '评论对接示例文档' }],
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: '选中这段文字后点击工具栏评论按钮，就可以新建评论。' }],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: '评论输入框里输入 @',
          marks: [{ type: 'commentMark', attrs: { threadId: 'thread-demo-1' } }],
        },
        { type: 'text', text: ' 可以选择用户或文档。' },
      ],
    },
  ],
})

const commentUser: RichTextEditorCommentUser = {
  id: 'user-current',
  name: '当前用户',
  color: '#2563eb',
}

const mentionOptions: RichTextEditorMentionItem[] = [
  { id: 'user-001', name: '崔国强', type: 1 },
  { id: 'user-002', name: '张晓明', type: 1 },
  { id: 'user-003', name: '李思雨', type: 1 },
  { id: 'doc-001', name: '产品需求文档', type: 2, tag: '文档', updatedAt: '今天 10:30' },
  { id: 'doc-002', name: '协同功能设计稿', type: 2, tag: '外部', updatedAt: '昨天 19:17' },
  { id: 'doc-003', name: '上线检查清单', type: 2, tag: '模板', updatedAt: '2026-05-17' },
]

const comments = ref<RichTextEditorCommentThread[]>([
  {
    id: 'thread-demo-1',
    anchorText: '评论输入框里输入 @',
    status: 'open',
    comments: [
      {
        id: 'comment-demo-1',
        content: '这里可以 @张晓明 看一下评论提及。',
        mentions: [{ id: 'user-002', name: '张晓明', type: 1 }],
        author: { id: 'user-001', name: '崔国强', color: '#4c7dff' },
        createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      },
      {
        id: 'comment-demo-2',
        parentId: 'comment-demo-1',
        content: '收到，也可以关联 @产品需求文档。',
        mentions: [{ id: 'doc-001', name: '产品需求文档', type: 2, tag: '文档' }],
        author: { id: 'user-002', name: '张晓明', color: '#16a34a' },
        createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      },
    ],
  },
])

const demoObjectUrls: string[] = []
onBeforeUnmount(() => demoObjectUrls.forEach(url => URL.revokeObjectURL(url)))

async function uploadCommentImage(payload: RichTextEditorUploadInput): Promise<RichTextEditorUploadResult> {
  // 真实项目里改成上传到文件服务，然后返回 url/name/size/mimeType。
  const url = URL.createObjectURL(payload.file)
  demoObjectUrls.push(url)
  return {
    url,
    name: payload.file.name,
    size: payload.file.size,
    mimeType: payload.file.type,
  }
}

async function handleCommentMentionSearch(payload: RichTextEditorCommentMentionProviderPayload): Promise<RichTextEditorMentionItem[]> {
  // 真实项目里按 payload.query、payload.type、payload.threadId 等调用接口。
  const keyword = payload.query.trim().toLowerCase()

  return mentionOptions.filter((item) => {
    const typeMatched = payload.type === 'all' || !payload.type || item.type === payload.type
    const keywordMatched = !keyword || item.name.toLowerCase().includes(keyword) || item.id.toLowerCase().includes(keyword)
    return typeMatched && keywordMatched
  })
}

function handleCommentCreate(payload: RichTextEditorCommentCreatePayload) {
  comments.value = [
    ...comments.value,
    {
      id: payload.threadId,
      anchorText: payload.anchorText,
      status: 'open',
      comments: [
        {
          id: payload.commentId,
          content: payload.content,
          images: payload.images,
          mentions: payload.mentions,
          author: payload.author,
          createdAt: payload.createdAt,
        },
      ],
    },
  ]
}

function handleCommentReply(payload: RichTextEditorCommentReplyPayload) {
  comments.value = comments.value.map((thread) =>
    thread.id === payload.threadId
      ? {
          ...thread,
          comments: [
            ...thread.comments,
            {
              id: payload.commentId,
              parentId: payload.parentId,
              content: payload.content,
              images: payload.images,
              mentions: payload.mentions,
              author: payload.author,
              createdAt: payload.createdAt,
            },
          ],
        }
      : thread,
  )
}

function handleCommentUpdate(payload: RichTextEditorCommentUpdatePayload) {
  comments.value = comments.value.map((thread) =>
    thread.id === payload.threadId
      ? {
          ...thread,
          comments: thread.comments.map((item) =>
            item.id === payload.commentId
              ? {
                  ...item,
                  content: payload.content,
                  images: payload.images ?? item.images,
                  mentions: payload.mentions,
                  updatedAt: payload.updatedAt,
                }
              : item,
          ),
        }
      : thread,
  )
}

function handleCommentDelete(payload: RichTextEditorCommentDeletePayload) {
  if (!payload.commentId) {
    comments.value = comments.value.filter((thread) => thread.id !== payload.threadId)
    return
  }

  comments.value = comments.value
    .map((thread) =>
      thread.id === payload.threadId
        ? {
            ...thread,
            comments: thread.comments.filter((item) => item.id !== payload.commentId && item.parentId !== payload.commentId),
          }
        : thread,
    )
    .filter((thread) => thread.comments.length > 0)
}

function handleCommentResolve(payload: RichTextEditorCommentResolvePayload) {
  comments.value = comments.value.map((thread) =>
    thread.id === payload.threadId
      ? { ...thread, status: payload.resolved ? 'resolved' : 'open' }
      : thread,
  )
}

function handleCommentSubmit(payload: RichTextEditorCommentSubmitPayload) {
  // 这个事件适合做通知、消息流、审计日志。
  // payload.content：评论内容
  // payload.mentions：本次评论 @ 的用户/文档
  // payload.targetUserId / targetCommentId：回复别人时，被回复用户和评论 ID
  console.log('comment submit:', payload)
}
</script>

<template>
  <RichTextEditor
    v-model="content"
    :comments="comments"
    :comment-user="commentUser"
    :show-comments="true"
    :upload-comment-image="uploadCommentImage"
    :comment-mention-provider="handleCommentMentionSearch"
    @comment-create="handleCommentCreate"
    @comment-reply="handleCommentReply"
    @comment-update="handleCommentUpdate"
    @comment-delete="handleCommentDelete"
    @comment-resolve="handleCommentResolve"
    @comment-submit="handleCommentSubmit"
  />
</template>
```

## 评论 Props

上例数据只在内存中更新，刷新页面会丢失；mock 图片地址只在本次页面生命周期有效。生产中必须换成持久化接口和长期可访问的图片 URL。`comment-submit` 是同一次操作的汇总通知，不要与 `comment-create/reply/update` 再重复写入同一条评论。用户身份和编辑/删除权限仍应由后端校验。

| Prop | 类型 | 说明 |
| --- | --- | --- |
| `comments` | `RichTextEditorCommentThread[] \| null` | 评论线程列表，业务方持久化并回传。 |
| `commentUser` | `RichTextEditorCommentUser \| null` | 当前评论用户；未传时尝试使用协同用户，两者都不可用时不能新建或回复。 |
| `showComments` | `boolean` | 是否显示评论功能；为 `true` 时显示工具栏评论按钮和右侧评论栏，为 `false` 或不传时隐藏评论入口和评论栏。 |
| `uploadCommentImage` | `RichTextEditorUploadHook \| null` | 评论图片上传 hook，返回结构同 `uploadImage`；未传时会回退使用 `uploadImage`。 |
| `commentMention` | `boolean` | 是否启用评论输入框里的 `@` 提及，默认启用。 |
| `commentMentionProvider` | `RichTextEditorCommentMentionProvider \| null` | 评论 `@` 查询数据源，独立于正文 `mentionProvider`。 |
| `onCommentMentionSearch` | `RichTextEditorCommentMentionProvider \| null` | 评论 `@` 查询函数的另一种传入方式，独立于正文 `onMentionSearch`。 |

## 评论事件

| 事件 | Payload | 说明 |
| --- | --- | --- |
| `comment-create` | `RichTextEditorCommentCreatePayload` | 用户选中文字并发布第一条评论时触发。 |
| `comment-reply` | `RichTextEditorCommentReplyPayload` | 用户在已有评论线程下回复时触发；回复某人时会带 `parentId`、`targetUserId`、`targetCommentId`。 |
| `comment-update` | `RichTextEditorCommentUpdatePayload` | 用户编辑评论内容时触发。 |
| `comment-delete` | `RichTextEditorCommentDeletePayload` | 删除单条评论或整个评论线程时触发。 |
| `comment-resolve` | `RichTextEditorCommentResolvePayload` | 用户点击完成评论线程时触发。 |
| `comment-select` | `RichTextEditorCommentThread` | 用户点击正文标注或侧边栏评论卡片时触发。 |
| `comment-submit` | `RichTextEditorCommentSubmitPayload` | 新建、回复、编辑评论后都会触发；会带 `content`、`mentions`、`targetUserId`、`targetCommentId` 等通知所需信息。 |
| `comment-mention-search` | `RichTextEditorCommentMentionProviderPayload` | 评论输入框触发 `@` 查询时通知外部；实际返回数据请使用 `commentMentionProvider` 或 `onCommentMentionSearch`。 |
| `comment-mention-item-click` | `RichTextEditorCommentMentionItem` | 用户点击评论 `@` 弹层里的某个用户/文档时触发。 |
| `comment-mention-submit` | `RichTextEditorCommentMentionItem` | 用户确认选择评论 `@` 用户/文档时触发。 |

## 数据保存建议

- 评论锚点是正文内容的一部分，会随 `v-model` JSON 或 Yjs 协同内容保存。
- 评论列表不写入正文 JSON，建议后端按 `documentId + threadId` 独立保存。
- 新建评论时，组件会先给选区写入 `threadId` 标注；业务方收到 `comment-create` 后应保存同一个 `threadId` 并回传到 `comments`。
- 回复某一条评论时，业务方保存回复项时保留 `parentId`，组件会把它展示在被回复评论下面。
- 评论内容里的 `@用户` / `@文档` 以普通文本插入到 `content`，同时会通过 `mentions` 数组把 `{ id, name, type }` 等结构化信息抛出，业务方建议一起保存。
- 评论 `@` 的查询通道与正文提及通道完全独立，接入评论提及时不要复用 `mention-search` 事件。
- 多人协同时，正文锚点跟随 Yjs 同步；评论数据需要业务后端自行广播或刷新。
- `commentUser` 可以不传；组件会优先使用 `commentUser`，没有时回退使用 `collaboration.user`。如果两者都没有，新建评论和回复按钮会禁用。
- 实例方法 `focusCommentThread(threadId): boolean` 可从外部定位到指定评论锚点。
