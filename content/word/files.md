---
{"title":"文件导入、导出与保存","description":"文件导入、导出与保存的接口、使用示例与行为说明。","order":42,"reference":true}
---

本页按主题整理项目公开说明，供完成快速接入后查阅。代码片段中的业务回调、服务地址和存储实现需要由宿主提供。

## 错误处理与保存状态

| 错误类型 / 代码 | 含义 |
| --- | --- |
| `OfficeWordFeatureAccessError` / `OFFICE_WORD_FEATURE_DISABLED` | 对应导入或导出功能未被 `featureCodes` 授权，实例带有 `featureCode`。 |
| `OfficeWordExportTypeError` / `OFFICE_WORD_UNSUPPORTED_EXPORT_TYPE` | `exportWordBlob()` 的 `type` 不受支持；该方法只接受 `'docx'`。 |
| `DocxImportError` / `import.*` | 导入失败或取消，带有 `code`、`message`、`details`。常见代码包括 `import.aborted`、`import.timeout`、`import.source-too-large`、`import.unsupported-binary-doc`。 |

导出、完整文档读取和编辑命令还可能产生其他异常；调用方应保留通用错误处理。`error` 事件是通知，不能替代对 Promise 的处理。

```ts
try {
  const api = wordRef.value
  if (!api) throw new Error('组件尚未就绪')
  const result = await api.exportWordBlob({ fileName: '文档.docx' })
  // 用 result.blob 和 result.fileName 执行业务保存。
} catch (error) {
  console.error('保存失败', error)
}
```

`exportWordBlob()` 表示文件已生成，并不代表文件已上传成功。宿主的“保存成功”提示应在自己的上传 / 持久化请求成功后显示；`dirty-change` 也不能替代网络保存结果。


## 导入资源限制

`docxImportLimits` 是以下字段的部分覆盖对象。限制值必须是正的有限数值；字节单位采用 `1 MiB = 1024 × 1024`。也可从包入口读取 `DEFAULT_DOCX_IMPORT_LIMITS`。

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `maxSourceBytes` | 50 MiB | 原文件大小。 |
| `maxZipEntries` | 2,000 | 文档包条目数量。 |
| `maxPartUncompressedBytes` | 64 MiB | 单个包部件解压后的大小。 |
| `maxXmlPartBytes` | 20 MiB | 单个 XML 部件大小。 |
| `maxTotalXmlBytes` | 80 MiB | 全部 XML 部件累计大小。 |
| `maxTotalUncompressedBytes` | 250 MiB | 全部部件累计解压大小。 |
| `maxCompressionRatio` | 200 | 压缩比上限。 |
| `maxXmlDepth` | 256 | XML 嵌套深度。 |
| `maxXmlNodes` | 1,000,000 | XML 节点数量。 |
| `maxRelationships` | 20,000 | 对象关系数量。 |
| `maxImages` | 500 | 图片数量。 |
| `maxImageCompressedBytes` | 20 MiB | 单张图片压缩数据大小。 |
| `maxImageBytes` | 40 MiB | 单张图片资源大小。 |
| `maxTotalImageBytes` | 100 MiB | 图片资源累计大小。 |
| `maxImagePixels` | 40,000,000 | 单张图片像素数量。 |
| `maxDataUrlBytes` | 140 MiB | 生成的数据 URL 累计大小。 |
| `maxModelNodes` | 500,000 | 文档模型节点数量。 |
| `maxHtmlBytes` | 20 MiB | HTML 文档内容大小。 |
| `timeoutMs` | 30,000 | 导入超时，单位毫秒。 |

```vue
<OfficeWord
  :font-urls="fontUrls"
  v-model="document"
  mode="edit"
  :docx-import-limits="{ maxSourceBytes: 20 * 1024 * 1024, timeoutMs: 60000 }"
/>
```


## 文档模型与持久化

`OfficeWordDocument` 以 `body` 作为正文来源，包含标题、页面、样式、分节、页眉页脚、注释和修订等数据。组件的 `update:modelValue`、`change`、`getDocument()` 和 `getDocumentAsync()` 均返回规范化的文档，不包含 `content` 投影字段。

主动保存使用 `await wordRef.value.getDocumentAsync()`：它等待已收到、依赖点击命中的文字按顺序提交，并刷新输入缓冲，随后返回完整模型；模型保存不额外等待整篇排版或 Canvas。读取期间若替换或卸载文档，Promise 会拒绝，宿主不要将此请求标记为保存成功。网络保存期间新发生的编辑属于后续快照，宿主仍需按版本处理保存结果。

```ts
const api = wordRef.value
if (!api) throw new Error('组件尚未就绪')
const snapshot = await api.getDocumentAsync()
await save(snapshot)
```

同步 `getDocument()` 用于读取当前已提交模型，不能代表仍在等待点击命中的文字已经保存。自动保存可以订阅 `change`／`update:modelValue`：延后输入尚未完成时，后续命令产生的快照会保留，完成后发布最新模型；收到更早事件后才发生的输入仍属于后续版本。

旧 v1 快照仍可作为 `modelValue` 或 `setDocument()` 输入。也可以在持久化入口显式升级：

```ts
import {
  loadOfficeWordDocument,
  migrateOfficeWordDocument,
  validateOfficeWordDocument,
} from '@norio-office/office-word'

const migrated = migrateOfficeWordDocument(persistedV1)
const validation = validateOfficeWordDocument(migrated)
const canonical = loadOfficeWordDocument(migrated)
await save(canonical)
```

迁移规则如下：

- v1 只有 `content` 时，迁移器将其转换为 `body`。
- v1 同时存在 `body` 与 `content` 且互相冲突时，`body` 是权威来源。
- 迁移注册表按版本逐步升级；高于当前版本的输入会被拒绝，不会被静默降级。
- `normalizeOfficeWordDocument()` 只规范化已经迁移到当前数据结构版本的输入，不执行跨版本迁移。
- 需要兼容旧编辑器或序列化器时调用 `createOfficeWordLayoutProjection(canonical)`；生成的布局投影不得写回持久化文档。


## 旧式公式兼容范围

DOCX 中的 `Equation.3`、`Equation.DSMT4` 嵌入公式在带有可解码预览时，以行内静态公式显示，保留尺寸、基线偏移及混排顺序。公式旁的文字可以正常编辑，DOCX 导出保留原始 OLE 二进制和原始预览；PDF、SVG、PNG 导出包含公式的静态外观。WMF／EMF 预览在已加载字体可用时转换为独立字形轮廓，PDF 可直接绘制这些矢量路径。

缺少可用预览时，从 OLE 的 `Equation Native` 流直接解析 MTEF 3／5，支持常见字符、希腊字母、分式、上下标、根号、括号、多行和矩阵等结构，生成独立 SVG 字形轮廓。缺少 VML 图框时按公式几何生成图框；已有图框保留原尺寸。DOCX 保存原始 OLE 字节，并补充生成的预览；正文、表格、页眉页脚、脚注尾注沿用同一解析路径。

积分支持单／双／三重、环路及顺／逆时针环路、居中／右侧上下限和伸展积分；长除法支持带商和不带商。两个版本先转换上下限顺序、长除法变体等差异，再使用共同的只读几何绘制。旧版求和、连乘、余积、并集及交集的大运算符也沿用这条路径。规则线、环路等是 SVG 矢量几何，不增加图片或公式编辑依赖。

还支持横向花括号及方括号注释、bra-ket、区间混合括号、上下箭头及向量、伸展帽号／波浪／弧线、部分边框和圆角边框，以及 MTEF 5 规范的 2–37 号字符重音／撇号／划线。旧版显式基底上下标（39／42／43）、新版极限的居中／右置、joint-status（35）及双侧注释箭头也可显示；基底、上下标及上下注释分别保留，嵌套内容计入外框。缺少预览时这些结构同样可以直接生成矢量显示，保存时仍保留原公式二进制。

这不等于完整支持所有历史 MTEF 版本和模板：MTEF 0／1／2／4 的直接解析、私有 MTCode／MT Extra 编码及缺少字形的自定义字体仍有兼容性限制。已支持结构也未完全还原所有自定义间距、标尺对齐及矩阵排版参数；不能据此宣称与历史应用逐像素一致。有可用原预览时仍优先使用预览。未知结构整式拒绝并保留兼容提示，不会静默漏掉某个操作数。只做显示，公式内部不支持修改、计算或 OLE 激活。直接使用底层导入 API 时，应先通过 `ensureOfficeWordBundledFontAssets(fontUrls)` 准备字体字节，再导入需要生成字形轮廓的文档；组件正常导入入口在字体就绪后使用。

请保留文档的 `source` 数据，丢失原始公式载荷时 DOCX 导出会明确报错，避免静默转成普通图片。外链对象及其他 OLE 类型不走 MTEF 显示路径。
