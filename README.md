# 哼唱编曲台

上传或现场录下哼唱 → 自动识别成音符 → 自动配和弦、贝斯、鼓 → 换成钢琴、古筝、二胡、吉他等 22 种音色，可导出 WAV / MIDI。

多音轨：每条音轨单独选音色、节奏型、八度、音量，可静音（M）/ 独奏（S）/ 删除；可以自己添加主旋律（叠音色）、三度和声、和弦铺底、分解和弦、扫弦、贝斯、鼓，也能把原声哼唱或另一段音频（人声 / 伴奏）作为音轨混进去。

**在线使用：** 开通 GitHub Pages 后为 https://youcyhuang.github.io/hum-studio/ （需先把仓库设为 Public，再在 Settings → Pages 选 main 分支）

## 文件说明

整个工具只有一个文件：`index.html`（纯 HTML + JavaScript，无任何依赖，所有处理都在浏览器本地完成）。

## 怎么修改（给 AI / 自己看）

- 下载 `index.html`，交给任意 AI 助手说明想改什么，改完替换回来即可。
- 也可以在 GitHub 网页上点开 `index.html` → 右上角铅笔图标直接编辑 → Commit，约 1 分钟后网址自动更新。
- 本地测试：直接用 Chrome / Edge 打开 `index.html`。

代码结构（都在 `<script>` 里，按注释分段）：
- `detectPitch`：YIN 音高识别
- `segment`：把音高曲线切成音符（含跑调校正、同音反复切分）
- `estimateBpm` / `detectKey`：速度与调性估计
- `arrange`：配和弦
- `KINDS` / `PRESETS`：音轨类型与一键编曲风格；`trackEvents` / `drumEvents`：每条音轨生成音符
- `INST` / `DRUM`：各种音色的合成（新增音色就在这里加一个函数，并在 `INST_GROUPS` 里加名字、在 `PROG` 里加 MIDI 音色号）；吉他 / 竖琴 / 古筝用 `pluck`（Karplus-Strong 拨弦）
- `renderSong`、导出 WAV / MIDI（每条音轨一个 MIDI 轨）、`draw`（钢琴卷帘）、`renderTracks`（音轨面板）
