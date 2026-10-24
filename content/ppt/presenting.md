---
{"title":"放映、动画与音视频","description":"放映、动画与音视频的接口、使用示例与行为说明。","order":43,"reference":true}
---

本页按主题整理项目公开说明，供完成快速接入后查阅。代码片段中的业务回调、服务地址和存储实现需要由宿主提供。

## 对象剪贴板、观众窗口与音视频

- 对象多选后支持 Ctrl+C/X/V/D；整批粘贴、整批撤销。对象包携带被引用的图片、图表部件及工作簿，并重建对象、组合、连接端点和资源关系身份。
- 支持同源标签页之间的系统剪贴板对象粘贴（需要浏览器授权/安全上下文）；系统剪贴板不可用时降级到同一应用实例的内存剪贴板并提示。单次对象包上限 32 MiB。
- 演讲者视图的“观众窗口”打开独立浏览器窗口，同步翻页、动画、画笔和激光笔，讲者侧保留备注及缩略图；需要允许弹窗。退出放映时清理窗口与监听器。
- “插入音视频”接受本地文件（最大 64 MiB）或 HTTP(S) 媒体文件地址，支持 MP4/WebM、MP3/WAV/OGG/M4A 容器。在放映中提供浏览器播放控件，普通编辑和静态导出仅呈现封面，不自动播放。
- 本地媒体字节及原生媒体关系随 PPTX 打包；地址媒体保持外部链接，不会偷偷下载为内嵌文件。解码支持取决于浏览器的容器/编码支持，网络地址需可访问；自动播放可能被浏览器拦截并给出提示。
- 通过网址插入的音视频在导出、重开及再次导出后保留外链与播放参数；媒体格式从 URL 路径识别，不依赖包内仅用于内嵌文件的 MIME 声明。查询参数与片段保留，媒体地址不作为包内文件路径。
- 选中音视频对象后，属性面板提供开始方式（单击/自动）、循环和音量，走统一命令、撤销/重做及协作提交。导入媒体只改音量或循环时保留原生时序、裁剪及其他未支持的选项。
- 放映中的双窗口共用临时播放会话，同步播放/暂停、进度、音量、静音及倍速；观众窗口实际播放后讲者侧静音，关闭后声音交回讲者侧。浏览器阻止观众窗口播放时不会提前静音讲者。临时播放操作不修改文稿、不触发自动保存或协作提交；换页/退出会停止旧播放器，返回页面重新按保存的设置开始。

验证边界：已验证 Chromium 的本地 WAV 播放、双窗口媒体控制/声音交接、属性命令及协作安全撤销、资源关系图和媒体设置导出重开；WPS/PowerPoint 真机验证按本轮要求留待下次。裁剪、跨页播放、旁白等原生媒体信息会保留，但浏览器尚未实现其完整语义。复杂母版/主题、嵌入字体和表格样式跨文稿复制仍需专项保真验收。


## 宿主页面事件冲突处理

如果宿主应用在 `document` 上注册了快捷键、自动保存或埋点监听，应先过滤编辑器内部的输入事件，避免 Delete、Backspace、Ctrl+A、粘贴等操作同时触发宿主逻辑。

```ts
import {
  isOfficePptEditableEvent,
  isOfficePptTextEditorActive,
  isOfficePptTextEditorEvent,
} from '@norio-office/office-ppt'

document.addEventListener('beforeinput', (event) => {
  if (isOfficePptTextEditorEvent(event)) return
  runHostInstrumentation(event)
}, true)

document.addEventListener('selectionchange', () => {
  if (isOfficePptTextEditorActive()) return
  updateHostSelectionState()
})

document.addEventListener('keydown', (event) => {
  if (isOfficePptEditableEvent(event)) return
  runHostShortcut(event)
})
```
