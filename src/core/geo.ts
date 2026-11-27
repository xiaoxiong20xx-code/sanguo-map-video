// 地图坐标换算（纯数学，画面和检查脚本共用）。底图是 z8 墨卡托，原点在底图左上角。
import type {LonLat} from './types.ts';

export type {LonLat};

export const W = 1920;
export const H = 1080;
export const MAP_Z = 8;
export const MAP_X0 = 49920;
export const MAP_Y0 = 23296;
export const MAP_W = 7168;
export const MAP_H = 6400;
/** 底图覆盖的经纬度范围 */
export const BOUNDS = {west: 95, east: 133, south: 17, north: 45.5};

const WORLD = 256 * 2 ** MAP_Z;
export const PX_PER_DEG = WORLD / 360;

/** 镜头：看向哪个经纬度，画面横向跨多少经度 */
export type Cam = {c: LonLat; span: number};

export const toMap = ([lon, lat]: LonLat): [number, number] => {
  const x = ((lon + 180) / 360) * WORLD - MAP_X0;
  const r = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * WORLD - MAP_Y0;
  return [x, y];
};

export const fromMap = ([x, y]: [number, number]): LonLat => {
  const lon = ((x + MAP_X0) / WORLD) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * (y + MAP_Y0)) / WORLD;
  const lat = (180 / Math.PI) * Math.atan(Math.sinh(n));
  return [lon, lat];
};

export const camScale = (cam: Cam) => W / (cam.span * PX_PER_DEG);

export const toScreen = (cam: Cam, [mx, my]: [number, number]): [number, number] => {
  const s = camScale(cam);
  const [cx, cy] = toMap(cam.c);
  return [(mx - cx) * s + W / 2, (my - cy) * s + H / 2];
};

export const lonLatToScreen = (cam: Cam, ll: LonLat) => toScreen(cam, toMap(ll));

export const lerpCam = (a: Cam, b: Cam, t: number): Cam => {
  // 缩放按对数插值，推近时速度均匀
  const span = Math.exp(Math.log(a.span) + (Math.log(b.span) - Math.log(a.span)) * t);
  return {c: [a.c[0] + (b.c[0] - a.c[0]) * t, a.c[1] + (b.c[1] - a.c[1]) * t], span};
};

export const inBounds = ([lon, lat]: LonLat) => lon >= BOUNDS.west && lon <= BOUNDS.east && lat >= BOUNDS.south && lat <= BOUNDS.north;
