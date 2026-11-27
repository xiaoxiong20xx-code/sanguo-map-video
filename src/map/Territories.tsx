import React from 'react';
import {Easing, interpolateColors} from 'remotion';
import {FACTION} from '../theme';
import {clamp01, rand} from '../anim';
import {MAP, PX_PER_DEG, toMap, type LonLat} from './geo';

import type {PTerritory} from '../core/plan.ts';

/**
 * 势力版图 = 一组六边形格子（由 src/core/plan.ts 算好：regions 州名、circle 圆圈、appear 拼合帧、recolor 换色帧）。
 * 列表里后面的版图会盖住前面的（同一个格子只属于最后一个圈到它的版图）。
 */
export type Territory = PTerritory;

type Hex = [number, number, string, number, number];
const HEXES = MAP.hexes as Hex[];
const R = MAP.hexR;
const corner = (k: number, r = R) => {
  const a = ((-90 + 60 * k) * Math.PI) / 180;
  return [r * Math.cos(a), r * Math.sin(a)];
};
const HEX_PATH = 'M' + [0, 1, 2, 3, 4, 5].map((k) => corner(k, R + 2.2).map((v) => v.toFixed(1)).join(' ')).join('L') + 'Z';
const HEX_LINE = 'M' + [0, 1, 2, 3, 4, 5].map((k) => corner(k, R - 1).map((v) => v.toFixed(1)).join(' ')).join('L') + 'Z';
const SIDE = 7; // 格子侧面厚度（底图像素）

const selectOwn = (t: Territory): Hex[] => {
  let hs = HEXES;
  if (t.regions) hs = hs.filter((h) => t.regions!.includes(h[2]));
  if (t.circle) {
    const [cx, cy] = toMap(t.circle.c);
    const r = t.circle.r * PX_PER_DEG;
    hs = hs.filter((h) => Math.hypot(h[0] - cx, h[1] - cy) <= r);
  }
  return hs;
};

/** 去掉被后面的版图盖住的格子 */
const select = (t: Territory, all: Territory[]): Hex[] => {
  const k = all.indexOf(t);
  const taken = new Set<string>();
  for (const later of all.slice(k + 1)) selectOwn(later).forEach((h) => taken.add(`${h[3]}_${h[4]}`));
  return selectOwn(t).filter((h) => !taken.has(`${h[3]}_${h[4]}`));
};

/** 只出现一次的边 = 版图外轮廓（用边的中点当钥匙，避免相邻格子顶点坐标有小数误差） */
const outline = (hs: Hex[]) => {
  const edges = new Map<string, {n: number; d: string}>();
  for (const [x, y] of hs) {
    for (let k = 0; k < 6; k++) {
      const [ax, ay] = corner(k);
      const [bx, by] = corner((k + 1) % 6);
      const key = `${Math.round((x + (ax + bx) / 2) / 4)},${Math.round((y + (ay + by) / 2) / 4)}`;
      const e = edges.get(key);
      if (e) e.n++;
      else edges.set(key, {n: 1, d: `M${(x + ax).toFixed(1)} ${(y + ay).toFixed(1)}L${(x + bx).toFixed(1)} ${(y + by).toFixed(1)}`});
    }
  }
  return [...edges.values()]
    .filter((e) => e.n === 1)
    .map((e) => e.d)
    .join('');
};

const cache = new Map<string, {hs: Hex[]; edge: string; cx: number; cy: number; maxD: number; stray: Hex[]}>();
const prepare = (t: Territory, all: Territory[]) => {
  const key = JSON.stringify([t.regions, t.circle, t.scatter, all.indexOf(t), all.map((o) => [o.regions, o.circle])]);
  if (cache.has(key)) return cache.get(key)!;
  const hs = select(t, all);
  const cx = hs.reduce((a, h) => a + h[0], 0) / Math.max(1, hs.length);
  const cy = hs.reduce((a, h) => a + h[1], 0) / Math.max(1, hs.length);
  const maxD = Math.max(1, ...hs.map((h) => Math.hypot(h[0] - cx, h[1] - cy)));
  const inside = new Set(hs.map((h) => `${h[3]}_${h[4]}`));
  const near = HEXES.filter((h) => !inside.has(`${h[3]}_${h[4]}`) && hs.some((o) => Math.hypot(o[0] - h[0], o[1] - h[1]) < R * 3.6));
  const stray = near.filter((_, i) => rand(i * 7.3 + hs.length) < (t.scatter ?? 0) / Math.max(1, near.length));
  const v = {hs, edge: outline(hs), cx, cy, maxD, stray};
  cache.set(key, v);
  return v;
};

const SPREAD = 22; // 拼合时从中心扩散到最外圈用的帧数
const RECOLOR_SPREAD = 34; // 换色像潮水一样推过去用的帧数

export const Territories: React.FC<{list: Territory[]; frame: number}> = ({list, frame}) => (
  <svg width={MAP.width} height={MAP.height} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
    {list.map((t) => {
      const {hs, edge, cx, cy, maxD, stray} = prepare(t, list);
      const col = FACTION[t.color];
      const to = t.recolor ? FACTION[t.recolor.color] : null;
      const [fx, fy] = t.recolor?.from ? toMap(t.recolor.from) : [cx, cy];
      const fromMax = Math.max(1, ...hs.map((h) => Math.hypot(h[0] - fx, h[1] - fy)));
      const colorAt = (h: Hex, key: 'fill' | 'side' | 'line') => {
        if (!to || !t.recolor) return col[key];
        const d = Math.hypot(h[0] - fx, h[1] - fy) / fromMax;
        const p = clamp01((frame - t.recolor.at - d * RECOLOR_SPREAD - rand(h[3] * 31 + h[4]) * 1.5) / 6);
        return p <= 0 ? col[key] : p >= 1 ? to[key] : interpolateColors(p, [0, 1], [col[key], to[key]]);
      };
      const hexP = (h: Hex) => {
        if (t.appear === undefined) return 1;
        const d = Math.hypot(h[0] - cx, h[1] - cy) / maxD;
        const p = clamp01((frame - t.appear - d * SPREAD - rand(h[3] * 17 + h[4] * 3) * 6) / 12);
        return Easing.out(Easing.back(1.6))(p);
      };
      const done = t.appear === undefined ? 1 : clamp01((frame - t.appear - SPREAD - 14) / 8);
      const recolorDone = t.recolor ? clamp01((frame - t.recolor.at - RECOLOR_SPREAD - 4) / 6) : 0;
      const edgeColor = to && recolorDone > 0 ? interpolateColors(recolorDone, [0, 1], [col.side, to.side]) : col.side;
      const tile = (h: Hex, p: number, i: number, lift = 0) => {
        if (p <= 0) return null;
        const y = h[1] - (1 - p) * 70 - lift;
        return (
          <g key={i} transform={`translate(${h[0]} ${y}) scale(${0.45 + 0.55 * Math.min(1, p)})`} opacity={clamp01(p * 2.5)}>
            <path d={HEX_PATH} transform={`translate(0 ${SIDE})`} fill={colorAt(h, 'side')} />
            <path d={HEX_PATH} fill={colorAt(h, 'fill')} />
            <path d={HEX_LINE} fill="none" stroke={colorAt(h, 'line')} strokeWidth={1.3} opacity={0.75} vectorEffect="non-scaling-stroke" />
          </g>
        );
      };
      return (
        <g key={t.id}>
          {/* 先画所有侧面，再画顶面，避免侧面压住相邻格子 */}
          {hs.map((h, i) => {
            const p = hexP(h);
            if (p <= 0) return null;
            return (
              <path
                key={`s${i}`}
                d={HEX_PATH}
                transform={`translate(${h[0]} ${h[1] - (1 - p) * 70 + SIDE}) scale(${0.45 + 0.55 * Math.min(1, p)})`}
                fill={colorAt(h, 'side')}
                opacity={clamp01(p * 2.5)}
              />
            );
          })}
          {hs.map((h, i) => {
            const p = hexP(h);
            if (p <= 0) return null;
            return (
              <g key={`t${i}`} transform={`translate(${h[0]} ${h[1] - (1 - p) * 70}) scale(${0.45 + 0.55 * Math.min(1, p)})`} opacity={clamp01(p * 2.5)}>
                <path d={HEX_PATH} fill={colorAt(h, 'fill')} />
                <path d={HEX_LINE} fill="none" stroke={colorAt(h, 'line')} strokeWidth={1.2} opacity={0.7} vectorEffect="non-scaling-stroke" />
              </g>
            );
          })}
          {done > 0 && (
            <>
              <path d={edge} transform={`translate(0 ${SIDE})`} stroke="rgba(30,20,10,0.35)" strokeWidth={5} fill="none" opacity={done} vectorEffect="non-scaling-stroke" />
              <path d={edge} stroke={edgeColor} strokeWidth={3.2} strokeLinecap="round" fill="none" opacity={done} vectorEffect="non-scaling-stroke" />
            </>
          )}
          {stray.map((h, i) => {
            const start = (t.appear ?? -40) + 10 + i * 3;
            const p = Easing.out(Easing.cubic)(clamp01((frame - start) / 14));
            const bob = 10 + 6 * Math.sin((frame + i * 23) / 14);
            return tile(h, p, 1000 + i, bob);
          })}
        </g>
      );
    })}
  </svg>
);
