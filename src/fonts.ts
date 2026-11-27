import {continueRender, delayRender, staticFile} from 'remotion';

/**
 * 字体都是 SIL OFL 开源可商用，打包在 public/fonts 里：
 * 马善政楷书（标题、字幕、人名）、思源宋体（地名、史料正文）
 */
export const BRUSH = '"Ma Shan Zheng", "STKaiti", "KaiTi", serif';
export const SERIF = '"Noto Serif SC", "SimSun", "Songti SC", serif';

let started = false;

export const ensureFonts = () => {
  if (started || typeof window === 'undefined' || typeof FontFace === 'undefined') return;
  started = true;
  const handle = delayRender('加载字体');
  const faces = [
    new FontFace('Ma Shan Zheng', `url(${staticFile('fonts/MaShanZheng-Regular.ttf')}) format('truetype')`),
    new FontFace('Noto Serif SC', `url(${staticFile('fonts/NotoSerifSC.ttf')}) format('truetype')`, {weight: '200 900'}),
  ];
  Promise.all(faces.map((f) => f.load().then((loaded) => document.fonts.add(loaded))))
    .catch((err) => console.warn('字体加载失败：', err))
    .finally(() => continueRender(handle));
};
