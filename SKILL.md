---
name: sanguo-map-video
description: 把三国 / 东汉历史口播文案做成 1920×1080 横屏地图讲解视频（复古浮雕地图、六边形势力版图会拼合和换色、Q 版棋子人物、城池 / 箭头 / 红印 / 史料卡，AI 配音和字幕逐字对齐，Remotion 渲染）。当用户给出三国题材的口播文案要做成视频，或者提到“三国地图视频 / 势力版图动画 / 地图讲历史 / 棋子人物讲三国”时使用。
---

# 三国地图口播视频

这个 Skill 本身是一个完整的视频工具包。你**只需要写一个数据文件 `content/video.ts`**，画面、配音、字幕、镜头、排版检查全部由工具包完成。
不要用生成图片的工具、系统配音、别的视频模板或自己写渲染脚本；不要改用户的文案（标点也不改）。

下面 `<SKILL>` 指这个 SKILL.md 所在的文件夹。

## 1. 准备工作文件夹（每次先做）

Skill 文件夹只当源码，配音、渲染、成片都放在**工作文件夹**里（默认 `~/三国地图动画工具包`，用户指定了就用用户的）。

- 工作文件夹不存在：`node <SKILL>/scripts/init.mjs [工作文件夹]`，然后进入工作文件夹安装：
  Windows `powershell -ExecutionPolicy Bypass -File scripts/install.ps1`，Mac / Linux `bash scripts/install.sh`（需要联网，约 5~15 分钟；Mac 装了便携版 Node 时，之后的命令前先 `export PATH="$PWD/.runtime/node/bin:$PATH"`）。
- 工作文件夹已存在：比较 `<SKILL>/版本.txt` 和工作文件夹的 `版本.txt`，Skill 更新时运行 `node <SKILL>/scripts/update.mjs <工作文件夹>`（保留环境、配音缓存和正在做的视频）。
- 不确定环境好没好：在工作文件夹运行 `npm run doctor`。

需要 Node.js 22.18+ 和 Python 3.9+，安装脚本会自动处理（不需要管理员权限）。

## 2. 做视频（在工作文件夹里，按顺序）

1. 把用户的文案**原样**写进 `口播文案.txt`。
2. 读 `docs/积木说明.md`（必读：格式、when 规则、字数上限），看 `content/examples/` 的两个示例；地名查 `docs/地名表.md`，人物查 `docs/人物表.md`。
3. 写 `content/video.ts`（整个替换；第一行 `import type {Video} from '../src/core/types.ts';`，最后 `export default video;`）。问用户频道名写进 `seal`。
4. `npm run check`：按提示改到出现“✓ 格式正确”“✓ 排版检查通过”。
5. `npm run preview`：读 `out/<标题>-画面报告.txt`，有 ⚠ 就改；能看图就看 `out/<标题>-检查图.png`。把检查图给用户看，**等用户确认**。
6. `npm run make`：成片 `out/<标题>.mp4` + 字幕 `.srt`。告诉用户路径、时长、做过的调整。

工作文件夹里的 `AGENTS.md` 有更完整的规则和检查清单。

## 3. 要点速记

- 一段 = 一个画面意思（1~3 句）。所有段的 script 连起来必须和原文一字不差。
- `when` = 说到这段口播里的哪个词时发生，必须从这一段 script 里原样摘。
- 地点写地名（`'官渡'`），表里没有就写 `[经度, 纬度]`；人物写名字，人物表里没有就在 `cast` 里补外观。
- 段落类型：`map`（主力）、`title`（片头）、`balance`（天平对比）、`list`（要点）。卡片类不超过一半。
- 势力颜色：曹 blue、刘 green、孙 red、袁 gold、董卓 / 吕布 dark、汉室 purple、士族 slate、诸侯 brown。
- 配音默认男声云希 +20%；女声 `voice: {name: 'zh-CN-XiaoxiaoNeural'}`；读错字用 `readAs`。
