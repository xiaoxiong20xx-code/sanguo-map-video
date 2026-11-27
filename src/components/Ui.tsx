import React from 'react';
import {C} from '../theme';
import {BRUSH, SERIF} from '../fonts';
import {clamp01} from '../anim';
import {Avatar, type Look} from './Figure';

/** 宫殿 / 城池图标（红墙黑瓦） */
export const Palace: React.FC<{size?: number}> = ({size = 150}) => (
  <svg width={size} height={(size * 130) / 160} viewBox="0 0 160 130" style={{overflow: 'visible', display: 'block'}}>
    <ellipse cx={84} cy={124} rx={72} ry={9} fill="rgba(25,15,5,0.3)" />
    <rect x={12} y={104} width={136} height={17} rx={2} fill="#A49E92" />
    <rect x={20} y={97} width={120} height={9} rx={1} fill="#C9C3B6" />
    <rect x={66} y={97} width={28} height={24} fill="#B8B2A5" />
    {[102, 108, 114].map((y) => (
      <line key={y} x1={66} y1={y} x2={94} y2={y} stroke="#9A9487" strokeWidth={1.2} />
    ))}
    <rect x={28} y={62} width={104} height={36} fill="#B3302A" />
    {[34, 46, 104, 116].map((x) => (
      <rect key={x} x={x} y={68} width={10} height={22} fill="#6E1B18" />
    ))}
    <rect x={69} y={70} width={22} height={28} rx={2} fill="#5A1512" />
    <path d="M8 62 Q38 58 48 46 L112 46 Q122 58 152 62 L154 55 Q128 52 118 40 L42 40 Q32 52 6 55 Z" fill="#3A3E47" />
    <path d="M6 55 Q32 52 42 40 L118 40 Q128 52 154 55" stroke="#5B606B" strokeWidth={2} fill="none" />
    <rect x={46} y={28} width={68} height={14} fill="#B3302A" />
    <rect x={71} y={30} width={18} height={9} fill={C.gold} />
    <path d="M30 30 Q52 27 58 15 L102 15 Q108 27 130 30 L133 24 Q112 22 106 10 L54 10 Q48 22 27 24 Z" fill="#3A3E47" />
    <path d="M27 24 Q48 22 54 10 L106 10 Q112 22 133 24" stroke="#5B606B" strokeWidth={2} fill="none" />
    <rect x={52} y={6} width={56} height={5} rx={2} fill="#2C2F36" />
    <circle cx={50} cy={6} r={3.5} fill="#2C2F36" />
    <circle cx={110} cy={6} r={3.5} fill="#2C2F36" />
  </svg>
);

export type BannerStyle = 'slate' | 'red' | 'black' | 'purple' | 'wood';
const BANNER: Record<BannerStyle, {bg: string; edge: string; text: string}> = {
  slate: {bg: 'linear-gradient(180deg,#6C7799,#56607F)', edge: '#EEF0F6', text: '#FFFFFF'},
  red: {bg: 'linear-gradient(180deg,#C43A32,#A22B25)', edge: '#FBE9DF', text: '#FFFFFF'},
  black: {bg: 'linear-gradient(180deg,#34302D,#211E1C)', edge: '#D3B06A', text: '#FFFFFF'},
  purple: {bg: 'linear-gradient(180deg,#7C5C9E,#634684)', edge: '#F1E8F8', text: '#FFFFFF'},
  wood: {bg: 'linear-gradient(180deg,#9A6B3F,#7A5030)', edge: '#E9CFA4', text: '#FFF6E6'},
};

/** 顶部标题条：从上方落下，字从左到右显出来 */
export const Banner: React.FC<{text: string; style?: BannerStyle; appear: number; reveal: number; size?: number}> = ({text, style = 'slate', appear, reveal, size = 76}) => {
  const b = BANNER[style];
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: 70,
        transform: `translate(-50%, ${(1 - appear) * -170}px) scale(${0.85 + 0.15 * appear})`,
        opacity: clamp01(appear * 2),
        background: b.bg,
        padding: 9,
        boxShadow: '0 10px 22px rgba(0,0,0,0.45)',
      }}
    >
      <div style={{border: `3px solid ${b.edge}`, padding: 4}}>
        <div style={{border: `1.5px solid ${b.edge}`, padding: '6px 44px 10px'}}>
          <div
            style={{
              fontFamily: BRUSH,
              fontSize: size,
              color: b.text,
              letterSpacing: size * 0.12,
              whiteSpace: 'nowrap',
              lineHeight: 1.15,
              clipPath: `inset(-20% ${(1 - reveal) * 100}% -20% 0)`,
              textShadow: '0 3px 0 rgba(0,0,0,0.25)',
            }}
          >
            {text}
          </div>
        </div>
      </div>
    </div>
  );
};

/** 左侧人物卡 */
export const PersonCard: React.FC<{name: string; zi?: string; line: string; source?: string; look: Look; appear: number}> = ({name, zi, line, source, look, appear}) => (
  <div
    style={{
      position: 'absolute',
      left: 50,
      top: 300,
      width: 600,
      transform: `translateX(${(1 - appear) * -700}px)`,
      background: 'linear-gradient(180deg,#F8EEDC,#EEDFC2)',
      border: `3px solid ${C.paperEdge}`,
      outline: '2px solid #F8EEDC',
      outlineOffset: 4,
      boxShadow: '0 12px 26px rgba(0,0,0,0.45), 0 0 0 7px #8B6B4A',
      padding: '26px 30px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}
  >
    <div style={{display: 'flex', alignItems: 'center', gap: 24}}>
      <Avatar look={look} size={150} ring="#7B5A9C" mood="neutral" />
      <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
        <div style={{display: 'flex', alignItems: 'flex-start', gap: 10}}>
          <span style={{fontFamily: BRUSH, fontSize: 92, color: C.ink, lineHeight: 1, letterSpacing: 6}}>{name}</span>
          {zi && (
            <span style={{fontFamily: SERIF, fontWeight: 800, fontSize: 24, color: C.white, background: '#7B5A9C', borderRadius: 8, padding: '4px 10px', marginTop: 4, whiteSpace: 'nowrap'}}>
              {zi}
            </span>
          )}
        </div>
        <div style={{fontFamily: SERIF, fontWeight: 800, fontSize: 28, color: '#8E3A2E'}}>{line}</div>
      </div>
    </div>
    {source && <div style={{borderTop: '1.5px solid #CDB894', paddingTop: 10, fontFamily: SERIF, fontSize: 20, color: '#7A6852'}}>史料：{source}</div>}
  </div>
);

/** 右侧史料卡：红竖条“史料”+ 引文（【】里的字加红线划重点）+“证”字印 */
export const SourceCard: React.FC<{book: string; date?: string; quote: string; appear: number; underline: number}> = ({book, date, quote, appear, underline}) => {
  const parts = quote.split(/(【[^】]+】)/).filter(Boolean);
  return (
    <div
      style={{
        position: 'absolute',
        right: 50,
        top: 300,
        width: 640,
        transform: `translateX(${(1 - appear) * 760}px)`,
        display: 'flex',
        background: 'linear-gradient(180deg,#FBF4E6,#F1E5CC)',
        border: '3px solid #8B6B4A',
        boxShadow: '0 12px 26px rgba(0,0,0,0.45)',
      }}
    >
      <div style={{width: 74, background: '#A8302A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6}}>
        {'史料'.split('').map((ch) => (
          <span key={ch} style={{fontFamily: BRUSH, fontSize: 48, color: C.white, lineHeight: 1}}>
            {ch}
          </span>
        ))}
      </div>
      <div style={{flex: 1, padding: '20px 26px 24px', position: 'relative'}}>
        <div style={{fontFamily: SERIF, fontSize: 24, color: '#5E5040', fontWeight: 600}}>{book}</div>
        {date && <div style={{fontFamily: SERIF, fontSize: 20, color: '#8A7B66', marginTop: 4}}>{date}</div>}
        <div style={{fontFamily: SERIF, fontWeight: 700, fontSize: 38, color: C.ink, lineHeight: 1.6, marginTop: 14}}>
          {parts.map((p, i) =>
            p.startsWith('【') ? (
              <span
                key={i}
                style={{
                  color: '#B3302A',
                  textDecoration: 'underline',
                  textDecorationThickness: 3,
                  textUnderlineOffset: 8,
                  textDecorationColor: `rgba(179, 48, 42, ${clamp01(underline)})`,
                }}
              >
                {p.slice(1, -1)}
              </span>
            ) : (
              <span key={i}>{p}</span>
            ),
          )}
        </div>
        <div
          style={{
            position: 'absolute',
            right: 18,
            top: 16,
            width: 54,
            height: 54,
            border: '3px solid #B3302A',
            borderRadius: 6,
            color: '#B3302A',
            fontFamily: BRUSH,
            fontSize: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: 'rotate(-6deg)',
          }}
        >
          证
        </div>
      </div>
    </div>
  );
};

/** 左上年份牌 */
export const YearBadge: React.FC<{year: string; era?: string; appear: number}> = ({year, era, appear}) => (
  <div
    style={{
      position: 'absolute',
      left: 60,
      top: 70,
      opacity: appear,
      transform: `translateY(${(1 - appear) * -30}px)`,
      background: 'linear-gradient(180deg,#4A392C,#2F241C)',
      border: '2px solid #A88A5C',
      borderRadius: 10,
      padding: '12px 30px 12px',
      textAlign: 'center',
      boxShadow: '0 8px 18px rgba(0,0,0,0.45)',
    }}
  >
    <div style={{fontFamily: SERIF, fontWeight: 900, fontSize: 40, color: '#F6EAD2', letterSpacing: 2}}>{year}</div>
    {era && <div style={{fontFamily: SERIF, fontSize: 20, color: '#CDB896', marginTop: 2}}>{era}</div>}
  </div>
);

/** 底部字幕：深色半透明圆角底 + 白色毛笔字 */
export const Subtitle: React.FC<{text: string}> = ({text}) =>
  text ? (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 74, display: 'flex', justifyContent: 'center'}}>
      <div
        style={{
          background: 'rgba(28,24,22,0.72)',
          borderRadius: 16,
          padding: '6px 30px 10px',
          fontFamily: BRUSH,
          fontSize: 58,
          color: C.white,
          letterSpacing: 4,
          WebkitTextStroke: '1.2px #FFFFFF',
          textShadow: '0 3px 0 rgba(0,0,0,0.5)',
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </div>
    </div>
  ) : null;

/** 右上角竖排频道印章 */
export const Seal: React.FC<{text: string}> = ({text}) => (
  <div
    style={{
      position: 'absolute',
      right: 34,
      top: 38,
      width: 46,
      padding: '12px 0',
      background: '#B42E2A',
      borderRadius: 18,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2,
      boxShadow: '0 3px 8px rgba(0,0,0,0.35)',
    }}
  >
    {text.split('').map((ch, i) => (
      <span key={i} style={{fontFamily: BRUSH, fontSize: 30, lineHeight: 1.05, color: '#FBEDE3'}}>
        {ch}
      </span>
    ))}
  </div>
);

/** 红色方印（盖章动画：从大到小砸下来） */
export const Stamp: React.FC<{text: string; p: number; angle?: number; size?: number}> = ({text, p, angle = -10, size = 76}) => {
  if (p <= 0) return null;
  const chars = text.split('');
  const two = chars.length <= 2;
  return (
    <div
      style={{
        width: size,
        height: two ? size * 1.15 : size,
        background: '#C2352E',
        border: '3px solid #F7E3D6',
        outline: '3px solid #C2352E',
        borderRadius: 6,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `rotate(${angle}deg) scale(${1 + (1 - p) * 1.4})`,
        opacity: clamp01(p * 3),
        boxShadow: '0 4px 10px rgba(0,0,0,0.35)',
      }}
    >
      {two ? (
        chars.map((ch, i) => (
          <span key={i} style={{fontFamily: BRUSH, fontSize: size * 0.46, lineHeight: 1, color: C.white}}>
            {ch}
          </span>
        ))
      ) : (
        <span style={{fontFamily: BRUSH, fontSize: size * 0.3, lineHeight: 1.1, color: C.white, textAlign: 'center', padding: 4}}>{text}</span>
      )}
    </div>
  );
};

/** 头顶标记：？（红色六边形）、！（白底红字）、……（对话气泡） */
export const Marker: React.FC<{kind: '?' | '!' | '…'; p: number}> = ({kind, p}) => {
  if (p <= 0) return null;
  const common: React.CSSProperties = {transform: `scale(${p})`, transformOrigin: '50% 100%'};
  if (kind === '…')
    return (
      <div style={{...common, background: C.white, borderRadius: 22, padding: '2px 16px 10px', fontFamily: SERIF, fontWeight: 900, fontSize: 30, color: C.ink, boxShadow: '0 3px 8px rgba(0,0,0,0.3)'}}>
        ……
      </div>
    );
  return (
    <div style={common}>
      <svg width={54} height={58} viewBox="0 0 54 58">
        {kind === '?' ? (
          <path d="M27 2 L50 15 L50 41 L27 54 L4 41 L4 15 Z" fill="#C2352E" stroke="#FBE9DF" strokeWidth={3} />
        ) : (
          <circle cx={27} cy={28} r={24} fill="#FFFFFF" stroke="#C2352E" strokeWidth={3} />
        )}
        <text x={27} y={39} textAnchor="middle" fontFamily={SERIF} fontWeight={900} fontSize={32} fill={kind === '?' ? '#FFFFFF' : '#C2352E'}>
          {kind}
        </text>
      </svg>
    </div>
  );
};

/** 红叉（两笔画出来） */
export const RedCross: React.FC<{p: number; size?: number}> = ({p, size = 120}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{overflow: 'visible'}}>
    <path d="M14 14 L86 86" stroke="#D2322B" strokeWidth={13} strokeLinecap="round" pathLength={1} strokeDasharray={`${clamp01(p * 2)} 1`} />
    <path d="M86 14 L14 86" stroke="#D2322B" strokeWidth={13} strokeLinecap="round" pathLength={1} strokeDasharray={`${clamp01(p * 2 - 1)} 1`} />
  </svg>
);

/** 交叉双刀（战场标记） */
export const Swords: React.FC<{size?: number}> = ({size = 90}) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <circle cx={50} cy={50} r={44} fill="#B3302A" stroke="#F7E3D6" strokeWidth={4} />
    {[45, -45].map((a) => (
      <g key={a} transform={`rotate(${a} 50 50)`}>
        <rect x={47} y={14} width={6} height={56} rx={2} fill="#E9EDF2" />
        <rect x={40} y={66} width={20} height={5} rx={2} fill={C.gold} />
        <rect x={47} y={70} width={6} height={14} rx={2} fill="#4A2F1D" />
      </g>
    ))}
  </svg>
);
