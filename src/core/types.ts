/**
 * 内容文件 content/video.ts 的格式（AI 只需要写这一个文件）。
 * 每个字段的中文说明、取值和字数上限见 docs/积木说明.md。
 */

export type LonLat = [number, number];
/** 地点：地名表里的名字（docs/地名表.md，例如 '洛阳'、'官渡'、'冀州'），或者 [经度, 纬度] */
export type Place = string | LonLat;
/**
 * 时机：说到这一段口播里的哪个词时发生。必须从这一段 script 里原样摘（2~4 个字最好）。
 * 同一个词在这段里出现多次时，写 '颍川#2' 表示第 2 次出现的那个。
 */
export type When = string;

/** 势力颜色（名牌、底座、袍子、版图格子） */
export type Color = 'blue' | 'gold' | 'slate' | 'brown' | 'dark' | 'purple' | 'green' | 'red';
export type Mood = 'happy' | 'neutral' | 'worried' | 'angry';
/** 东汉十三州 */
export type Region = '司隶' | '豫州' | '兖州' | '徐州' | '青州' | '冀州' | '幽州' | '并州' | '凉州' | '益州' | '荆州' | '扬州' | '交州';
export type BannerStyle = 'slate' | 'red' | 'black' | 'purple' | 'wood';

/** 人物外观（预置人物表里没有的人才需要写） */
export type Person = {
  color: Color;
  hat?: 'guan' | 'crown' | 'bun' | 'helmet' | 'hairpin' | 'none';
  face?: 'none' | 'mustache' | 'beard' | 'longbeard';
  prop?: 'none' | 'scroll' | 'sword' | 'fan' | 'brush' | 'spear';
  skin?: 'normal' | 'red' | 'dark';
  /** 袍子颜色，例如 '#3A62A8'；不写就按 color 自动配 */
  robe?: string;
};

/** 一块势力版图（一组六边形格子） */
export type Territory = {
  /** 用哪几个州拼 */
  regions?: Region[];
  /** 以某地为中心、半径几度的一圈（和 regions 一起写 = 只取这几个州里的那一圈） */
  around?: {at: Place; radius: number};
  color: Color;
  /** 说到这个词时，格子一块块飞进来拼合（不写 = 一开始就在） */
  appear?: When;
  /** 说到这个词时，整块版图换颜色（从 from 那个地方像潮水一样推过去） */
  recolor?: {color: Color; when: When; from?: Place};
};

export type FigureItem = {
  type: 'figure';
  who: string;
  at: Place;
  /** 说到这个词时弹出来（不写 = 一开始就在） */
  when?: When;
  mood?: Mood;
  /** 头顶冒出 ？ ！ … */
  mark?: {kind: '?' | '!' | '…'; when: When};
  /** 说到某个词时，一跳一跳走到另一个地方；arrow: true 同时画红色虚线箭头 */
  moveTo?: {at: Place; when: When; arrow?: boolean};
  /** 说到这个词时打上红叉 */
  cross?: When;
  /** 说到这个词时换表情 */
  moodAfter?: {mood: Mood; when: When};
};
export type CityItem = {type: 'city'; at: Place; label?: string; when?: When; size?: 'big' | 'small'};
export type LabelItem = {type: 'label'; at: Place; text: string; when?: When; swap?: {text: string; when: When}; dark?: boolean};
export type StampItem = {type: 'stamp'; at: Place; text: string; when: When; angle?: number};
export type ArrowItem = {type: 'arrow'; from: Place; to: Place; when: When};
export type BattleItem = {type: 'battle'; at: Place; when: When};
export type MapItem = FigureItem | CityItem | LabelItem | StampItem | ArrowItem | BattleItem;

export type Banner = {text: string; style?: BannerStyle; when?: When};

export type MapScene = {
  type: 'map';
  script: string;
  /** 不写 = 沿用上一段地图的版图（换色之后的样子） */
  territories?: Territory[];
  items?: MapItem[];
  banner?: Banner;
  year?: {year: string; era?: string; when?: When};
  person?: {who: string; zi?: string; line: string; source?: string; when?: When};
  source?: {book: string; date?: string; quote: string; when?: When};
  /** 一般不用写，镜头会自动对准这一段的人物和标记 */
  camera?: {center?: Place; span?: number};
};
export type TitleScene = {type: 'title'; script: string; title: string; tag?: string; cast?: string[]};
export type BalanceScene = {
  type: 'balance';
  script: string;
  left: {who: string; label: string; when?: When};
  right: {who: string; label: string; when?: When};
  banner?: Banner;
};
export type ListScene = {
  type: 'list';
  script: string;
  title: string;
  style?: BannerStyle;
  points: {text: string; who?: string; when: When}[];
};
export type Scene = MapScene | TitleScene | BalanceScene | ListScene;

export type Video = {
  title: string;
  /** 右上角竖排红色印章（频道名，1~5 个字） */
  seal?: string;
  voice?: {name?: string; rate?: string};
  /** 配音读法：{'原文': '读法'}，只影响声音，不影响字幕 */
  readAs?: Record<string, string>;
  /** 预置人物表里没有的人物 */
  cast?: Record<string, Person>;
  scenes: Scene[];
};
