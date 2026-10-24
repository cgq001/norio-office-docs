---
{"title":"AI 协议与能力边界","description":"目标、授权、局部修改、资源和验证边界的详细说明。","order":49,"reference":true}
---

> **实施中，尚未完整验收。** 不应将接口数量当作完整产品能力；当前 AI 与协作的组合不支持。


2026-10-23。需求基线见仓库 `docs/AI对接需求/AI对接需求.md`；验收状态见 `docs/AI对接需求/实施与验收记录.md`。当前不能把命令分类或类型生成当作全部能力已验收。

宿主直接接线从 宿主对接交接清单 开始，含接口映射、资源/保存边界及 H01–H16 必要联调项；独立 Skill 内另附可编译 host-adapter-example.ts。仓库文档链接用于源码交接，安装包消费者使用独立 Skill 整目录中的 host-integration.md，不依赖包外仓库路径。

## 绑定现有组件

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { OfficePpt, type OfficePptPublicApi } from '@norio-office/office-ppt'
import type { OfficePptAiBridge, PptAiTarget } from '@norio-office/office-ppt/ai-protocol'
const editor = ref<OfficePptPublicApi | null>(null)
function openExistingHostPanel(request: { bridge: OfficePptAiBridge; target: PptAiTarget }) {
  // 交给宿主已有 DocumentAiPanel；本组件不调用模型或创建聊天 UI。
}
</script>
<template>
  <OfficePpt ref="editor" ai-enabled @ai-request="openExistingHostPanel" />
</template>
```

`await editor.value!.getAiBridge()` 懒加载并缓存当前组件 runtime 的 Bridge。不需要也不允许另起 runtime、导出再重建整稿，或用 `setDeck` 实现局部修改。不配置 `aiEnabled` 时不展示入口，现有编辑菜单保留。

独立 `/ai` 提供 `createOfficePptAiBridge`、`OfficePptAiRuntime`、`OfficePptAiBridgeOptions`；仅供已持有真实显示 runtime 的高级宿主适配。一般组件集成只用 `getAiBridge()`。当前 npm 包仅提供 ESM `import` 入口，不提供 CommonJS `require`。`/ai-protocol` 不初始化 Vue 或 DOM，不含模型工具、Word WASM 或动态下载依赖。

## 工具与授权流程

1. `getState()` 仅返回文档身份、generation/revision、页数、只读状态和当前冻结目标，不 flush、克隆或哈希整篇。
2. `captureTarget()` 等待当前 IME/待输入提交，捕获逻辑范围，再结束旧编辑层，避免后续失焦覆盖 AI 提交。也可由可信宿主传入严格 `PptAiTargetSpec`；模型不能自行扩展授权。
3. `discover()` 获取轻量目录、单位和 sharedDefinitions（现有 layouts/masters/themes 的稳定身份）；`methods({operations:[...]})` 按需取得操作 Schema。运行目录的 `implemented-unverified` 与 Skill 中基于实际证据的验收状态分开，不把类型映射自动视为完成。
4. `read({targetRef,view,pageSize,maxChars,maxBytes})` 或 `search(...)` 读取需要的范围。`nextRead/nextSearch` 可直接续读；跨版本/范围/视图/预算游标拒绝，不拼接不同版本结果。`maxChars` 默认 65536，范围 2048–262144，是序列化 items 数组的 JSON 字符预算；可另外设 `maxBytes`（2048–1048576）同时限制该数组的 UTF-8 字节数，回执外壳另计。大字段自动无损拆分，见下文。
5. 可信宿主 `prepare` 独立给出 write/source/destination/resource 白名单，默认 60 秒，最多 5 分钟。不要把读取全文自动转成写入全文。
6. `validate/preview` 只运行隔离原生命令计算，不触发正式 change/history/下载/transport；`preview.changes` 是授权范围内的语义前后值，不是可写 Deck/XML。
7. `apply` 成功为一个原生撤销单元。任何一步失败不提交整个批次；提交前再次校验版本、权限、只读、能力、取消状态。回执不代表宿主已保存原文件。

```ts
const target = await bridge.captureTarget() // 或沿用 aiRequest.target
if ('code' in target) throw new Error(target.message)
if (target.kind !== 'text') throw new Error('本例只修改用户冻结的文字范围')
const prepared = await bridge.prepare({
  contextId: 'host-task-unique-1', protocolId: bridge.getState().protocolId,
  writeTargetRefs: [target.targetRef], operations: ['replaceTextRange'],
})
if ('code' in prepared) throw new Error(prepared.message)
const patch = { preparationId: prepared.preparationId, operations: [
  { operation: 'replaceTextRange', targetRef: target.targetRef, parameters: { text: '替换文字' } },
] }
const preview = await bridge.preview(patch)
if ('code' in preview) throw new Error(preview.message)
const receipt = await bridge.apply(patch)
if ('code' in receipt) throw new Error(receipt.message)
// 重送同一 patch 返回同一提交回执；不同参数必须重新 prepare。
```

同批创建后以 `resultRef:'new-object'` 命名，后续 `targetRef:'$result:new-object'` 引用真实创建结果；目前包括页、对象（含图片占位符）、单个批注/回复、动画及单个新系列。需要命名多个领域子项时分步创建；不要求命名时可以用原生批量新增系列。切换行列不返回新建引用，不因派生系列数量变化而失败。创建结果不隐含额外源/目的授权。

### 批次内冻结字符范围（2026-10-24 安全修复）

同批前序操作改变某个文本容器的内容/定位结构后，后续该容器的原字符目标或字符来源引用返回 `stale-target`、`operationIndex` 和 `committed:false`，整个批次不提交。当前没有自动偏移重定位；等长改字后也保守拒绝旧字符引用，不能以文字搜索/重复词匹配猜位置。正文、格内文字、备注、批注/回复、共享文字同样处理；表格结构改动也不能继续使用旧格内字符地址。纯格式更新及不同文本容器的操作保留。

例如 ABCDEF 只授权 BC，删除 B 后再按旧引用替换 C，结果必须是拒绝且 ABCDEF 不变；不是成功写入 ACXEF。需要原子结果 AXDEF 时，可在原 BC 授权内合并成一次 BC→X 的局部替换；分两次提交则必须重读/重新授权第二个目标，并接受分开的历史/原子边界。运行时还逐操作核对范围外文字和运行格式，不能只依赖 Skill。

本修复未改变公开 Schema，protocolId 仍可能相同；宿主应取最新包并核对 `artifacts/ai/host-matrix/latest.json` 中的 tarball/build/source 哈希，不能凭协议 ID 相同复用修复前旧构建。

## 细粒度目标与续读

- 目标按领域校验：单个文字、格、图表部件只能指定一个真实页/对象，不接受互相冲突的路径字段。读取的 `childTargets[].child` 返回真实格、段落字符范围、图表部件、备注、批注/回复、动画引用；owner 读取返回真实共享子对象引用。对象读取不会附带可扩大成整页的 targetRef。
- `paragraph` 使用真实 paragraphId，只修改该段落的排版、列表/段末属性或运行样式；`text-run` 再指定 runId，支持该运行的字段/链接/样式。读取同时给出段落、运行及原字符目标，搜索结果保留 named-node 身份。参数不接受原生索引或 scope，范围外节点、对象及正文属性不能随之改写。
- `table-range` 指定逻辑格矩形；不能切开现有合并格。合并/拆分的原生跨度从目标解析，不靠模型传行列 ID。字符格冻结标记只标记实际文字，多格标记只覆盖所选格。
- `table-cell` 的字符区间也适用于原生 `updateTableCellText/updateTableCellTextStyle`，由 Bridge 绑定范围，不授权整格段落/正文/填充。整格或矩形格的 `updateTableCellParagraphLayout` 可用 paragraphIndex 指定已有段落；每个目标格必须存在该段，不能部分成功。
- `chart-part` 区分 series/point/axis/legend/plot/title/dataLabels/gridlines/chartArea/dataTable/errorBars；单系列/单轴不能调用整图操作或改其他系列。组合系列类型/轴绑定的副轴、原生类型等派生结果按同一原生命令计算核对，不扩大到整图；point 当前只读。不支持的类型选项、矛盾轴范围、错误身份在提交前拒绝。
- `owner-object` 精确指向 master/layout 的占位符或背景子元素；原生修改同步原始 XML。整 owner 背景仅在显式 owner 授权下修改，受管图片关系与媒体一并保存。普通页授权不能修改共享 owner。
- 页/全文读取的 `inherited` 使用与原生渲染器相同的显示与去重策略，带 owner 身份；不可见的 master/layout 元素不会冒充可见正文。共享文字字符目标可用 updateMasterElement.text，备注、批注及回复字符目标可用对应正文更新命令，只替换该区间，不是整项覆盖。共享占位符依赖页逐项核对，范围外格式及兄弟节点保留。原生字段的部分修改、源 XML 与模型正文不一致时明确拒绝。
- 大记录返回 `fragment:{record,path,value,offset?,totalLength?}`。`record` 是本次续读流的记录编号，`path` 是语义结果路径（不是可写地址）；字符串按 UTF-16 offset 拼接，代理对不会拆开。非字符串按 record/path 重建。必须消费 nextRead 至 complete，不能将一个片段当成完整对象。游标重复读取返回相同页；缓存上限 256 游标/8 Mi 字符，超限明确拒绝，不静默截断。
- `moveElements/resizeElements/updateImageCrops` 的 items 使用 `{targetRef,...参数}`，而非 elementId。每项必须是该对象集合内的单对象引用，不得重复、跨范围或修改锁定对象。连接端点/动画重定向的 `sourceTargetRef`、全篇切换源页、插页 afterTargetRef 还须独立 sourceTargetRefs 授权。
- 索引旧批注在 Bridge 内冻结为 author/index 原生身份；同批删前项不会使后续引用指错对象。原生命令不能安全消歧的重复旧索引明确拒绝。回复授权不能改父批注或创建兄弟回复。

## 字符与单位

- 文字范围是原生段落拼接后的 UTF-16 半开区间 `[start,end)`，段落间一个 `\n`。光标 start=end；不允许拆 Unicode 代理对。对象 ID 与数组位置不同。
- 字号是 PPT 工具栏的 pt 数值，36 对应 OOXML `sz="3600"`，不是 Word CSS px。
- 段末 fontSize、列表 defaultFontSize 也使用 pt，由 Bridge 转为原生百分之一磅；列表缩进同样转换为 EMU。段末原生不支持的删除线/上下标/高亮/对齐明确禁用，不能因原始大类型存在这些字段而宣称已写入。
- 日期格式/时区/固定日期/清除操作先检查有效性及互斥条件；本组件的日期策略通过标准 rPr 扩展槽保存，原生字段类型、缓存及其他未知扩展保留。其他 Office 客户端可忽略该编辑器扩展；本组件重开会恢复策略，不承诺外部客户端按相同策略刷新。
- 页面位置/尺寸是未缩放的 96 逻辑单位/英寸；表格轨道/内边距由 Bridge 按 9525 EMU/逻辑单位转换一次。缩放和 DPR 不进入参数。
- 公开透明度、裁剪、fontScale 是 0..1；段落 line 是倍数，before/after 是 pt；角度为度，动画延时/时长为毫秒。细项以 `discover().units` 和操作 Schema 为准。
- 读取投影已统一透明度、裁剪、表格轨道/边距、段落缩进/间距及数字动画时长；spacing 的 `*Unit=percent` 表示投影后的倍数，points 表示 pt。其他元数据不等同于命令参数，不能把整个 style 原样回填；完整样式继承/字段单位矩阵仍须逐项验收。
- 单元格范围使用 `table.replaceText/table.formatText`，不会整格重写；替换内容继承原生插入点样式，恰好在 run 边界时遵循现有原生命令的左侧样式。需要新样式时显式格式命令。
- style/full 的形状 `adjustmentDefinitions` 给出真实预设控制点；updateElementStyle.presetAdjustments 接受 `{name,value}[]`，空数组重置，其余 guide 保留，未知/越界/重复名称拒绝。主题色引用六种 transforms 为 0..1，读写均只转换一次；applyThemePreset.colors 使用严格的 12 个色槽字典。
- 表格 style/full 给出 `tableStyleCatalog`，updateTableStyle.styleId 由同一个原生解析器解析实际定义；不允许模型提交任意 styleDefinition。插行/列索引指现有轨道之后，省略则追加；内部边界调整保持原轨道对总长度并按 leading/trailing 比例分配；均分至少两个轨道。非法结构、最后轨道删除及矛盾边框参数在提交前拒绝。
- 图表逐系列数据操作必须有真实 seriesIndex，单系列目标自动注入；混用新增/删除/数据更新、无效系列、错误类型 X/气泡参数会整批拒绝。空值 null 在原图表缓存及嵌入工作簿中保留，未绑定工作表/关系/未知部件不随之删除。已有原生轴/数据标签格式经图表再生成仍保留。

## 生命周期与资源

`clearTarget()` 仅清除 UI 标记，不重定向或取消已准备任务；`cancel(preparationId)` 取消未提交事务。prepare 前可约定唯一 `contextId`，并以 `cancel(contextId)` 取消仍等待输入/解析资源的任务。`resolveResource(ref,{signal,contextId})` 应响应 AbortSignal；即使迟到返回，已取消任务也不能提交。关闭组件时 dispose；导入/替换文稿增加 generation，哪怕 revision 归零也拒绝旧目标。

资源只经可信 `aiOptions.resolveResource` 解析；模型参数只有 resourceRef，不接收本机路径、Base64、blob URL、XML、任意脚本。宿主提供真实类型/名称和持久受管 data URI（或明确允许的 HTTP(S) 外链），Bridge 对当前任务建立内存快照；总保留字符串预算 128 MiB，提交/取消/到期/版本变化/dispose 释放。resolver 不响应取消也不会使 Bridge 等待无限悬挂。此层不创建/删除宿主资源；租约、临时资产回收及共享引用归宿主资源管理器负责。外链读取和文件服务仍需宿主自身授权。

`service({action:'export-pptx'})` 返回当前冻结版本的内存 Blob，不自动下载，导出前后核对 generation/revision。open/save/save-as/export-pdf 没有 hostService 时返回 host-required；宿主处理文件身份、另存副本、草稿与脏状态。协同网关/transport 组合明确拒绝，不能旁路原命令网关。

组件内置 `inspect({targetRef})` 只读原生渲染：一次一页或整对象集合，返回有版本、目标和 slide-logical-units 坐标系的 PNG。对象检查隐藏范围外对象和继承背景；字符/审阅范围明确拒绝而不扩大截图。`service({action:'export-image',targetRef})` 返回本地 PNG Blob，不产生下载、选页或播放副作用。截图异步期间文档变化拒绝旧结果。直接使用 createOfficePptAiBridge 的调用方仍需提供 inspect 适配器，否则返回明确 limitation。超大图像/序列化数据受内存和超时限制。

备注 textarea 也参加 runtime 编辑就绪/快照屏障，保留真实选区，等待中文合成末次 input 后提交并结束旧会话，避免旧失焦事件覆盖 AI 改动。冻结多页会标记真实缩略图和当前画布；段落/run 使用对应文字高亮。

新增音视频使用 prepare 的 resourceRef；原生媒体工厂分别保存海报图片和音视频数据，MIME 必须与资源一致。动画的实际可播放能力随读取返回，提交 warnings 标出仅保留的未知效果。排序可改变其他效果的派生 sequenceIndex，不能改变它们的内容；越界索引、矛盾开始方式和不匹配的切换变体在提交前拒绝。

`hostService(action,context)` 的第二参数公开为 `/ai` 的 OfficePptAiFileContext（旧一参数钩子兼容）：`version` 是冻结编辑器版本，`exportPptx()` 导出前后核对 generation/revision，`isCurrent()` 供异步存储完成后核对。业务文件 ID 由宿主另行绑定；只在成功保存对应原稿且版本仍当前时清脏，另存副本或失败不清除原稿脏状态。不暴露 Deck/XML 给文件工具。内存固定模拟覆盖打开/保存/另存为/失败/重新导入，但不替代真实宿主文件层联调。

## 验证与发布

续补参数检查包括全部 148 编辑操作的未知字段/顶层参数错误值反例，以及真实导入图片效果、混合/嵌套对象复制、合并表格结构往返；反例覆盖不等于全部参数正向分支通过。裁剪合并当前边距后必须保留正可见区域；批量项复用同一检查。关闭阴影不混入忽略属性，黑白阈值不用于其他重着色。URI 示例正文不当成资源或链接，实际链接/受管资源策略不变。

中文字体固定测试先准备 OFL 资产：从官方 notofonts/noto-cjk 的 Sans2.004 标签取得 SimplifiedChinese Regular/Bold OTF 及 Sans/LICENSE，在隔离 Python 环境安装 fonttools/brotli，运行 `scripts/prepare-ai-cjk-fonts.py`。脚本验证源 SHA-256、fsType 和样本 cmap，保留许可、改名并输出 artifacts/ai/cjk-fonts；不打包或分发 Windows 字体。浏览器比较实际字形像素/宽度、横竖排/粗体/合成斜体和字体字节导出，同 ID 换稿必须重载。FontFaceSet.check 不是系统字体存在性证明。常见别名使用 OFL 测试脸不代表微软字形兼容；任意字体、其他宿主版本、多编辑器同名字体隔离仍未验收。宿主脚本新增实际嵌入字形基准，最终结果以 Skill evidence 和实施记录为准。

运行 `node scripts/generate-ai-native-schemas.mjs --check`、构建、专项 Vitest（JSON 结果写 artifacts/ai/regression.json）、`node scripts/record-ai-parameter-evidence.mjs`、`node scripts/generate-ai-artifacts.mjs`、`node scripts/generate-ai-artifacts.mjs --check`、`node scripts/verify-ai-consumer.mjs` 与 `playwright.ai.config.ts`。证据记录器要求成功完整报告和匹配的协议用例；验收门禁逐参数/枚举/递归分支核对真实用例和测试源 SHA-256。新增参数/枚举/嵌套分支、约束变化、旧协议/旧测试、空或失败证据均有故障注入反例。当前 27 个操作具备完整分支证据，其余 114 个原生映射及产品动作仍阻断完整发布，不得以代表性测试通过代替剩余验收。

完整复制 dist 和独立 Skill；不只复制 ai.js。`scripts/verify-ai-host-matrix.mjs` 已验证隔离安装后的 Vite 5.4.21、Chromium HTTP 子路径/离线 CSP、Electron 33.4.11 的 file/custom-protocol、真实 Worker/PPTX/PDF 首次懒加载。普通 Chrome file:// 因 CORS 不支持；Electron 验证未关闭 sandbox/contextIsolation。PDF 菜单须由 featureCodes:['exportPDF'] 启用；本矩阵 PDF 为离线可搜索栅格模式，离线字体就绪不代表全中文字体兼容。其他宿主版本、字体及实际 WPS/PowerPoint 仍需各自验证。未发布 npm、未改宿主、未启动协同服务。
