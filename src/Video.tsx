import React from 'react';
import {AbsoluteFill, Audio, Freeze, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {MapShot} from './scenes/MapShot';
import {BalanceShot, ListShot, TitleShot} from './scenes/CardScenes';
import {Seal, Subtitle} from './components/Ui';
import {ensureFonts} from './fonts';
import {CAST, getPlan, TIMELINE, VIDEO} from './data';
import {LEAD} from './core/plan.ts';
import {displayText} from './core/text.ts';
import {SERIF} from './fonts';

ensureFonts();

const Subs: React.FC<{subs: {text: string; from: number; to: number}[]}> = ({subs}) => {
  const frame = useCurrentFrame();
  const s = subs.find((c) => frame >= c.from && frame < c.to);
  return <Subtitle text={s ? displayText(s.text) : ''} />;
};

export const Video: React.FC = () => {
  const plan = getPlan();
  return (
    <AbsoluteFill style={{background: '#1A3F4D', overflow: 'hidden'}}>
      {plan.map((p, i) => {
        const t = TIMELINE.scenes[i];
        return (
          <Sequence key={i} from={t.from} durationInFrames={t.dur}>
            {p.type === 'map' && <MapShot plan={p} dur={t.dur} cast={CAST} index={i} />}
            {p.type === 'title' && <TitleShot data={p} cast={CAST} />}
            {p.type === 'balance' && <BalanceShot data={p} cast={CAST} />}
            {p.type === 'list' && <ListShot data={p} cast={CAST} />}
            <Subs subs={t.subs} />
            {t.audio && (
              <Sequence from={LEAD}>
                <Audio src={staticFile(t.audio)} />
              </Sequence>
            )}
          </Sequence>
        );
      })}
      {VIDEO.seal && <Seal text={VIDEO.seal} />}
    </AbsoluteFill>
  );
};

/** 检查图：每张缩成 480×270，下面写上第几段、几秒、那一刻的字幕 */
export const ContactSheet: React.FC<{frames: number[]; labels: string[]}> = ({frames, labels}) => (
  <AbsoluteFill style={{backgroundColor: '#2B2622', fontFamily: SERIF, display: 'flex', flexDirection: 'row', flexWrap: 'wrap', alignContent: 'flex-start', gap: 12, padding: 12}}>
    {frames.map((f, i) => (
      <div key={i} style={{width: 480, height: 322, position: 'relative'}}>
        <div style={{width: 480, height: 270, overflow: 'hidden', position: 'relative'}}>
          <div style={{width: 1920, height: 1080, transform: 'scale(0.25)', transformOrigin: '0 0', position: 'absolute'}}>
            <Freeze frame={f}>
              <Video />
            </Freeze>
          </div>
        </div>
        <div style={{color: '#F3E7CF', fontSize: 21, fontWeight: 700, padding: '6px 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{labels[i]}</div>
      </div>
    ))}
  </AbsoluteFill>
);
