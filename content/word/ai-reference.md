---
{"title":"AI 协议与能力边界","description":"目标、授权、局部修改、资源和验证边界的详细说明。","order":49,"reference":true}
---

组件不调用模型，不创建聊天面板。宿主通过事件接收选中内容，通过公开 Bridge 读取和编辑当前实例。

```vue
<OfficeWord ref="word" :font-urls="fontUrls" mode="edit"
  :show-file-header="false" @ai-target="attachToHostAi" />
```

```ts
import { createOfficeWordAiBridge } from '@norio-office/office-word/ai'
const bridge = createOfficeWordAiBridge(word.value.getAiAdapter())
```

`ai-target` 包含 `targetId`、文档代次/版本、story、目标类型、文字和标记位置。按钮位于二级工具栏末尾。非空选区显示蓝色高亮和左侧蓝线；光标显示固定蓝线。失焦、滚动、切换菜单不改变冻结目标；内容区点击、关闭标记或 `bridge.clearAiTarget()` 取消标记。内容或权限变更会使旧授权失效。

`showAiButton=false` 隐藏按钮；`showFileHeader=false` 隐藏组件标题且保留菜单。`fontUrls` 仍由宿主配置。标记属于交互层，不写入文件或页面图导出。

Vite 5.4.21 消费者需显式设置 `build.target: 'esnext'` 并接入 `/vite` 的 `officeWordAssets()`，因为字体引擎包含顶层 await。已验证该配置下的构建及开发服务器 Worker/WASM 资源响应；这不代表旧浏览器兼容性或 Electron 实机验收已经完成。不需要忽略 peer 检查，也不需要安装另一个编辑器 runtime。

## 公共入口

- `/ai`：`createOfficeWordAiBridge()`、类型和结构化错误。
- `/ai-protocol`：协议 ID、按操作裁剪的严格 Schema、运行时校验及预算。
- `/docx`：不加载 Vue 的 DOCX 读写；Node 自动准备 XML DOM，不初始化布局 Worker。

使用 `captureState()` 取得输入提交后的轻量状态；`captureTarget()` 捕获当前目标；`read()` 和 `search()` 按需取得目标。文字、光标、逻辑单元格与视觉对象有不同作用范围，不使用页号或坐标作为编辑地址。

用 `discover({kind:'stories'})` 发现正文、页眉页脚、脚注尾注和具备模型标识的文本框文字故事，返回可直接用于 `read({story})` 的描述及节引用关系。文本框故事的 `container` 标明它属于正文还是页眉等其他故事；没有模型标识的对象仍可从父故事的结构化内容读取，不伪造编辑标识。`discover({kind:'sections'|'styles'|'numbering'|'comments'|'revisions'|'controls'|'forms'|'bookmarks'|'fields',view:'full'})` 读取对应的页面/分节、样式与编号定义；没有显式节的文档也返回默认节设置。目录和内容读取分别支持版本绑定的游标及预算。

`read({targetIds:[整篇目标],view:'full'})` 按原生块展开整个正文，保留每段、表格各层及末尾单元格的格式，可通过 cursor 分页读取。`complete` 只表示本次指定范围与投影已读完，不能解释为所有故事、样式和编号都已读取；默认 story 仍是正文，返回的 `readWindow.scope/story` 明确这一边界。继续使用同一组参数与 cursor 直到 complete，再逐个读取目录发现的其他故事。

文字局部选区的 `target.text` 与 full 格式切片使用同一范围，包括文本框/形状内部文字及多段页眉页脚。内部只读转换保留原生写入地址；旧数据的文字流无法与段落结构安全对齐时返回 `selection-projection-mismatch`，宿主应重新读取或提示用户，不能将其解释为空选区成功。

局部选区的外层 `attrs` 表示按文档顺序的首个所选段落属性；多段选区的各段属性以 `content` 为准，不能将外层属性当作全选区统一样式。该规则也适用于反向选区及页眉页脚整体偏移。

故事及整篇目标分页读取返回轻量、版本绑定的 `targetId`，不占用 2000 个显式捕获/搜索目标名额，也不在注册表中复制全文。读出的引用可继续用于局部读取、显式捕获以及宿主授权的 prepare；不会因翻页被淘汰。文档、权限变化或 dispose 时引用失效，宿主必须重新读取；不同实例不能交换引用。2000 上限仍约束显式捕获/搜索，单次读取的条数与字符预算仍生效。

先 `getCapabilities()`，再 `createEditContext()` 分别指定 sourceTargetIds、writeTargetIds、destinationTargetIds、allowedOperations。模型只返回符合当前方法 Schema 的 operations。`applyPatch()` 使用当前实例的原生命令和单个撤销项。`previewPatch()` 返回隔离候选文档，不能用 setDocument 将其提交。

宿主与按钮共用实例注册表；重复构造相同 adapter 会取得同一 Bridge。`subscribe()` 返回取消订阅函数。宿主取消任务调用 cancelContext；组件销毁统一 dispose。不要为同一文档再造 runtime，也不要向模型暴露 adapter.execute。

## 范围与交付

当前共 119 项受控操作，均有独立原生执行证据；原有 51 项待验收已关闭。功能缺口及范围见同目录《AI功能缺口实施清单》《AI已有接口待验收清单》，严格参数以 getCapabilities 的 schema 为准。能力清单是现有原生可编辑范围，不包含仅保留对象的编辑、宿主实现和真实模型。

正文多步骤文字/结构补丁使用隔离预演和单次原生 batch 提交。新内容步骤可声明 resultRef:'inserted'，后续以 targetRef:'$inserted' 使用；提交回执 createdRefs 的 name 与正式 id 对应。旧局部文字被修改后不猜测重定位；共享文档设置、依赖布局的字段及非正文故事单独提交。块复制/移动需分别授权来源读/写及插入目的地，不能用纯读取权限移动内容。

制表位用 alignment，position 为 twip；表/单元格边距各侧为 {w:300,type:'dxa'}；边框 sz 为八分之一磅。原生十万分比字段与 CSS px 字段不要混用。列表整体属性需要完整列表 owner 授权。

服务不进入正文 operations。通过 createOfficeWordAiBridge(adapter,{allowedServices:[...]}) 显式开放 locate/view/fieldCode/undo/redo/open/save/saveAs/export；默认只允许 statistics。调用 service 时提供 requestId 和 expectedModelVersion。文件动作只返回 host-required 契约，宿主自行执行公开文件服务并确认完成，组件不写宿主代码。

非正文写入以 getCapabilities.writes 为准。页眉页脚/注释精确文本使用原生源保留逻辑；页眉页脚还有命名故事属性/图片接口；正文形状/文本框文字可做原生字符、段落、样式和列表编辑。泛用复杂结构、非正文文本框以及未支持的对象写入会明确拒绝，不以整篇替换兜底。字段代码服务只支持当前原生块字段。

Skill 在 packages/skills/norio-office-word，含运行清单、Schema、证据、原生命令审阅和 feature-boundaries.json。skill:sync 同步；构建后 skill:verify 验证公开协议、相关 AI 用例和 Skill。skill:verify:release 另检查未关闭项，不能把可调用数量当作全场景浏览器验收。publish:prepare 在门禁通过后更新 npm 目录，实际发布仍需显式 publish:npm。

图片必须在 prepare 授予 resourceRefs，可信 resolveResource 返回匹配身份的字节及 MIME。组件验证格式和预算，通过原 DOCX 媒体链路保存；不接受模型任意 URL 或将 Blob URL 作为长期数据。
