// 从程序里的表生成 docs/地名表.md 和 docs/人物表.md（改了 src/core/places.ts 或 cast.ts 后运行：node scripts/docs.mjs）
import fs from 'node:fs';
import path from 'node:path';
import {ROOT} from './lib.mjs';
import {ALIASES, PLACE_GROUPS, REGION_CENTERS} from '../src/core/places.ts';
import {PRESET_GROUPS} from '../src/core/cast.ts';

const placeLines = [
  '# 地名表',
  '',
  '内容文件里的 `at`、`from`、`to`、`around.at`、`recolor.from`、`camera.center` 可以直接写这里的地名。',
  '表里没有的地方，直接写 `[经度, 纬度]`（今天的位置，例如 `[113.6, 34.7]`）。地图范围：经度 95~133，纬度 17~45.5。',
  '',
  '> 这个文件由 `node scripts/docs.mjs` 从 src/core/places.ts 生成，不要手改。',
  '',
  '## 十三州（写州名 = 这个州的中心）',
  '',
  Object.entries(REGION_CENTERS)
    .map(([n, [lon, lat]]) => `${n} [${lon}, ${lat}]`)
    .join(' · '),
  '',
];
for (const [group, places] of Object.entries(PLACE_GROUPS)) {
  placeLines.push(`## ${group}`, '', Object.entries(places).map(([n, [lon, lat]]) => `${n} [${lon}, ${lat}]`).join(' · '), '');
}
placeLines.push('## 别名（写左边的名字 = 右边的地点）', '', Object.entries(ALIASES).map(([a, b]) => `${a}→${b}`).join(' · '), '');
fs.writeFileSync(path.join(ROOT, 'docs', '地名表.md'), placeLines.join('\n'), 'utf8');

const castLines = [
  '# 人物表（预置）',
  '',
  '这些人物直接写名字就能用（`who: \'曹操\'`）。表里没有的人，在 video.ts 的 `cast` 里加一行外观（见 docs/积木说明.md 的“人物外观”）。',
  '在 `cast` 里写同名人物可以覆盖预置的外观。',
  '',
  '> 这个文件由 `node scripts/docs.mjs` 从 src/core/cast.ts 生成，不要手改。',
  '',
];
const zh = {guan: '冠', crown: '冕旒', bun: '发髻', helmet: '头盔', hairpin: '女子发髻', none: '无', mustache: '八字胡', beard: '山羊胡', longbeard: '长须', scroll: '竹简', sword: '剑', fan: '羽扇', brush: '毛笔', spear: '长枪', red: '红脸', dark: '黑脸'};
for (const [group, people] of Object.entries(PRESET_GROUPS)) {
  castLines.push(`## ${group}`, '', '| 名字 | 帽子 | 胡子 | 手持 | 其他 |', '| --- | --- | --- | --- | --- |');
  for (const [n, p] of Object.entries(people)) castLines.push(`| ${n} | ${zh[p.hat] ?? p.hat} | ${zh[p.face] ?? p.face} | ${zh[p.prop] ?? p.prop} | ${p.skin ? zh[p.skin] : ''} |`);
  castLines.push('');
}
fs.writeFileSync(path.join(ROOT, 'docs', '人物表.md'), castLines.join('\n'), 'utf8');
console.log('已生成 docs/地名表.md、docs/人物表.md');
