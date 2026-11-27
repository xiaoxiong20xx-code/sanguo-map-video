// 把内容（content/video.ts）和自动生成的时间轴（src/generated/timeline.json）接到一起
import video from '../content/video.ts';
import raw from './generated/timeline.json';
import {planVideo, type PScene} from './core/plan.ts';
import {castOf} from './core/cast.ts';
import {cleanScript} from './core/text.ts';
import {lookOf, type Look} from './components/Figure';

export type TimelineScene = {
  script: string;
  type: string;
  from: number;
  dur: number;
  audio: string | null;
  charFrames: number[];
  speechEnd: number;
  subs: {text: string; from: number; to: number}[];
};
export type Timeline = {fps: number; total: number; scenes: TimelineScene[]};

export const VIDEO = video;
export const TIMELINE = raw as unknown as Timeline;
export const COMPOSITION_ID = 'HistoryVideo';

const inSync = () =>
  TIMELINE.scenes.length === VIDEO.scenes.length &&
  TIMELINE.scenes.every((t, i) => cleanScript(t.script) === cleanScript(VIDEO.scenes[i].script) && t.type === VIDEO.scenes[i].type);

let cached: PScene[] | null = null;
export const getPlan = (): PScene[] => {
  if (!inSync()) throw new Error('content/video.ts 改过了，但配音和时间轴还没重新生成。请先运行 npm run preview 或 npm run make。');
  cached ??= planVideo({video: VIDEO, timings: TIMELINE.scenes.map((s) => ({charFrames: s.charFrames, speechEnd: s.speechEnd, dur: s.dur}))});
  return cached;
};

export const CAST: Record<string, Look> = Object.fromEntries(Object.entries(castOf(VIDEO)).map(([name, p]) => [name, lookOf(name, p)]));
