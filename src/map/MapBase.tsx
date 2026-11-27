import React from 'react';
import {Img, staticFile} from 'remotion';
import {H, W, C} from '../theme';
import {SERIF} from '../fonts';
import {MAP, camScale, toMap, toScreen, type Cam} from './geo';

/** 地图容器：子元素用底图像素坐标，跟着镜头一起缩放平移 */
export const MapSpace: React.FC<{cam: Cam; children: React.ReactNode}> = ({cam, children}) => {
  const s = camScale(cam);
  const [cx, cy] = toMap(cam.c);
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: MAP.width,
        height: MAP.height,
        transformOrigin: '0 0',
        transform: `translate(${W / 2 - cx * s}px, ${H / 2 - cy * s}px) scale(${s})`,
      }}
    >
      {children}
    </div>
  );
};

/** 地形底图瓦片：只加载画面里看得见的那几块（dir = 'relief' 时是灰度明暗贴图） */
export const Terrain: React.FC<{cam: Cam; dir?: 'tiles' | 'relief'}> = ({cam, dir = 'tiles'}) => {
  const s = camScale(cam);
  const [cx, cy] = toMap(cam.c);
  const x0 = cx - W / 2 / s;
  const x1 = cx + W / 2 / s;
  const y0 = cy - H / 2 / s;
  const y1 = cy + H / 2 / s;
  const tiles: React.ReactNode[] = [];
  for (let r = 0; r < MAP.rows; r++) {
    for (let c = 0; c < MAP.cols; c++) {
      const tx = c * MAP.tile;
      const ty = r * MAP.tile;
      const tw = Math.min(MAP.tile, MAP.width - tx);
      const th = Math.min(MAP.tile, MAP.height - ty);
      if (tx > x1 || tx + tw < x0 || ty > y1 || ty + th < y0) continue;
      tiles.push(
        <Img
          key={`${r}_${c}`}
          src={staticFile(`map/${dir}/${r}_${c}.jpg`)}
          style={{position: 'absolute', left: tx, top: ty, width: tw + 1, height: th + 1}}
        />,
      );
    }
  }
  return <>{tiles}</>;
};

/** 山脉明暗：用“柔光”叠在势力格子上，格子里也看得见地形起伏 */
export const Relief: React.FC<{cam: Cam}> = ({cam}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: MAP.width, height: MAP.height, mixBlendMode: 'soft-light', opacity: 0.95}}>
    <Terrain cam={cam} dir="relief" />
  </div>
);

/** 河流和湖泊（矢量，放大也清楚）。画在势力格子上面，带一圈浅色描边，长江黄河在格子上也看得清 */
export const Hydro: React.FC = () => (
  <svg width={MAP.width} height={MAP.height} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
    {MAP.lakes.map((d, i) => (
      <path key={i} d={d} fill="#4F8BAD" stroke="rgba(246,238,218,0.75)" strokeWidth={2.2} vectorEffect="non-scaling-stroke" />
    ))}
    {MAP.rivers.map((r, i) => (
      <path
        key={`c${i}`}
        d={r.d}
        fill="none"
        stroke="rgba(246,238,218,0.55)"
        strokeWidth={r.w + 2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    ))}
    {MAP.rivers.map((r, i) => (
      <path
        key={i}
        d={r.d}
        fill="none"
        stroke="#5D93B8"
        strokeWidth={r.w}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.9}
        vectorEffect="non-scaling-stroke"
      />
    ))}
  </svg>
);

/** 州名（屏幕坐标，字号不随缩放变化） */
export const ProvinceLabels: React.FC<{cam: Cam; hide?: string[]; opacity?: number}> = ({cam, hide = [], opacity = 1}) => (
  <>
    {Object.entries(MAP.provinces).map(([name, p]) => {
      if (hide.includes(name)) return null;
      const [x, y] = toScreen(cam, p as [number, number]);
      if (x < -80 || x > W + 80 || y < -40 || y > H + 40) return null;
      return (
        <div
          key={name}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            transform: 'translate(-50%, -50%)',
            fontFamily: SERIF,
            fontWeight: 800,
            fontSize: 28,
            letterSpacing: 2,
            color: C.label,
            opacity: 0.8 * opacity,
            textShadow: '0 0 6px rgba(250,240,220,0.75), 0 0 2px rgba(250,240,220,0.9)',
            whiteSpace: 'nowrap',
          }}
        >
          {name}
        </div>
      );
    })}
  </>
);

/** 暗角 + 纸张颗粒，让画面有旧地图的质感 */
export const PaperOverlay: React.FC<{strength?: number}> = ({strength = 1}) => (
  <>
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, mixBlendMode: 'multiply', opacity: 0.28 * strength}}>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={3} />
        <feColorMatrix values="0 0 0 0 0.55  0 0 0 0 0.45  0 0 0 0 0.32  0 0 0 0.9 0" />
      </filter>
      <rect width={W} height={H} filter="url(#grain)" />
    </svg>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse 75% 70% at 50% 50%, rgba(0,0,0,0) 55%, rgba(48,30,12,${0.5 * strength}) 100%)`,
      }}
    />
  </>
);
