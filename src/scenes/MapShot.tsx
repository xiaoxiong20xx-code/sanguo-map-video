import React from 'react';
import {Easing, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, lerp, pop, progress} from '../anim';
import {lerpCam, lonLatToScreen, type LonLat} from '../map/geo';
import {Hydro, MapSpace, PaperOverlay, ProvinceLabels, Relief, Terrain} from '../map/MapBase';
import {Territories} from '../map/Territories';
import {FigureSvg, NamePill, PlaceTag, type Look} from '../components/Figure';
import {Banner, Marker, Palace, PersonCard, RedCross, SourceCard, Stamp, Swords, YearBadge} from '../components/Ui';
import {camAt, type PItem, type PMap} from '../core/plan.ts';

const FIG = 104; // 棋子宽度（屏幕像素）

const Arrow: React.FC<{id: string; a: [number, number]; b: [number, number]; p: number}> = ({id, a, b, p}) => {
  const len = Math.max(1, Math.hypot(b[0] - a[0], b[1] - a[1]));
  // 控制点往上抬，画成一道弧线
  const cx = (a[0] + b[0]) / 2 + ((b[1] - a[1]) / len) * len * 0.2;
  const cy = (a[1] + b[1]) / 2 - ((b[0] - a[0]) / len) * len * 0.2 - len * 0.12;
  const d = `M${a[0]} ${a[1]} Q${cx} ${cy} ${b[0]} ${b[1]}`;
  const ang = (Math.atan2(b[1] - cy, b[0] - cx) * 180) / Math.PI;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x={-200} y={-200} width={2320} height={1480}>
          <path d={d} fill="none" stroke="#fff" strokeWidth={18} pathLength={1} strokeDasharray={`${p} 1`} />
        </mask>
      </defs>
      <g mask={`url(#${id})`}>
        <path d={d} fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth={10} strokeDasharray="18 12" strokeLinecap="round" />
        <path d={d} fill="none" stroke="#C2352E" strokeWidth={5.5} strokeDasharray="18 12" strokeLinecap="round" />
      </g>
      {p >= 0.98 && <path d="M0 0 L-28 -15 L-21 0 L-28 15 Z" fill="#C2352E" stroke="#FFFFFF" strokeWidth={3} transform={`translate(${b[0]} ${b[1]}) rotate(${ang})`} />}
    </svg>
  );
};

/** 人物这一帧站在哪（经纬度 + 屏幕横向错开量 + 跳起高度） */
const figureState = (it: Extract<PItem, {kind: 'figure'}>, frame: number) => {
  if (!it.move) return {ll: it.ll, dx: it.dx, hop: 0, m: 1};
  if (frame < it.move.t) return {ll: it.ll, dx: it.dx0, hop: 0, m: 0};
  const m = progress(frame, it.move.t, it.move.dur);
  const ll: LonLat = [lerp(it.ll[0], it.move.to[0], m), lerp(it.ll[1], it.move.to[1], m)];
  return {ll, dx: lerp(it.dx0, it.dx, m), hop: m > 0 && m < 1 ? Math.abs(Math.sin(m * Math.PI * 4)) * 26 : 0, m};
};

export const MapShot: React.FC<{plan: PMap; dur: number; cast: Record<string, Look>; index: number}> = ({plan, dur, cast, index}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const cam = camAt(plan.cam, frame, dur, lerpCam);
  const S = (ll: LonLat) => lonLatToScreen(cam, ll);
  const look = (who: string) => cast[who] ?? {name: who, robe: '#6C6E98', faction: 'slate' as const};

  // 下面的东西后画，免得被上面的挡住
  const yOf = (it: PItem) => S(it.kind === 'arrow' ? it.from : it.kind === 'figure' && it.move ? it.move.to : it.ll)[1];
  const sorted = plan.items.map((it, i) => ({it, i})).sort((a, b) => (a.it.kind === 'arrow' ? -1 : 0) - (b.it.kind === 'arrow' ? -1 : 0) || yOf(a.it) - yOf(b.it));

  return (
    <>
      <MapSpace cam={cam}>
        <Terrain cam={cam} />
        <Territories list={plan.territories} frame={frame} />
        <Relief cam={cam} />
        <Hydro />
      </MapSpace>
      <ProvinceLabels cam={cam} />
      <PaperOverlay />

      {/* 走动时的虚线箭头（画在人物下面） */}
      {plan.items.map((it, i) => {
        if (it.kind !== 'figure' || !it.move?.arrow) return null;
        const t0 = it.move.t - 12;
        if (frame < t0) return null;
        const [ax, ay] = S(it.ll);
        const [bx, by] = S(it.move.to);
        return <Arrow key={`ma${i}`} id={`marrow${index}_${i}`} a={[ax + it.dx0, ay - 20]} b={[bx + it.dx, by - 20]} p={progress(frame, t0, 22)} />;
      })}

      {sorted.map(({it, i}) => {
        if (frame < it.t) return null;
        if (it.kind === 'arrow') {
          return <Arrow key={i} id={`arrow${index}_${i}`} a={S(it.from)} b={S(it.to)} p={progress(frame, it.t, it.dur)} />;
        }
        const p = it.t < 0 ? 1 : pop(frame, it.t, fps);
        if (it.kind === 'city') {
          const [x, y] = S(it.ll);
          const size = it.size;
          return (
            <div key={i} style={{position: 'absolute', left: x - size / 2, top: y - size * 0.8, transform: `translateY(${(1 - p) * -60}px)`, opacity: clamp01(p * 2)}}>
              <Palace size={size} />
              {it.label && (
                <div style={{position: 'absolute', left: size / 2, top: -14, transform: `translate(-50%, -100%) scale(${it.t < 0 ? 1 : pop(frame, it.t + 6, fps)})`}}>
                  <PlaceTag text={it.label} tone="dark" />
                </div>
              )}
            </div>
          );
        }
        if (it.kind === 'label') {
          const [x, y] = S(it.ll);
          const swapped = it.swap && frame >= it.swap.t;
          const flip = it.swap && frame >= it.swap.t - 6 && frame < it.swap.t + 6 ? Math.abs(Math.cos(clamp01((frame - it.swap.t + 6) / 12) * Math.PI)) : 1;
          return (
            <div key={i} style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${p}) scaleY(${flip})`}}>
              <PlaceTag text={swapped ? it.swap!.text : it.text} tone={swapped || it.dark ? 'dark' : 'light'} />
            </div>
          );
        }
        if (it.kind === 'stamp') {
          const [x, y] = S(it.ll);
          return (
            <div key={i} style={{position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)'}}>
              <Stamp text={it.text} p={progress(frame, it.t, 8, Easing.out(Easing.cubic))} angle={it.angle} />
            </div>
          );
        }
        if (it.kind === 'battle') {
          const [x, y] = S(it.ll);
          return (
            <div key={i} style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${p})`}}>
              <Swords />
            </div>
          );
        }
        // 人物
        const lk = look(it.who);
        const st = figureState(it, frame);
        const [sx, y] = S(st.ll);
        const x = sx + st.dx;
        const mood = it.moodAfter && frame >= it.moodAfter.t ? it.moodAfter.mood : it.mood;
        const bob = Math.sin((frame + i * 17) / 11) * 2;
        return (
          <div key={i} style={{position: 'absolute', left: x - FIG / 2, top: y - (FIG * 146) / 120 - st.hop + bob, width: FIG}}>
            <div style={{transform: `scale(${p})`, transformOrigin: '50% 100%'}}>
              {it.mark && (
                <div style={{position: 'absolute', left: FIG / 2 - 27, top: -54, zIndex: 3}}>
                  <Marker kind={it.mark.kind} p={pop(frame, it.mark.t, fps, 220)} />
                </div>
              )}
              <FigureSvg look={lk} mood={mood} size={FIG} />
              <div style={{position: 'absolute', left: '50%', top: (FIG * 150) / 120, transform: 'translateX(-50%)'}}>
                <NamePill name={lk.name} look={lk} scale={0.82} />
              </div>
              {it.cross !== undefined && frame >= it.cross && (
                <div style={{position: 'absolute', left: FIG / 2 - 70, top: 10}}>
                  <RedCross p={progress(frame, it.cross, 14)} size={140} />
                </div>
              )}
            </div>
          </div>
        );
      })}

      {plan.year && <YearBadge year={plan.year.year} era={plan.year.era} appear={progress(frame, plan.year.t, 10)} />}
      {plan.banner && (
        <Banner text={plan.banner.text} style={plan.banner.style} appear={pop(frame, plan.banner.t, fps, 160)} reveal={progress(frame, plan.banner.t + 6, 16, Easing.out(Easing.cubic))} />
      )}
      {plan.person && (
        <PersonCard
          name={plan.person.who}
          zi={plan.person.zi}
          line={plan.person.line}
          source={plan.person.source}
          look={look(plan.person.who)}
          appear={progress(frame, plan.person.t, 14, Easing.out(Easing.back(1.2)))}
        />
      )}
      {plan.source && (
        <SourceCard
          book={plan.source.book}
          date={plan.source.date}
          quote={plan.source.quote}
          appear={progress(frame, plan.source.t, 14, Easing.out(Easing.back(1.2)))}
          underline={progress(frame, plan.source.t + 30, 20)}
        />
      )}
    </>
  );
};
