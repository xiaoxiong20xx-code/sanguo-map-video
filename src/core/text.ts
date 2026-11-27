// 文字相关的纯函数：宽度估算、字幕断句、读音替换（画面和脚本共用）

/** 单个字符大约占几个字号宽 */
export const charWidthEm = (ch: string) => {
  if (/[⺀-鿿豈-﫿＀-￯　-〿]/.test(ch)) return 1;
  if (/[A-Z0-9]/.test(ch)) return 0.66;
  if (/[a-z]/.test(ch)) return 0.58;
  if (ch === ' ') return 0.28;
  return 0.55;
};
export const textWidthEm = (text: string) => [...text].reduce((w, ch) => w + charWidthEm(ch), 0);

/** 不发音的字符（标点、空白） */
export const PUNCT = /[\s\p{P}\p{S}|]/u;
export const speakable = (s: string) => [...s].filter((c) => !PUNCT.test(c)).join('');

/** 去掉手动断句符 | */
export const cleanScript = (script: string) => script.replace(/\|/g, '');

export type ScriptLine = {text: string; start: number; end: number};

const HARD = /[。！？!?；;…]/;
const SOFT = /[，,：:]/;
const CLOSERS = /[”’」』）)\]】]/;
/** 一条字幕最长约多少个字宽（超过就在逗号处断开） */
export const MAX_LINE_EM = 12;

type Clause = {start: number; end: number; width: number};

const groupClauses = (clauses: Clause[]): Clause[] => {
  const n = clauses.length;
  const best: {cost: number; prev: number}[] = Array.from({length: n + 1}, () => ({cost: Infinity, prev: -1}));
  best[0].cost = 0;
  for (let j = 1; j <= n; j++) {
    for (let i = j - 1; i >= 0; i--) {
      const width = clauses.slice(i, j).reduce((w, c) => w + c.width, 0);
      if (width > MAX_LINE_EM && j - i > 1) break;
      const cost = best[i].cost + 100 + Math.max(0, MAX_LINE_EM - width) ** 2;
      if (cost < best[j].cost) best[j] = {cost, prev: i};
    }
  }
  const out: Clause[] = [];
  for (let j = n; j > 0; j = best[j].prev) {
    const i = best[j].prev;
    out.unshift({start: clauses[i].start, end: clauses[j - 1].end, width: 0});
  }
  return out;
};

/**
 * 把一段口播切成字幕句：句号 / 问号 / 叹号 / 分号一定断，一句太长时在逗号处断成均匀的几行；写了 | 的地方强制断开。
 * 返回每句在 cleanScript 里的起止位置。
 */
export const splitScript = (script: string): ScriptLine[] => {
  const clean = cleanScript(script);
  const lines: ScriptLine[] = [];
  let base = 0;
  for (const chunk of script.split('|')) {
    const chars = [...chunk];
    let pos = 0;
    let clauseStart = 0;
    let sentence: Clause[] = [];
    const flushSentence = () => {
      if (sentence.length) for (const g of groupClauses(sentence)) lines.push({text: '', start: base + g.start, end: base + g.end});
      sentence = [];
    };
    const addClause = (end: number, hard: boolean) => {
      const text = chunk.slice(clauseStart, end);
      if (text.trim()) sentence.push({start: clauseStart, end, width: textWidthEm(text)});
      clauseStart = end;
      if (hard) flushSentence();
    };
    for (let i = 0; i < chars.length; i++) {
      pos += chars[i].length;
      const isHard = HARD.test(chars[i]);
      if (isHard || SOFT.test(chars[i])) {
        while (i + 1 < chars.length && (CLOSERS.test(chars[i + 1]) || HARD.test(chars[i + 1]))) pos += chars[++i].length;
        addClause(pos, isHard);
      }
    }
    addClause(chunk.length, true);
    base += chunk.length;
  }
  return lines
    .map((l) => {
      const raw = clean.slice(l.start, l.end);
      const lead = raw.length - raw.trimStart().length;
      const text = raw.trim();
      return {text, start: l.start + lead, end: l.start + lead + text.length};
    })
    .filter((l) => speakable(l.text).length > 0);
};

/** 字幕显示：去掉句末标点，句中的逗号句号换成空格（顿号、引号、书名号保留），字不改 */
export const displayText = (text: string) => text.replace(/[，。、；：,.;:！!？?]+$/, '').replace(/[，。；：,;:！!？?]+/g, '  ');

/**
 * 内置读音修正（三国人名地名里 TTS 容易读错的多音字 / 生僻字）。
 * 读法用同音字代替，只影响声音，字幕照原文显示。用户可以在 video.ts 的 readAs 里补充或覆盖。
 */
export const DEFAULT_READ_AS: Record<string, string> = {
  钟繇: '钟摇',
  四长: '四掌',
  刘禅: '刘善',
  单福: '善福',
  曹叡: '曹锐',
  郭汜: '郭四',
  张郃: '张合',
  夏侯惇: '夏侯敦',
  沮授: '举授',
  逄纪: '庞纪',
  华歆: '化歆',
  乐进: '月进',
  阚泽: '看泽',
  费祎: '费依',
  公孙瓒: '公孙赞',
  笮融: '则融',
  阳翟: '阳迪',
  番禺: '潘禺',
  猇亭: '消亭',
  鄄城: '倦城',
  东阿: '东婀',
  涪城: '浮城',
  涪陵: '浮陵',
};

/**
 * 显示文字 → 配音文字（按 readAs 替换），同时记下每个显示字对应配音文字里的哪个位置，
 * 这样配音里每个字的时间能对回字幕和画面。
 */
export const toTts = (text: string, readAs: Record<string, string>) => {
  const keys = Object.keys(readAs).filter(Boolean).sort((a, b) => b.length - a.length);
  let out = '';
  const map: number[] = [];
  for (let i = 0; i < text.length; ) {
    const k = keys.find((key) => text.startsWith(key, i));
    if (k) {
      const v = readAs[k];
      for (let j = 0; j < k.length; j++) map.push(out.length + Math.floor((j * v.length) / k.length));
      out += v;
      i += k.length;
    } else {
      map.push(out.length);
      out += text[i];
      i++;
    }
  }
  map.push(out.length);
  return {text: out, map};
};
