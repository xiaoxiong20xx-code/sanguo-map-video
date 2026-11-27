import React from 'react';
import {C, FACTION} from '../theme';
import {BRUSH, SERIF} from '../fonts';
import type {Mood, Person} from '../core/types.ts';
import {robeOf} from '../core/cast.ts';

export type {Mood};
/**
 * Q 版人物（桌游棋子风格）。外观全部由参数决定（见 src/core/cast.ts 的预置人物表）：
 * color 阵营色，hat 帽子，face 胡子，prop 手里拿的，skin 脸色，robe 袍子颜色
 */
export type Look = {
  name: string;
  robe: string;
  hat?: Person['hat'];
  face?: Person['face'];
  prop?: Person['prop'];
  skin?: Person['skin'];
  faction?: keyof typeof FACTION;
};

/** 人物表里的一项 → 画图用的外观 */
export const lookOf = (name: string, person?: Person): Look =>
  person
    ? {name, robe: robeOf(person), hat: person.hat ?? 'guan', face: person.face ?? 'none', prop: person.prop ?? 'none', skin: person.skin, faction: person.color}
    : {name, robe: '#6C6E98', hat: 'guan', face: 'none', prop: 'none', faction: 'slate'};

const SKIN: Record<string, {fill: string; edge: string}> = {
  normal: {fill: C.skin, edge: '#D8B497'},
  red: {fill: '#E08A72', edge: '#B8604C'},
  dark: {fill: '#C49A78', edge: '#9C7656'},
};

const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
  return `rgb(${f(n >> 16)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`;
};

/** 头部（viewBox 里以 (60,52) 为中心，半径 30） */
export const Head: React.FC<{look: Look; mood?: Mood}> = ({look, mood = 'happy'}) => {
  const hair = C.hair;
  return (
    <g>
      {look.hat === 'crown' && (
        <g>
          <rect x={38} y={4} width={44} height={20} rx={4} fill="#2A2530" />
          <rect x={22} y={0} width={76} height={8} rx={2} fill="#2A2530" transform="rotate(-3 60 4)" />
          {[28, 36, 44, 76, 84, 92].map((x) => (
            <g key={x}>
              <line x1={x} y1={6} x2={x} y2={x < 60 ? 30 : 30} stroke="#3A3040" strokeWidth={1.4} />
              <circle cx={x} cy={14} r={2.2} fill="#E5B84A" />
              <circle cx={x} cy={22} r={2.2} fill="#C9463D" />
              <circle cx={x} cy={30} r={2.2} fill="#E5B84A" />
            </g>
          ))}
        </g>
      )}
      {look.hat === 'guan' && (
        <g>
          <path d="M48 26 L52 4 Q62 0 72 6 L74 26 Z" fill="#26232B" />
          <rect x={46} y={22} width={30} height={6} rx={2} fill="#3B3742" />
          <line x1={40} y1={16} x2={82} y2={12} stroke="#C9A45C" strokeWidth={2.4} strokeLinecap="round" />
        </g>
      )}
      {look.hat === 'bun' && <circle cx={60} cy={18} r={10} fill={hair} />}
      {look.hat === 'helmet' && <path d="M28 46 Q28 10 60 10 Q92 10 92 46 L84 40 Q60 30 36 40 Z" fill="#7C8592" stroke="#4E5560" strokeWidth={2} />}
      {look.hat === 'hairpin' && (
        <g>
          <path d="M31 48 Q24 78 36 90 L45 66 Z M89 48 Q96 78 84 90 L75 66 Z" fill={hair} />
          <ellipse cx={60} cy={19} rx={17} ry={11} fill={hair} />
          <line x1={38} y1={13} x2={84} y2={24} stroke="#E5B84A" strokeWidth={3} strokeLinecap="round" />
          <circle cx={85} cy={24} r={4.2} fill="#C9463D" />
        </g>
      )}
      <circle cx={60} cy={52} r={30} fill={(SKIN[look.skin ?? 'normal'] ?? SKIN.normal).fill} stroke={(SKIN[look.skin ?? 'normal'] ?? SKIN.normal).edge} strokeWidth={1.5} />
      {/* 头发 */}
      <path d="M30 54 Q28 22 60 22 Q92 22 90 54 Q86 36 66 34 Q60 40 52 36 Q36 38 30 54 Z" fill={hair} />
      {/* 眉毛 */}
      {mood === 'worried' ? (
        <>
          <path d="M44 44 L53 41" stroke={hair} strokeWidth={2.6} strokeLinecap="round" />
          <path d="M67 41 L76 44" stroke={hair} strokeWidth={2.6} strokeLinecap="round" />
        </>
      ) : mood === 'angry' ? (
        <>
          <path d="M43 40 L54 45" stroke={hair} strokeWidth={3} strokeLinecap="round" />
          <path d="M66 45 L77 40" stroke={hair} strokeWidth={3} strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M44 43 Q49 40 54 43" stroke={hair} strokeWidth={2.4} fill="none" strokeLinecap="round" />
          <path d="M66 43 Q71 40 76 43" stroke={hair} strokeWidth={2.4} fill="none" strokeLinecap="round" />
        </>
      )}
      {/* 眼睛 */}
      {mood === 'happy' ? (
        <>
          <path d="M44 54 Q49 48 54 54" stroke={hair} strokeWidth={3} fill="none" strokeLinecap="round" />
          <path d="M66 54 Q71 48 76 54" stroke={hair} strokeWidth={3} fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx={49} cy={53} r={3.4} fill={hair} />
          <circle cx={71} cy={53} r={3.4} fill={hair} />
        </>
      )}
      <ellipse cx={42} cy={62} rx={5.5} ry={3} fill="#F2A397" opacity={0.6} />
      <ellipse cx={78} cy={62} rx={5.5} ry={3} fill="#F2A397" opacity={0.6} />
      {/* 嘴 */}
      {mood === 'happy' && <path d="M54 65 Q60 71 66 65" stroke="#8A4B3A" strokeWidth={2.4} fill="none" strokeLinecap="round" />}
      {mood === 'neutral' && <path d="M56 67 L64 67" stroke="#8A4B3A" strokeWidth={2.4} strokeLinecap="round" />}
      {mood === 'worried' && <ellipse cx={60} cy={68} rx={3.2} ry={2.6} fill="#8A4B3A" />}
      {mood === 'angry' && <path d="M54 69 Q60 64 66 69" stroke="#8A4B3A" strokeWidth={2.4} fill="none" strokeLinecap="round" />}
      {/* 胡子 */}
      {look.face === 'mustache' && (
        <path d="M60 63 Q54 59 48 63 Q45 66 42 62 M60 63 Q66 59 72 63 Q75 66 78 62" stroke={hair} strokeWidth={2.6} fill="none" strokeLinecap="round" />
      )}
      {(look.face === 'beard' || look.face === 'longbeard') && (
        <>
          <path d="M60 63 Q54 60 49 64 M60 63 Q66 60 71 64" stroke={hair} strokeWidth={2.4} fill="none" strokeLinecap="round" />
          <path d={look.face === 'longbeard' ? 'M52 72 Q60 104 68 72 Q60 78 52 72 Z' : 'M54 73 Q60 88 66 73 Q60 77 54 73 Z'} fill={hair} />
        </>
      )}
    </g>
  );
};

const Prop: React.FC<{prop: Look['prop']}> = ({prop}) => {
  if (prop === 'spear')
    return (
      <g>
        <rect x={90} y={24} width={4.5} height={110} rx={2} fill="#7A5634" />
        <path d="M92.2 2 L98.5 24 L92.2 31 L86 24 Z" fill="#D8DDE4" stroke="#8B939E" strokeWidth={1} />
        <path d="M85.5 31 Q92 38 99 31" stroke="#C9463D" strokeWidth={3.2} fill="none" strokeLinecap="round" />
      </g>
    );
  if (prop === 'scroll')
    return (
      <g>
        <rect x={42} y={98} width={36} height={16} rx={2} fill="#EAD7A6" stroke="#A88A55" strokeWidth={1.5} />
        {[48, 54, 60, 66, 72].map((x) => (
          <line key={x} x1={x} y1={100} x2={x} y2={112} stroke="#B89A65" strokeWidth={1.2} />
        ))}
      </g>
    );
  if (prop === 'sword')
    return (
      <g transform="rotate(-28 84 104)">
        <rect x={81} y={56} width={6} height={50} rx={1.5} fill="#D8DDE4" stroke="#8B939E" strokeWidth={1} />
        <rect x={75} y={104} width={18} height={5} rx={2} fill="#C9A45C" />
        <rect x={81} y={108} width={6} height={14} rx={2} fill="#5B3A23" />
      </g>
    );
  if (prop === 'fan')
    return (
      <g>
        <path d="M60 106 L44 78 Q60 70 76 78 Z" fill="#F4EEDF" stroke="#BFAF8E" strokeWidth={1.5} />
        <rect x={58} y={104} width={4} height={14} fill="#7A5634" />
      </g>
    );
  if (prop === 'brush')
    return (
      <g transform="rotate(20 60 100)">
        <rect x={58} y={76} width={5} height={34} fill="#7A5634" />
        <path d="M56 110 L65 110 L60.5 124 Z" fill="#2A2530" />
      </g>
    );
  return null;
};

/** 整个棋子（viewBox 120×160），脚底中心在 (60,146) */
export const FigureSvg: React.FC<{look: Look; mood?: Mood; base?: boolean; size?: number}> = ({look, mood, base = true, size = 120}) => {
  const robe = look.robe;
  const trim = shade(robe, -0.35);
  const baseCol = FACTION[look.faction ?? 'slate'];
  return (
    <svg width={size} height={(size * 160) / 120} viewBox="0 0 120 160" style={{overflow: 'visible', display: 'block'}}>
      {base && (
        <g>
          <ellipse cx={60} cy={147} rx={44} ry={12} fill="rgba(20,15,10,0.35)" transform="translate(4 4)" />
          <rect x={16} y={134} width={88} height={13} fill={baseCol.side} />
          <ellipse cx={60} cy={147} rx={44} ry={12} fill={baseCol.side} />
          <ellipse cx={60} cy={134} rx={44} ry={12} fill={shade(baseCol.side, 0.18)} stroke={shade(baseCol.side, 0.35)} strokeWidth={1.5} />
        </g>
      )}
      {/* 袍子 */}
      <path d="M36 84 Q60 76 84 84 L95 132 Q60 142 25 132 Z" fill={robe} stroke={trim} strokeWidth={2} />
      <path d="M27 124 Q60 133 93 124 L95 132 Q60 142 25 132 Z" fill={trim} />
      {/* 交领 */}
      <path d="M48 82 L66 110" stroke="#F7F1E4" strokeWidth={6} strokeLinecap="round" />
      <path d="M72 82 L59 101" stroke="#F7F1E4" strokeWidth={6} strokeLinecap="round" />
      <rect x={34} y={104} width={52} height={7} rx={2} fill={trim} />
      {/* 袖子和手 */}
      <ellipse cx={37} cy={104} rx={12} ry={17} fill={shade(robe, -0.12)} stroke={trim} strokeWidth={1.5} />
      <ellipse cx={83} cy={104} rx={12} ry={17} fill={shade(robe, -0.12)} stroke={trim} strokeWidth={1.5} />
      <Prop prop={look.prop} />
      <circle cx={47} cy={112} r={5.5} fill={(SKIN[look.skin ?? 'normal'] ?? SKIN.normal).fill} />
      <circle cx={73} cy={112} r={5.5} fill={(SKIN[look.skin ?? 'normal'] ?? SKIN.normal).fill} />
      <Head look={look} mood={mood} />
    </svg>
  );
};

/** 圆形头像（名牌、人物卡用） */
export const Avatar: React.FC<{look: Look; size: number; ring?: string; mood?: Mood}> = ({look, size, ring = C.white, mood = 'neutral'}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: '#F7EFE0',
      border: `${Math.max(3, size * 0.06)}px solid ${ring}`,
      overflow: 'hidden',
      boxShadow: '0 3px 8px rgba(0,0,0,0.3)',
      flexShrink: 0,
    }}
  >
    <svg width="100%" height="100%" viewBox="22 6 76 76">
      <Head look={look} mood={mood} />
      <path d="M24 82 Q60 64 96 82 Z" fill={look.robe} />
    </svg>
  </div>
);

/** 名牌：头像 + 名字胶囊 */
export const NamePill: React.FC<{name: string; look: Look; scale?: number}> = ({name, look, scale = 1}) => {
  const col = FACTION[look.faction ?? 'slate'];
  return (
    <div style={{display: 'flex', alignItems: 'center', transform: `scale(${scale})`, transformOrigin: '50% 0'}}>
      <div style={{position: 'relative', zIndex: 2}}>
        <Avatar look={look} size={50} />
      </div>
      <div
        style={{
          marginLeft: -16,
          padding: '4px 16px 5px 24px',
          borderRadius: 999,
          background: `linear-gradient(180deg, ${shade(col.pill, 0.12)}, ${col.pill})`,
          border: '2.5px solid #F4EBDA',
          color: C.white,
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 25,
          letterSpacing: 2,
          whiteSpace: 'nowrap',
          boxShadow: '0 3px 6px rgba(0,0,0,0.35)',
        }}
      >
        {name}
      </div>
    </div>
  );
};

/** 地名牌（白底圆角，像参考片里的“许县”） */
export const PlaceTag: React.FC<{text: string; tone?: 'light' | 'dark'}> = ({text, tone = 'light'}) => (
  <div
    style={{
      padding: '4px 14px 6px',
      borderRadius: 10,
      background: tone === 'light' ? 'linear-gradient(180deg,#FBF5E8,#E9DCC2)' : 'linear-gradient(180deg,#5A4636,#3B2D22)',
      border: `2px solid ${tone === 'light' ? '#9C8466' : '#C9A45C'}`,
      color: tone === 'light' ? C.ink : '#F3E4C4',
      fontFamily: BRUSH,
      fontSize: 34,
      whiteSpace: 'nowrap',
      boxShadow: '0 3px 6px rgba(0,0,0,0.3)',
    }}
  >
    {text}
  </div>
);
