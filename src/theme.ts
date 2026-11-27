// 颜色都取自参考片的观感
export const W = 1920;
export const H = 1080;
export const FPS = 30;

export const C = {
  ink: '#2E2620',
  label: '#4E4134',
  paper: '#F3E7CF',
  paperEdge: '#8B6B4A',
  red: '#B3302A',
  redDark: '#7E1F1B',
  gold: '#D9A441',
  skin: '#F8DCC4',
  hair: '#1F1C22',
  white: '#FFFFFF',
};

/** 势力颜色：fill 格子顶面，side 侧面，line 格子内线 */
export const FACTION: Record<string, {fill: string; side: string; line: string; pill: string}> = {
  blue: {fill: '#3F66A9', side: '#26437A', line: '#5C82C2', pill: '#2D4F8F'},
  slate: {fill: '#6C6E98', side: '#474A6F', line: '#8587AF', pill: '#4F527C'},
  gold: {fill: '#D5A43F', side: '#9C7424', line: '#E4BC63', pill: '#A87A22'},
  brown: {fill: '#A27B4D', side: '#6E5131', line: '#B9946A', pill: '#7A5833'},
  dark: {fill: '#4D4848', side: '#2E2A2A', line: '#655F5F', pill: '#3A3535'},
  purple: {fill: '#7B5A9C', side: '#523A6C', line: '#9677B5', pill: '#6A4A8C'},
  green: {fill: '#5E8F52', side: '#3D6334', line: '#7AAA6D', pill: '#4A7A40'},
  red: {fill: '#B9503F', side: '#80322A', line: '#CF6F5D', pill: '#9A3A2E'},
};
