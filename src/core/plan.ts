/**
 * 把内容文件 + 配音时间 变成“每一帧该画什么”的计划（纯计算，画面和检查脚本共用）：
 * - when（说到哪个词）→ 第几帧
 * - 地名 → 经纬度
 * - 镜头自动对准这一段的人物和标记，避开标题条、字幕、人物卡、史料卡
 * - 人物挤在一起时自动左右错开
 * - 排版检查：有东西出画、被挡住、互相压住时给出中文提示
 */
import type {Banner, BannerStyle, Color, LonLat, MapItem, MapScene, Mood, Place, Scene, Territory, Video, When} from './types.ts';
import {cleanScript, PUNCT, textWidthEm} from './text.ts';
import {lookupPlace} from './places.ts';
import {fromMap, H, PX_PER_DEG, toMap, W, type Cam} from './geo.ts';

export const FPS = 30;
export const LEAD = 2; // 每段开头空 2 帧再出声

// ---------- 时间 ----------

/** 每个字（cleanScript 里的下标）开始出声的帧（相对本段开头），以及说完的帧 */
export type SceneTiming = {charFrames: number[]; speechEnd: number; dur: number};

const parseWhen = (when: string) => {
  const m = when.match(/^(.*?)#(\d+)$/);
  return m ? {word: m[1], nth: Number(m[2])} : {word: when, nth: 1};
};

/** when 在这段口播里的位置（找不到返回 -1） */
export const findWhen = (script: string, when: When): number => {
  const clean = cleanScript(script);
  const {word, nth} = parseWhen(String(when ?? '').trim());
  if (!word) return -1;
  let idx = -1;
  let from = 0;
  for (let k = 0; k < Math.max(1, nth); k++) {
    idx = clean.indexOf(word, from);
    if (idx < 0) return -1;
    from = idx + 1;
  }
  return idx;
};

/** 没有配音时按语速估算每个字的时间（约 5.3 字/秒，逗号停 0.25 秒，句号停 0.4 秒） */
export const estimateTiming = (script: string, rate = 5.3): Omit<SceneTiming, 'dur'> => {
  const clean = cleanScript(script);
  const frames: number[] = [];
  let t = 0.1;
  for (const ch of clean) {
    frames.push(LEAD + t * FPS);
    if (/[。！？!?；;…]/.test(ch)) t += 0.4;
    else if (/[，,、：:]/.test(ch)) t += 0.25;
    else if (!PUNCT.test(ch)) t += 1 / rate;
  }
  frames.push(LEAD + t * FPS);
  return {charFrames: frames, speechEnd: LEAD + t * FPS};
};

// ---------- 计划好的数据（画面直接用） ----------

export type PFigure = {
  kind: 'figure';
  who: string;
  ll: LonLat;
  t: number;
  mood: Mood;
  mark?: {kind: '?' | '!' | '…'; t: number};
  move?: {to: LonLat; t: number; dur: number; arrow: boolean};
  cross?: number;
  moodAfter?: {mood: Mood; t: number};
  /** 自动错开的屏幕横向偏移（像素）：dx 最终位置，dx0 走动前的位置 */
  dx: number;
  dx0: number;
};
export type PItem =
  | PFigure
  | {kind: 'city'; ll: LonLat; t: number; size: number; label?: string}
  | {kind: 'label'; ll: LonLat; t: number; text: string; swap?: {text: string; t: number}; dark: boolean}
  | {kind: 'stamp'; ll: LonLat; t: number; text: string; angle: number}
  | {kind: 'arrow'; from: LonLat; to: LonLat; t: number; dur: number}
  | {kind: 'battle'; ll: LonLat; t: number};

export type PTerritory = {
  id: string;
  regions?: string[];
  circle?: {c: LonLat; r: number};
  color: Color;
  appear?: number;
  recolor?: {at: number; color: Color; from?: LonLat};
  scatter: number;
};
export type PBanner = {text: string; style: BannerStyle; t: number};
export type PMap = {
  type: 'map';
  cam: {from: Cam; mid: Cam; end: Cam; travel: number};
  territories: PTerritory[];
  items: PItem[];
  banner?: PBanner;
  year?: {year: string; era?: string; t: number};
  person?: {who: string; zi?: string; line: string; source?: string; t: number};
  source?: {book: string; date?: string; quote: string; t: number};
};
export type PTitle = {type: 'title'; title: string; tag?: string; cast: string[]};
export type PBalance = {type: 'balance'; left: {who: string; label: string; t: number}; right: {who: string; label: string; t: number}; banner?: PBanner};
export type PList = {type: 'list'; title: string; style: BannerStyle; points: {text: string; who?: string; t: number}[]};
export type PScene = (PMap | PTitle | PBalance | PList) & {
  /** 最后一个动画演完是第几帧（排时长用） */
  needEnd: number;
  /** 这一段里有哪些画面变化、在第几帧（给检查报告用） */
  beats: {t: number; what: string}[];
  /** 排版问题（中文，能直接发给 AI） */
  issues: string[];
};

// ---------- 版图 ----------

/** 十三州的经纬度范围 [西, 南, 东, 北] */
export const REGION_BOX: Record<string, [number, number, number, number]> = {
  幽州: [114.3, 39.2, 125.3, 43.1],
  并州: [108.1, 35.4, 114.6, 42.2],
  凉州: [98.0, 34.1, 108.5, 40.8],
  冀州: [113.6, 35.6, 118.1, 39.4],
  青州: [116.3, 35.8, 122.5, 39.0],
  司隶: [106.7, 32.8, 113.9, 36.9],
  兖州: [114.0, 34.5, 117.8, 36.7],
  徐州: [116.7, 32.5, 121.2, 35.8],
  豫州: [112.5, 30.8, 116.6, 35.0],
  益州: [100.6, 23.5, 109.6, 33.9],
  荆州: [108.8, 24.9, 114.9, 33.2],
  扬州: [114.2, 23.7, 122.2, 33.0],
  交州: [104.1, 18.3, 115.2, 25.6],
};

const territoryBox = (t: PTerritory): [number, number, number, number] | null => {
  if (t.circle) {
    const {c, r} = t.circle;
    const k = Math.cos((c[1] * Math.PI) / 180);
    return [c[0] - r, c[1] - r * k, c[0] + r, c[1] + r * k];
  }
  const boxes = (t.regions ?? []).map((r) => REGION_BOX[r]).filter(Boolean);
  if (!boxes.length) return null;
  return [Math.min(...boxes.map((b) => b[0])), Math.min(...boxes.map((b) => b[1])), Math.max(...boxes.map((b) => b[2])), Math.max(...boxes.map((b) => b[3]))];
};

// ---------- 画面上的占位（屏幕像素，相对锚点） ----------

type Box = [number, number, number, number];
const FIG_W = 60;
const pillHalf = (name: string) => ((74 + textWidthEm(name) * 27) * 0.82) / 2;

const UI = {
  subtitle: [230, 905, 1690, 1015] as Box,
  year: [50, 60, 340, 182] as Box,
  person: [40, 290, 665, 535] as Box,
};
const bannerBox = (b: {text: string}): Box => {
  const w = textWidthEm(b.text) * 76 * 1.18 + 130;
  return [W / 2 - w / 2, 62, W / 2 + w / 2, 198];
};
const sealBox = (seal?: string): Box | null => (seal ? [1826, 30, 1896, 70 + [...seal].length * 50] : null);

const overlap = (a: Box, b: Box, pad = 0) => a[0] < b[2] - pad && b[0] < a[2] - pad && a[1] < b[3] - pad && b[1] < a[3] - pad;
const shift = (b: Box, x: number, y: number): Box => [b[0] + x, b[1] + y, b[2] + x, b[3] + y];

// ---------- 主函数 ----------

const MIN_SPAN = 5.5;
const MAX_SPAN = 34;
const DEFAULT_CAM: Cam = {c: [112.8, 33.6], span: 26};

const animLen = {pop: 12, mark: 12, cross: 14, arrow: 24, stamp: 10, battle: 12, banner: 24, year: 10, card: 16, source: 66, appear: 52, recolor: 46, swap: 12, point: 16};

export type PlanInput = {video: Video; timings: SceneTiming[]};

export const planVideo = ({video, timings}: PlanInput): PScene[] => {
  const out: PScene[] = [];
  let prevTerritories: PTerritory[] = [];
  let prevCam: Cam | null = null;
  let prevType: Scene['type'] | null = null;

  video.scenes.forEach((scene, si) => {
    const timing = timings[si];
    const dur = timing.dur;
    const beats: {t: number; what: string}[] = [];
    const issues: string[] = [];
    const where = `第 ${si + 1} 段（${scene.type}）`;
    let needEnd = timing.speechEnd;

    /** 说到某个词的帧（比字音早 3 帧，弹出动画刚好落在字上） */
    const tw = (when: When | undefined, fallback: number, what?: string, len = animLen.pop) => {
      let t = fallback;
      if (when !== undefined && when !== null && when !== '') {
        const idx = findWhen(scene.script, when);
        t = idx >= 0 ? Math.max(0, timing.charFrames[idx] - 3) : fallback;
      }
      if (what && t >= 0) beats.push({t, what});
      needEnd = Math.max(needEnd, t + len);
      return t;
    };
    const ll = (p: Place | undefined): LonLat => (p !== undefined && lookupPlace(p)) || DEFAULT_CAM.c;
    const banner = (b: Banner | undefined, fallback = 6): PBanner | undefined =>
      b ? {text: b.text, style: b.style ?? 'slate', t: tw(b.when, fallback, `标题条“${b.text}”`, animLen.banner)} : undefined;

    if (scene.type === 'title') {
      beats.push({t: 0, what: `片头标题“${scene.title}”`});
      out.push({type: 'title', title: scene.title, tag: scene.tag, cast: scene.cast ?? [], needEnd: Math.max(needEnd, 40), beats, issues});
      prevType = 'title';
      return;
    }
    if (scene.type === 'balance') {
      const left = {...scene.left, t: tw(scene.left.when, 8, `天平左边 ${scene.left.who}“${scene.left.label}”`)};
      const right = {...scene.right, t: tw(scene.right.when, 22, `天平右边 ${scene.right.who}“${scene.right.label}”`)};
      out.push({type: 'balance', left, right, banner: banner(scene.banner, 4), needEnd: Math.max(needEnd, 60), beats, issues});
      prevType = 'balance';
      return;
    }
    if (scene.type === 'list') {
      const points = scene.points.map((pt, k) => ({text: pt.text, who: pt.who, t: tw(pt.when, 20 + k * 20, `第 ${k + 1} 条“${pt.text}”`, animLen.point)}));
      out.push({type: 'list', title: scene.title, style: scene.style ?? 'wood', points, needEnd, beats, issues});
      prevType = 'list';
      return;
    }

    // ---------- 地图 ----------
    const ms = scene as MapScene;
    let territories: PTerritory[];
    if (ms.territories) {
      territories = ms.territories.map((t: Territory, k) => {
        const appear = t.appear !== undefined ? tw(t.appear, 0, `版图拼出（${t.color}）`, animLen.appear) : undefined;
        const recolor = t.recolor
          ? {at: tw(t.recolor.when, 0, `版图换成 ${t.recolor.color}`, animLen.recolor), color: t.recolor.color, from: t.recolor.from !== undefined ? ll(t.recolor.from) : undefined}
          : undefined;
        return {
          id: `s${si}t${k}`,
          regions: t.regions,
          circle: t.around ? {c: ll(t.around.at), r: t.around.radius} : undefined,
          color: t.color,
          appear,
          recolor,
          scatter: appear !== undefined ? 8 : 0,
        };
      });
    } else {
      territories = prevTerritories.map((t) => ({...t, appear: undefined, recolor: undefined, scatter: 0}));
    }
    prevTerritories = territories.map((t) => ({...t, color: t.recolor?.color ?? t.color}));

    const items: PItem[] = (ms.items ?? []).map((it: MapItem): PItem => {
      switch (it.type) {
        case 'figure': {
          const t = it.when !== undefined ? tw(it.when, 0, `人物 ${it.who} 出现`) : -30;
          const from = ll(it.at);
          let move: PFigure['move'];
          if (it.moveTo) {
            const to = ll(it.moveTo.at);
            const [ax, ay] = toMap(from);
            const [bx, by] = toMap(to);
            const distDeg = Math.hypot(bx - ax, by - ay) / PX_PER_DEG;
            const mdur = Math.round(Math.min(60, Math.max(28, 24 + distDeg * 10)));
            move = {to, t: tw(it.moveTo.when, 0, `${it.who} 走到 ${typeof it.moveTo.at === 'string' ? it.moveTo.at : '新位置'}`, mdur), dur: mdur, arrow: !!it.moveTo.arrow};
          }
          return {
            kind: 'figure',
            who: it.who,
            ll: from,
            t,
            mood: it.mood ?? 'happy',
            mark: it.mark ? {kind: it.mark.kind, t: tw(it.mark.when, 0, `${it.who} 头顶冒“${it.mark.kind}”`, animLen.mark)} : undefined,
            move,
            cross: it.cross !== undefined ? tw(it.cross, 0, `${it.who} 打红叉`, animLen.cross) : undefined,
            moodAfter: it.moodAfter ? {mood: it.moodAfter.mood, t: tw(it.moodAfter.when, 0, `${it.who} 表情变成 ${it.moodAfter.mood}`)} : undefined,
            dx: 0,
            dx0: 0,
          };
        }
        case 'city':
          return {kind: 'city', ll: ll(it.at), t: it.when !== undefined ? tw(it.when, 0, `城池${it.label ? `“${it.label}”` : ''}落下`) : -30, size: it.size === 'small' ? 110 : 150, label: it.label};
        case 'label':
          return {
            kind: 'label',
            ll: ll(it.at),
            t: it.when !== undefined ? tw(it.when, 0, `地名牌“${it.text}”`) : -30,
            text: it.text,
            swap: it.swap ? {text: it.swap.text, t: tw(it.swap.when, 0, `地名牌翻成“${it.swap.text}”`, animLen.swap)} : undefined,
            dark: !!it.dark,
          };
        case 'stamp':
          return {kind: 'stamp', ll: ll(it.at), t: tw(it.when, 0, `红印“${it.text}”`, animLen.stamp), text: it.text, angle: it.angle ?? -8};
        case 'arrow':
          return {kind: 'arrow', from: ll(it.from), to: ll(it.to), t: tw(it.when, 0, '红色虚线箭头', animLen.arrow), dur: 24};
        case 'battle':
          return {kind: 'battle', ll: ll(it.at), t: tw(it.when, 0, '交战双刀', animLen.battle)};
      }
    });

    const year = ms.year ? {...ms.year, t: tw(ms.year.when, 0, `年份牌“${ms.year.year}”`, animLen.year)} : undefined;
    const person = ms.person ? {...ms.person, t: tw(ms.person.when, 10, `人物卡“${ms.person.who}”`, animLen.card)} : undefined;
    const source = ms.source ? {...ms.source, t: tw(ms.source.when, 10, `史料卡${ms.source.book}`, animLen.source)} : undefined;
    if (source && /【[^】]+】/.test(source.quote)) beats.push({t: source.t + 30, what: '史料卡红线划重点'});
    const pb = banner(ms.banner);

    // ---------- 镜头 ----------
    const free: Box = [person ? 690 : 70, pb ? 215 : year ? 196 : 92, source ? 1195 : 1850, 892];
    type Anchor = {who: string; m: [number, number]; box: Box; fig?: PFigure; start?: boolean};
    const anchors: Anchor[] = [];
    const figBox = (f: PFigure): Box => {
      const half = Math.max(FIG_W, pillHalf(f.who));
      return [-half, f.mark ? -192 : -136, half, 40];
    };
    for (const it of items) {
      if (it.kind === 'figure') anchors.push({who: `人物“${it.who}”`, m: toMap(it.move ? it.move.to : it.ll), box: figBox(it), fig: it});
      if (it.kind === 'figure' && it.move) anchors.push({who: `人物“${it.who}”出发的位置`, m: toMap(it.ll), box: figBox(it), fig: it, start: true});
      if (it.kind === 'city') anchors.push({who: `城池${it.label ? `“${it.label}”` : ''}`, m: toMap(it.ll), box: [-it.size / 2, -it.size * 0.8 - (it.label ? 62 : 0), it.size / 2, it.size * 0.05]});
      if (it.kind === 'label') {
        const w = Math.max(textWidthEm(it.text), it.swap ? textWidthEm(it.swap.text) : 0) * 34 + 34;
        anchors.push({who: `地名牌“${it.text}”`, m: toMap(it.ll), box: [-w / 2, -27, w / 2, 27]});
      }
      if (it.kind === 'stamp') anchors.push({who: `红印“${it.text}”`, m: toMap(it.ll), box: [-52, -58, 52, 58]});
      if (it.kind === 'battle') anchors.push({who: '交战双刀', m: toMap(it.ll), box: [-50, -50, 50, 50]});
      if (it.kind === 'arrow') {
        anchors.push({who: '箭头起点', m: toMap(it.from), box: [-18, -18, 18, 18]});
        anchors.push({who: '箭头终点', m: toMap(it.to), box: [-24, -24, 24, 24]});
      }
    }
    // 这一段里拼出 / 换色的版图也要拍进来（大块版图只拍中间 3/4）
    for (const t of territories) {
      if (t.appear === undefined && !t.recolor) continue;
      const b = territoryBox(t);
      if (!b) continue;
      const k = t.circle ? 0 : 0.2;
      const bw = (b[2] - b[0]) * k;
      const bh = (b[3] - b[1]) * k;
      anchors.push({who: '版图', m: toMap([b[0] + bw, b[3] - bh]), box: [0, 0, 0, 0]});
      anchors.push({who: '版图', m: toMap([b[2] - bw, b[1] + bh]), box: [0, 0, 0, 0]});
    }
    const dxOf = (a: Anchor) => (a.fig ? (a.start ? a.fig.dx0 : a.fig.dx) : 0);

    const freeW = free[2] - free[0];
    const freeH = free[3] - free[1];
    const extentOf = (span: number, list: Anchor[]) => {
      const s = W / (span * PX_PER_DEG);
      const xs = list.map((a) => [a.m[0] * s + a.box[0] + dxOf(a), a.m[0] * s + a.box[2] + dxOf(a)]);
      const ys = list.map((a) => [a.m[1] * s + a.box[1], a.m[1] * s + a.box[3]]);
      return {s, x0: Math.min(...xs.map((v) => v[0])), x1: Math.max(...xs.map((v) => v[1])), y0: Math.min(...ys.map((v) => v[0])), y1: Math.max(...ys.map((v) => v[1]))};
    };
    const extent = (span: number) => {
      const s = W / (span * PX_PER_DEG);
      const xs = anchors.map((a) => [a.m[0] * s + a.box[0] + dxOf(a), a.m[0] * s + a.box[2] + dxOf(a)]);
      const ys = anchors.map((a) => [a.m[1] * s + a.box[1], a.m[1] * s + a.box[3]]);
      return {s, x0: Math.min(...xs.map((v) => v[0])), x1: Math.max(...xs.map((v) => v[1])), y0: Math.min(...ys.map((v) => v[0])), y1: Math.max(...ys.map((v) => v[1]))};
    };
    const fixedCenter = ms.camera?.center !== undefined ? toMap(ll(ms.camera.center)) : null;
    const fitsAt = (span: number) => {
      const e = extent(span);
      if (!fixedCenter) return e.x1 - e.x0 <= freeW && e.y1 - e.y0 <= freeH;
      const cx = fixedCenter[0] * e.s - W / 2;
      const cy = fixedCenter[1] * e.s - H / 2;
      return e.x0 - cx >= free[0] && e.x1 - cx <= free[2] && e.y0 - cy >= free[1] && e.y1 - cy <= free[3];
    };
    const fitSpan = () => {
      if (!anchors.length) return DEFAULT_CAM.span;
      if (fitsAt(MIN_SPAN)) return MIN_SPAN;
      if (!fitsAt(MAX_SPAN)) return MAX_SPAN;
      let lo = MIN_SPAN;
      let hi = MAX_SPAN;
      for (let k = 0; k < 30; k++) {
        const mid = Math.sqrt(lo * hi);
        if (fitsAt(mid)) hi = mid;
        else lo = mid;
      }
      return Math.min(MAX_SPAN, Math.max(MIN_SPAN, hi * 1.06));
    };
    const centerFor = (span: number): LonLat => {
      if (fixedCenter) return fromMap(fixedCenter);
      if (!anchors.length) return DEFAULT_CAM.c;
      // 镜头大小是写死的、又装不下全部时，优先对准人物和标记（版图只拍一部分）
      const e = ms.camera?.span !== undefined && !fitsAt(span) && anchors.some((a) => a.who !== '版图') ? extentOf(span, anchors.filter((a) => a.who !== '版图')) : extent(span);
      const mx = ((e.x0 + e.x1) / 2 - (free[0] + free[2]) / 2 + W / 2) / e.s;
      const my = ((e.y0 + e.y1) / 2 - (free[1] + free[3]) / 2 + H / 2) / e.s;
      return fromMap([mx, my]);
    };

    /**
     * 人物挤在一起时排成一排（按写的顺序从左到右），碰到城池、地名牌、红印就整排让开。
     * 先排最终位置（dx），再给走动的人排出发位置（dx0）。
     */
    const arrange = (s: number, slots: Anchor[], getDx: (a: Anchor) => number, setDx: (a: Anchor, v: number) => void, obstacles: Box[]) => {
      const boxOf = (a: Anchor) => shift(a.box, a.m[0] * s + getDx(a), a.m[1] * s);
      const components = (pad: number) => {
        const parent = slots.map((_, i) => i);
        const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
        for (let i = 0; i < slots.length; i++) for (let j = i + 1; j < slots.length; j++) if (overlap(boxOf(slots[i]), boxOf(slots[j]), pad)) parent[find(i)] = find(j);
        const groups = new Map<number, number[]>();
        slots.forEach((_, i) => groups.set(find(i), [...(groups.get(find(i)) ?? []), i]));
        return [...groups.values()];
      };
      slots.forEach((a) => setDx(a, 0));
      const GAP = 14;
      for (let iter = 0; iter < 8; iter++) {
        let changed = false;
        for (const g of components(6)) {
          if (g.length < 2) continue;
          const members = g.map((i) => ({a: slots[i], i})).sort((p, q) => p.a.m[0] * s + getDx(p.a) - (q.a.m[0] * s + getDx(q.a)) || p.i - q.i);
          const widths = members.map(({a}) => a.box[2] - a.box[0]);
          const total = widths.reduce((x, y) => x + y, 0) + GAP * (members.length - 1);
          const mean = members.reduce((x, {a}) => x + a.m[0] * s, 0) / members.length;
          let x = mean - total / 2;
          members.forEach(({a}, k) => {
            const v = x - a.box[0] - a.m[0] * s;
            if (Math.abs(v - getDx(a)) > 0.5) changed = true;
            setDx(a, v);
            x += widths[k] + GAP;
          });
        }
        if (!changed) break;
      }
      // 整排避开障碍物：往左右两边找最近的一个空位（之前排好的人也算障碍）
      const placed: Box[] = [];
      for (const g of components(-24)) {
        const base = g.map((i) => getDx(slots[i]));
        const boxesAt = (d: number) => g.map((i, k) => shift(slots[i].box, slots[i].m[0] * s + base[k] + d, slots[i].m[1] * s));
        const clear = (d: number) => boxesAt(d).every((b) => [...obstacles, ...placed].every((o) => !overlap(b, o, 4)));
        let best = 0;
        if (!clear(0)) {
          for (let step = 8; step <= 640; step += 8) {
            if (clear(step)) {
              best = step;
              break;
            }
            if (clear(-step)) {
              best = -step;
              break;
            }
          }
        }
        g.forEach((i, k) => setDx(slots[i], base[k] + best));
        placed.push(...boxesAt(best));
      }
    };
    const spreadFigures = (span: number) => {
      const s = W / (span * PX_PER_DEG);
      const fixedBoxes = anchors.filter((a) => !a.fig && a.who !== '版图' && !a.who.includes('箭头')).map((a) => shift(a.box, a.m[0] * s, a.m[1] * s));
      const finals = anchors.filter((a) => a.fig && !a.start);
      arrange(s, finals, (a) => a.fig!.dx, (a, v) => (a.fig!.dx = v), fixedBoxes);
      const starts = anchors.filter((a) => a.start);
      const standing = finals.filter((a) => !a.fig!.move).map((a) => shift(a.box, a.m[0] * s + a.fig!.dx, a.m[1] * s));
      arrange(s, starts, (a) => a.fig!.dx0, (a, v) => (a.fig!.dx0 = v), [...fixedBoxes, ...standing]);
    };

    // 版图太大、拉到最远也装不下时，就只对准人物和标记
    if (!ms.camera?.span && anchors.some((a) => a.who !== '版图') && !fitsAt(MAX_SPAN)) {
      for (let k = anchors.length - 1; k >= 0; k--) if (anchors[k].who === '版图') anchors.splice(k, 1);
    }
    let span = ms.camera?.span ?? fitSpan();
    for (let k = 0; k < 2; k++) {
      spreadFigures(span);
      if (ms.camera?.span === undefined) span = fitSpan();
    }
    spreadFigures(span);
    const end: Cam = {c: centerFor(span), span};
    const from: Cam = prevType === 'map' && prevCam ? prevCam : {c: end.c, span: Math.min(MAX_SPAN * 1.2, end.span * 1.3)};
    const mid: Cam = {c: end.c, span: end.span * 1.05};
    const travel = Math.round(Math.min(48, Math.max(24, dur * 0.4)));
    prevCam = end;
    prevType = 'map';

    // ---------- 排版检查（按这一段最后一帧的镜头） ----------
    const s = W / (end.span * PX_PER_DEG);
    const [ecx, ecy] = toMap(end.c);
    const screenBox = (a: Anchor): Box => shift(a.box, (a.m[0] - ecx) * s + W / 2 + dxOf(a), (a.m[1] - ecy) * s + H / 2);
    const blockers: {name: string; box: Box}[] = [{name: '底部字幕', box: UI.subtitle}];
    if (pb) blockers.push({name: '顶部标题条', box: bannerBox(pb)});
    if (year) blockers.push({name: '左上年份牌', box: UI.year});
    if (person) blockers.push({name: '左侧人物卡', box: UI.person});
    if (source) blockers.push({name: '右侧史料卡', box: [1215, 290, 1880, 300 + 120 + Math.ceil(textWidthEm(source.quote.replace(/[【】]/g, '')) / 13) * 61]});
    const seal = sealBox(video.seal);
    if (seal) blockers.push({name: '右上角印章', box: seal});
    const real = anchors.filter((a) => a.who !== '版图');
    for (const a of real) {
      const b = screenBox(a);
      if (b[0] < 8 || b[1] < 8 || b[2] > W - 8 || b[3] > H - 8) issues.push(`${where}：${a.who}有一部分跑出画面了`);
      for (const bl of blockers) if (overlap(b, bl.box, 4)) issues.push(`${where}：${a.who}被${bl.name}挡住了`);
    }
    for (let i = 0; i < real.length; i++)
      for (let j = i + 1; j < real.length; j++) {
        const a = real[i];
        const b = real[j];
        if (a.who.includes('箭头') || b.who.includes('箭头') || a.who.endsWith('出发的位置') || b.who.endsWith('出发的位置')) continue;
        if (overlap(screenBox(a), screenBox(b), 14)) issues.push(`${where}：${a.who}和${b.who}压在一起了`);
      }
    if (end.span >= MAX_SPAN - 0.01 && !ms.camera?.span) issues.push(`${where}：这一段的地点隔得太远，镜头拉到最远也装不下，建议拆成两段或去掉离得远的人物`);

    out.push({type: 'map', cam: {from, mid, end, travel}, territories, items, banner: pb, year, person, source, needEnd, beats, issues});
  });
  return out;
};

/** 镜头第 frame 帧的位置：先用 travel 帧移到 mid，再极慢地推到 end */
export const camAt = (cam: PMap['cam'], frame: number, dur: number, lerpCam: (a: Cam, b: Cam, t: number) => Cam): Cam => {
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
  if (frame < cam.travel) return lerpCam(cam.from, cam.mid, ease(Math.max(0, frame / cam.travel)));
  return lerpCam(cam.mid, cam.end, Math.min(1, (frame - cam.travel) / Math.max(1, dur - cam.travel)));
};
