import {Easing, interpolate, spring} from 'remotion';

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** 从 start 帧开始、dur 帧内从 0 到 1 */
export const progress = (frame: number, start: number, dur: number, ease: (t: number) => number = Easing.inOut(Easing.cubic)) =>
  ease(clamp01((frame - start) / dur));

/** 弹出（带一点回弹），0→1 */
export const pop = (frame: number, start: number, fps: number, stiffness = 180) =>
  frame < start ? 0 : spring({frame: frame - start, fps, config: {damping: 13, stiffness, mass: 0.7}});

export const fadeOut = (frame: number, end: number, dur = 8) => 1 - clamp01((frame - (end - dur)) / dur);

export const ramp = (frame: number, a: number, b: number) => interpolate(frame, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

/** 伪随机，同一个 seed 结果固定（渲染每一帧都一致） */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
