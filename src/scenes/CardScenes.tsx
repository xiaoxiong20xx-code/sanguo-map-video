import React from 'react';
import {Easing, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, H, W} from '../theme';
import {BRUSH, SERIF} from '../fonts';
import {clamp01, pop, progress} from '../anim';
import {Avatar, FigureSvg, NamePill, type Look} from '../components/Figure';
import {Banner} from '../components/Ui';
import {PaperOverlay} from '../map/MapBase';
import type {PBalance, PList, PTitle} from '../core/plan.ts';

type Cast = Record<string, Look>;
const lookIn = (cast: Cast, who: string): Look => cast[who] ?? {name: who, robe: '#6C6E98', faction: 'slate'};

/** 锯齿星形：尖角长短不一，看起来像漫画里的爆炸 */
const starPoints = (n: number, outer: number, inner: number, seed: number) =>
  Array.from({length: n * 2}, (_, i) => {
    const a = (i / (n * 2)) * Math.PI * 2;
    const jitter = 0.82 + 0.36 * Math.abs(Math.sin(i * 12.9898 + seed));
    const r = i % 2 ? inner : outer * jitter;
    return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`;
  }).join(' ');

/** 片头标题卡：蓝色网点底 + 红色放射线 + 大标题 + Q 版人物 */
export const TitleShot: React.FC<{data: PTitle; cast: Cast}> = ({data, cast}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const burst = pop(frame, 0, fps, 120);
  const title = pop(frame, 6, fps, 170);
  const tag = pop(frame, 16, fps, 170);
  return (
    <>
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 55%, #3B63B8 0%, #24408A 55%, #172B5E 100%)'}} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: 0.35}}>
        <defs>
          <pattern id="dots" width={22} height={22} patternUnits="userSpaceOnUse">
            <circle cx={11} cy={11} r={4} fill="#0E1C40" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#dots)" />
      </svg>
      {/* 漫画式锯齿爆炸（红 + 橙黄两层）和白色速度线 */}
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <g transform={`translate(${W / 2} ${H * 0.58})`} opacity={0.5}>
          {Array.from({length: 40}, (_, i) => {
            const a = (i / 40) * Math.PI * 2 + 0.05;
            const r0 = 380 + (i % 3) * 40;
            return <line key={i} x1={Math.cos(a) * r0} y1={Math.sin(a) * r0} x2={Math.cos(a) * 1400} y2={Math.sin(a) * 1400} stroke="#E8EEFF" strokeWidth={i % 2 ? 3 : 6} />;
          })}
        </g>
        <g transform={`translate(${W / 2} ${H * 0.58}) rotate(${frame * 0.15}) scale(${burst})`}>
          <polygon points={starPoints(18, 560, 330, 7)} fill="#D8322A" stroke="#1B1B22" strokeWidth={8} strokeLinejoin="round" />
          <polygon points={starPoints(18, 380, 250, 11)} fill="#F2B33D" stroke="#1B1B22" strokeWidth={6} strokeLinejoin="round" transform="rotate(10)" />
        </g>
      </svg>
      {/* 人物从下面弹上来 */}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 70, display: 'flex', justifyContent: 'center', gap: 40, alignItems: 'flex-end'}}>
        {data.cast.map((who, i) => {
          const p = pop(frame, 10 + i * 5, fps, 160);
          const big = i === Math.floor(data.cast.length / 2);
          const hop = Math.abs(Math.sin((frame + i * 9) / 9)) * 8;
          return (
            <div key={who} style={{transform: `translateY(${(1 - p) * 500 - hop}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              <FigureSvg look={lookIn(cast, who)} mood={'happy'} base={false} size={big ? 330 : 290} />
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 70,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
        }}
      >
        <div
          style={{
            fontFamily: BRUSH,
            fontSize: 210,
            lineHeight: 1,
            color: '#FFFFFF',
            letterSpacing: 18,
            WebkitTextStroke: '10px #1B1B22',
            paintOrder: 'stroke fill',
            textShadow: '10px 12px 0 #B3302A',
            transform: `scale(${0.4 + 0.6 * title}) rotate(${(1 - title) * -8}deg)`,
            opacity: clamp01(title * 2),
          }}
        >
          {data.title}
        </div>
        {data.tag && (
          <div style={{transform: `scale(${tag})`, background: '#1B1B22', color: '#F8E7C2', fontFamily: SERIF, fontWeight: 900, fontSize: 40, letterSpacing: 6, padding: '8px 30px', border: '3px solid #F3EBDD'}}>
            {data.tag}
          </div>
        )}
      </div>
    </>
  );
};

/** 方格纸 + 天平：左右各站一个人，先晃两下再持平 */
export const BalanceShot: React.FC<{data: PBalance; cast: Cast}> = ({data, cast}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const inP = progress(frame, 0, 16, Easing.out(Easing.cubic));
  // 晃动：先往左沉，再往右，逐渐停在水平
  const angle = 9 * Math.exp(-frame / 40) * Math.cos(frame / 9) * clamp01(frame / 6);
  const beamY = 470;
  const half = 420;
  const rad = (angle * Math.PI) / 180;
  const pan = (side: -1 | 1) => ({x: W / 2 + side * half * Math.cos(rad), y: beamY + side * half * Math.sin(rad)});
  const L = pan(-1);
  const R = pan(1);
  const Pan: React.FC<{x: number; y: number; who: string; label: string; t: number}> = ({x, y, who, label, t}) => {
    const p = pop(frame, t, fps, 170);
    return (
      <>
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <path d={`M${x} ${y} L${x - 150} ${y + 250} M${x} ${y} L${x + 150} ${y + 250}`} stroke="#4A3524" strokeWidth={3} />
          <path d={`M${x - 190} ${y + 250} Q${x} ${y + 310} ${x + 190} ${y + 250} Z`} fill="#B98A4E" stroke="#6B4A2E" strokeWidth={4} />
          <circle cx={x} cy={y} r={10} fill="#C9A45C" />
        </svg>
        <div style={{position: 'absolute', left: x - 75, top: y + 256 - 200, width: 150, transform: `scale(${p})`, transformOrigin: '50% 100%'}}>
          <FigureSvg look={lookIn(cast, who)} mood="happy" base={false} size={150} />
        </div>
        <div style={{position: 'absolute', left: x, top: y + 300, transform: `translateX(-50%) scale(${p})`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
          <NamePill name={lookIn(cast, who).name} look={lookIn(cast, who)} />
          <div style={{fontFamily: BRUSH, fontSize: 64, color: C.ink, whiteSpace: 'nowrap'}}>{label}</div>
        </div>
      </>
    );
  };
  return (
    <>
      <div style={{position: 'absolute', inset: 0, background: '#F2E7D0'}} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <pattern id="grid" width={48} height={48} patternUnits="userSpaceOnUse">
            <path d="M48 0 L0 0 0 48" fill="none" stroke="#DCCBA8" strokeWidth={1.2} />
          </pattern>
          <pattern id="grid5" width={240} height={240} patternUnits="userSpaceOnUse">
            <path d="M240 0 L0 0 0 240" fill="none" stroke="#CDB892" strokeWidth={2} />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#grid)" />
        <rect width={W} height={H} fill="url(#grid5)" />
      </svg>
      <div style={{position: 'absolute', inset: 0, opacity: inP, transform: `translateY(${(1 - inP) * 40}px)`}}>
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <rect x={W / 2 - 14} y={beamY} width={28} height={480} fill="#7A5534" />
          <path d={`M${W / 2 - 170} ${beamY + 480} L${W / 2 + 170} ${beamY + 480} L${W / 2 + 120} ${beamY + 440} L${W / 2 - 120} ${beamY + 440} Z`} fill="#5E3F26" />
          <line x1={L.x} y1={L.y} x2={R.x} y2={R.y} stroke="#7A5534" strokeWidth={22} strokeLinecap="round" />
          <circle cx={W / 2} cy={beamY} r={30} fill="#C9A45C" stroke="#7A5534" strokeWidth={6} />
        </svg>
        <Pan x={L.x} y={L.y} who={data.left.who} label={data.left.label} t={data.left.t} />
        <Pan x={R.x} y={R.y} who={data.right.who} label={data.right.label} t={data.right.t} />
      </div>
      {data.banner && (
        <Banner text={data.banner.text} style={data.banner.style} appear={pop(frame, data.banner.t, fps, 160)} reveal={progress(frame, data.banner.t + 6, 16, Easing.out(Easing.cubic))} />
      )}
      <PaperOverlay strength={0.7} />
    </>
  );
};

/** 方格纸 + 标题条 + 2~4 条要点（说到哪条，哪条盖章一样弹出来） */
export const ListShot: React.FC<{data: PList; cast: Cast}> = ({data, cast}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const n = data.points.length;
  const rowH = n <= 2 ? 200 : n === 3 ? 170 : 140;
  const top = 250 + (600 - rowH * n) / 2;
  const drift = Math.sin(frame / 50) * 4;
  return (
    <>
      <div style={{position: 'absolute', inset: 0, background: '#F2E7D0'}} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <pattern id="lgrid" width={48} height={48} patternUnits="userSpaceOnUse">
            <path d="M48 0 L0 0 0 48" fill="none" stroke="#DCCBA8" strokeWidth={1.2} />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#lgrid)" />
      </svg>
      <Banner text={data.title} style={data.style} appear={pop(frame, 2, fps, 160)} reveal={progress(frame, 8, 16, Easing.out(Easing.cubic))} />
      {data.points.map((pt, k) => {
        const p = pop(frame, pt.t, fps, 170);
        if (p <= 0) return null;
        const y = top + k * rowH + drift;
        const lk = pt.who ? lookIn(cast, pt.who) : null;
        return (
          <div
            key={k}
            style={{
              position: 'absolute',
              left: 360,
              top: y,
              height: rowH - 24,
              display: 'flex',
              alignItems: 'center',
              gap: 34,
              transform: `translateX(${(1 - p) * -80}px) scale(${0.7 + 0.3 * p})`,
              transformOrigin: '0 50%',
              opacity: clamp01(p * 2),
            }}
          >
            <div
              style={{
                width: 104,
                height: 104,
                borderRadius: 14,
                background: '#B3302A',
                border: '4px solid #F7E3D6',
                outline: '4px solid #B3302A',
                color: '#FFFFFF',
                fontFamily: BRUSH,
                fontSize: 74,
                lineHeight: '96px',
                textAlign: 'center',
                transform: `rotate(${k % 2 ? 5 : -6}deg)`,
                boxShadow: '0 6px 12px rgba(0,0,0,0.3)',
                flexShrink: 0,
              }}
            >
              {'一二三四'[k]}
            </div>
            {lk && <Avatar look={lk} size={112} ring="#F4EBDA" mood="happy" />}
            <div style={{fontFamily: BRUSH, fontSize: n <= 3 ? 104 : 92, color: C.ink, whiteSpace: 'nowrap', textShadow: '0 3px 0 rgba(255,255,255,0.6)'}}>{pt.text}</div>
          </div>
        );
      })}
      <PaperOverlay strength={0.7} />
    </>
  );
};
