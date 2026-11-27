# 第三方素材与许可 / Third-party notices

本仓库的代码、文档和代码绘制的图形（人物、城池、六边形版图、卡片等）采用 MIT 许可（见 LICENSE）。以下内容各自保留原许可：

## 字体 Fonts（SIL Open Font License 1.1）

- `public/fonts/MaShanZheng-Regular.ttf` — 马善政楷书 Ma Shan Zheng，Copyright 2018 The Ma Shan Zheng Project Authors。许可全文：`licenses/OFL-MaShanZheng.txt`
- `public/fonts/NotoSerifSC.ttf` — 思源宋体 Noto Serif SC，Copyright 2012 Google Inc.。许可全文：`licenses/OFL-NotoSerifSC.txt`

## 地图数据 Map data

- 地形：底图 `public/map/tiles/`、明暗 `public/map/relief/` 由 [AWS Terrain Tiles](https://registry.opendata.aws/terrain-tiles/)（Mapzen / Tilezen）高程数据渲染而成。本区域的数据来源包括 SRTM（NASA / USGS）、GMTED2010（USGS）、ETOPO1（NOAA）。数据来源与署名要求见 [tilezen/joerd attribution](https://github.com/tilezen/joerd/blob/master/docs/attribution.md)。
- 河流、湖泊：[Natural Earth](https://www.naturalearthdata.com/)（公有领域 / public domain）。
- 东汉十三州的划分是按州治位置近似出来的示意，不是精确的历史疆界。

## 依赖 Dependencies（不随仓库分发，安装时下载）

- [Remotion](https://www.remotion.dev/)：渲染引擎。**Remotion 有自己的许可**：个人和 3 人以下的公司免费，更大的公司商用需要购买 [Remotion 公司许可](https://www.remotion.dev/license)。
- [edge-tts](https://github.com/rany2/edge-tts)：调用微软 Edge 的在线语音服务配音。本项目与微软无关；用于商业发布前请自行确认语音服务的使用条款，或换成真人配音。
- React、Node.js、Python 等其他依赖按各自许可。

## 免责

示例里的历史内容只用于演示格式，请自行核对史实。本项目与任何视频频道没有关联；右上角印章请写你自己的频道名。
