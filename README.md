# 哼唱编曲台 · Y世界

哼一句，就有一首歌：上传或现场录下哼唱 → 自动识别成音符 → 一键配和弦、贝斯、鼓 → 23 种音色随意换 → 导出小红书竖版视频 / WAV / MIDI。

**在线使用：** https://youcyhuang.github.io/hum-studio/ （可以「装到主屏幕」，像 App 一样从桌面图标打开，没网也能用）

## 免费版 / 完整版

| | 免费版 | 完整版（一次购买，终身使用） |
|---|---|---|
| 音色 | 钢琴、八音盒、木吉他、风铃、长笛、小鸟 | 全部 23 种 |
| 编曲风格 | 抒情钢琴、不要伴奏 | 全部 7 种 |
| 音轨 | 5 个音轨任你选；主旋律、铺底、分解和弦、贝斯、原声 | 解锁进阶，最高可添加 15 个；另有和声、扫弦、鼓、导入音频 / 视频 |
| 原声的声音效果 | 原声、录音棚、回声 | 另有自动修音、合唱、老式电话、机器人、花栗鼠、低沉大叔 |
| 导出 | 视频（角落带「哼唱编曲台」标识）、WAV | 视频无标识、WAV、MIDI |

- 解锁密钥：`keys.js` 里只存 `SHA-256("hum:密钥")`，明文密钥和发货话术在桌面 `小红书\哼唱编曲台_密钥\`，**不要提交到仓库**。
- 增加密钥：生成新的 `HM-XXXXXX`，把摘要追加进 `keys.js` 的数组即可。
- 解锁记在这台设备的浏览器里；换手机或清了浏览器数据，重新输入同一个密钥。

## 录音来源

- 首页大红按钮：按一下开始录音，再按一下停止
- 选择录音文件；电脑上可以直接拖进页面
- 可以一次选多段录音或视频（视频只取声音），按顺序拼成一首；勾「接在上一段后面」可以分几次录、再拼起来，每段都能单独删
- 从 App 导入：iPhone 语音备忘录先「存储到“文件”」再选；安卓装到主屏幕后，可以在录音机 App 里直接「分享」到哼唱编曲（manifest 的 `share_target` + service worker 接收）

## 文件说明

- `index.html`：整个工具（纯 HTML + JavaScript，无依赖，所有处理都在本机完成）
- `keys.js`：密钥摘要
- `manifest.json`、`service-worker.js`：装到主屏幕 + 离线可用（改了 `index.html` 发布新版时，把 `service-worker.js` 里的 `CACHE` 版本号加 1）
- `fonts/`：Rubik Mono One、VT323、Jost（只含英文字符，自托管，国内也能加载）
- `icon.svg`：图标源文件（小Y闭眼唱歌）；`icon-*.png`、`apple-touch-icon.png`、`favicon-32.png` 由它导出

## 代码结构（都在 `<script>` 里，按注释分段）

- `detectPitch`：YIN 音高识别；`segment`：切成音符（跟着人走的音准参考线 + 按换气 / 音高跳变切段 + 每段取中位数）；`estimateBpm` / `detectKey`：速度与调性
- `tools/recog-test.js`：识别测试，合成带滑音、颤音、越唱越跑的哼唱，量识别错误率（用法见文件开头）
- `arrange`：配和弦；`KINDS` / `PRESETS`：音轨类型与编曲风格；`trackEvents` / `drumEvents`：每条音轨生成音符
- `INST` / `DRUM`：音色合成（新增音色：加函数，并在 `INST_GROUPS` 里加名字、在 `PROG` 里加 MIDI 音色号）；吉他 / 竖琴 / 古筝用 `pluck`
- `renderSong`、导出 WAV / MIDI、`draw`（钢琴卷帘）、改音符（`selectNote` / `editNote`）
- 免费版 / 完整版：`FREE_*`、`needPro`；音轨面板：`renderTracks`
- 原声 / 导入音频的声音效果：`VOICE_FX`；变调不变速 `shiftBuf`（双读头交叉淡化），自动修音 `tuneRatio`
- 自动保存：`saveNow` / `restore`（IndexedDB）；视频：`drawVideoFrame` / `exportVideo`；装到主屏幕：`installBtn`
