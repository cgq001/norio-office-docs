---
{"title":"PPTX 与 PDF 导出","description":"PPTX 与 PDF 导出的接口、使用示例与行为说明。","order":42,"reference":true}
---

本页按主题整理项目公开说明，供完成快速接入后查阅。代码片段中的业务回调、服务地址和存储实现需要由宿主提供。

## 导入 PPTX

单个 PPTX 文件最大 **200M（200 × 1024 × 1024 字节）**，恰好 200M 可进入解析。超过上限时在读取文件、复制缓冲区和解压之前拒绝导入，不修改当前文档；组件 loading 显示“导入超过最大限制200M”，点击“知道了”关闭提示后可重新选择文件。文件选择导入和组件 `importPptx` 使用同一规则；底层直接导入、Worker 及其降级路径也执行硬限制，`resourceBudget.maxFileBytes` 可设更小值，但不能突破 200M 上限。未超过文件大小上限仍需通过解压体积、部件数量等资源安全校验。

```ts
async function importFile(file: File) {
  await editorRef.value?.importPptx(file)
}
```

也可以使用包级函数，只解析数据而不操作组件：

```ts
import { importOfficePptx } from '@norio-office/office-ppt'

const deck = await importOfficePptx(file)
```


## 导出 PPTX

通过组件导出：

```ts
const pptx = await editorRef.value?.exportPptx()
```

日期字段刷新配置属于单次导出操作，不属于组件 Props：

```ts
const pptx = await editorRef.value?.exportPptx({
  fieldDate: new Date(),
  fieldDateFormat: 'yyyy/m/d',
  fieldDateLocale: 'zh-CN',
  fieldDateTimeZone: 'Asia/Shanghai',
})
```

面向 SDK 上传、归档或自定义下载时，可直接获取标准化导出结果：

```ts
const result = await editorRef.value?.exportPptBlob({
  type: 'pptx',
  fileName: '季度汇报',
})

if (result) {
  console.log(result.fileName) // 季度汇报.pptx
  console.log(result.mimeType)
  console.log(result.size)
  await uploadPresentation(result.blob)
}
```

对应类型：

```ts
type ExportPptBlobOptions = {
  type?: 'pptx'
  fileName?: string
}

type ExportPptBlobResult = {
  blob: Blob
  fileName: string
  mimeType: string
  size: number
}
```

`type` 当前只支持 `pptx`；`fileName` 可省略扩展名。方法复用组件当前的 PPTX 导出链路，并使用编辑器内当前选择的日期字段导出配置。

常用导出参数：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `fieldDate` | `Date \| string` | 刷新受支持的日期字段；不传则保留原缓存值 |
| `fieldDateFormat` | `OfficePptDateFieldFormat` | 日期格式，默认 `yyyy/m/d` |
| `fieldDateLocale` | `string` | `locale-*` 格式使用的区域设置 |
| `fieldDateTimeZone` | `OfficePptDateFieldTimeZone` | `local`、`utc` 或 `Asia/Shanghai` 等 IANA 时区 |
| `signal` | `AbortSignal` | 取消导出 |
| `timeoutMs` | `number` | 导出超时时间 |
| `onProgress` | `(progress) => void` | 接收导出进度 |
| `resourceBudget` | `Partial<OfficePptResourceBudget>` | 限制导出资源用量 |

`fieldDateFormat` 支持：

- `yyyy/m/d`
- `yyyy-mm-dd`
- `m/d/yyyy`
- `d/m/yyyy`
- `locale-short`
- `locale-medium`
- `locale-long`
- `custom:<格式>`

直接导出一个 `OfficePptDeck`：

```ts
import { exportOfficePptx } from '@norio-office/office-ppt'

const blob = await exportOfficePptx(deck, {
  onProgress(progress) {
    console.log(progress.stage, progress.completed, progress.total)
  },
})
```

下载导出的文件：

```ts
function downloadPptx(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName.endsWith('.pptx') ? fileName : `${fileName}.pptx`
  anchor.click()
  URL.revokeObjectURL(url)
}
```


## 原生动画与矢量 PDF

- 支持导入运动路径、旋转、缩放、RGB 颜色及常见数值属性行为；同一容器的多个行为在一次单击内并发，支持保持末态、重复/往返、回退和观众窗口同步。对象使用原生 drawing ID，不再假定它等于数组下标。未知滤镜、交互触发序列和任意公式继续明确提示并保留，不假装完整支持所有 OOXML 动画。
- 本仓库的开发/预览入口默认通过同源本地转换模块导出矢量 PDF，不调用打印对话框；服务首次导出时按需启动无界面 Chromium。普通文字、形状和图表保留矢量；原图本身是位图或浏览器复杂滤镜需要栅格化时，不能宣称每个像素都来自矢量。
- 构建组件的宿主可提供 `pdfRenderer`。未提供时仍保留原有离线导出（位图外观 + 检索层），状态栏会明确说明；已提供转换器但转换失败时不会偷偷回退位图。

```ts
import { createHttpOfficePptPdfRenderer } from '@norio-office/office-ppt'
const pdfRenderer = createHttpOfficePptPdfRenderer({ url: '/api/export/pdf' })
// <OfficePpt :pdf-renderer="pdfRenderer" ... />
```

部署转换服务：仓库根目录安装开发依赖并执行 `npx playwright install chromium` 后，可运行 `npm run start:pdf`；生产环境也可在 `server/export` 单独执行 `npm ci`、安装 Chromium，再运行 `npm start`。默认仅监听 `127.0.0.1:5196`，反向代理 `/api/export/` 到此服务；对公网部署必须配置鉴权（`OFFICE_PPT_PDF_TOKEN` 或宿主鉴权代理）、用户级限流及相同字体。支持 `OFFICE_PPT_PDF_HOST/PORT/CORS_ORIGIN`。字体指纹不匹配、超限或主动内容会明确拒绝；服务不读取外部 URL/本地文件，不上传到第三方。

PDF 引擎作为按需资源加载。部署时必须保留完整 `dist`，包括 `pdf-lib.esm.min.js`，不能只复制主 JS。子路径部署与首次导出加载已有浏览器回归。
