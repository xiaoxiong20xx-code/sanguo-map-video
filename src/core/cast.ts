// 预置人物表：三国常见人物的 Q 版外观。内容文件里直接写名字就能用；表里没有的人在 video.ts 的 cast 里补。
import type {Color, Person, Video} from './types.ts';

/** 阵营色对应的默认袍子颜色 */
export const ROBE: Record<Color, string> = {
  blue: '#3A62A8',
  slate: '#6C6E98',
  gold: '#D2A040',
  brown: '#9C7448',
  dark: '#4A4646',
  purple: '#7B5A9C',
  green: '#4F8A4A',
  red: '#B8483C',
};

const p = (color: Color, hat: Person['hat'], face: Person['face'], prop: Person['prop'], extra: Partial<Person> = {}): Person => ({color, hat, face, prop, ...extra});
const LIGHT_BLUE = '#5B78A8';
const LIGHT_GREEN = '#6A9A5E';
const LIGHT_RED = '#C46A58';

/** 分组只为了生成文档好看；名字不能重复 */
export const PRESET_GROUPS: Record<string, Record<string, Person>> = {
  '曹魏（blue）': {
    曹操: p('blue', 'guan', 'mustache', 'sword'),
    曹丕: p('blue', 'guan', 'mustache', 'sword'),
    曹植: p('blue', 'bun', 'none', 'brush', {robe: LIGHT_BLUE}),
    曹叡: p('blue', 'crown', 'none', 'none'),
    曹仁: p('blue', 'helmet', 'beard', 'sword'),
    曹洪: p('blue', 'helmet', 'mustache', 'sword'),
    夏侯惇: p('blue', 'helmet', 'beard', 'sword'),
    夏侯渊: p('blue', 'helmet', 'mustache', 'spear'),
    张辽: p('blue', 'helmet', 'beard', 'spear'),
    许褚: p('blue', 'helmet', 'mustache', 'sword', {skin: 'dark'}),
    典韦: p('blue', 'helmet', 'beard', 'sword', {skin: 'dark'}),
    徐晃: p('blue', 'helmet', 'beard', 'spear'),
    张郃: p('blue', 'helmet', 'mustache', 'spear'),
    于禁: p('blue', 'helmet', 'beard', 'sword'),
    荀彧: p('blue', 'guan', 'none', 'scroll', {robe: LIGHT_BLUE}),
    荀攸: p('blue', 'guan', 'beard', 'scroll', {robe: LIGHT_BLUE}),
    郭嘉: p('blue', 'bun', 'none', 'fan', {robe: LIGHT_BLUE}),
    贾诩: p('blue', 'guan', 'longbeard', 'fan', {robe: LIGHT_BLUE}),
    程昱: p('blue', 'guan', 'longbeard', 'scroll', {robe: LIGHT_BLUE}),
    钟繇: p('blue', 'guan', 'beard', 'brush', {robe: LIGHT_BLUE}),
    陈群: p('blue', 'guan', 'mustache', 'scroll', {robe: LIGHT_BLUE}),
    司马懿: p('blue', 'guan', 'beard', 'fan', {robe: LIGHT_BLUE}),
  },
  '蜀汉（green）': {
    刘备: p('green', 'guan', 'mustache', 'sword'),
    关羽: p('green', 'guan', 'longbeard', 'spear', {skin: 'red'}),
    张飞: p('green', 'helmet', 'beard', 'spear', {skin: 'dark'}),
    诸葛亮: p('green', 'bun', 'mustache', 'fan', {robe: LIGHT_GREEN}),
    赵云: p('green', 'helmet', 'none', 'spear'),
    马超: p('green', 'helmet', 'none', 'spear'),
    黄忠: p('green', 'helmet', 'longbeard', 'sword'),
    魏延: p('green', 'helmet', 'beard', 'sword'),
    姜维: p('green', 'helmet', 'none', 'spear'),
    庞统: p('green', 'bun', 'mustache', 'fan', {robe: LIGHT_GREEN}),
    法正: p('green', 'guan', 'mustache', 'scroll', {robe: LIGHT_GREEN}),
    马谡: p('green', 'guan', 'mustache', 'scroll', {robe: LIGHT_GREEN}),
    蒋琬: p('green', 'guan', 'beard', 'scroll', {robe: LIGHT_GREEN}),
    费祎: p('green', 'guan', 'mustache', 'scroll', {robe: LIGHT_GREEN}),
    刘禅: p('green', 'crown', 'none', 'none'),
  },
  '孙吴（red）': {
    孙坚: p('red', 'helmet', 'beard', 'sword'),
    孙策: p('red', 'helmet', 'none', 'spear'),
    孙权: p('red', 'guan', 'beard', 'sword'),
    周瑜: p('red', 'guan', 'none', 'sword', {robe: LIGHT_RED}),
    鲁肃: p('red', 'guan', 'beard', 'scroll', {robe: LIGHT_RED}),
    吕蒙: p('red', 'helmet', 'mustache', 'sword'),
    陆逊: p('red', 'guan', 'none', 'sword', {robe: LIGHT_RED}),
    黄盖: p('red', 'helmet', 'longbeard', 'sword'),
    甘宁: p('red', 'helmet', 'mustache', 'sword'),
    太史慈: p('red', 'helmet', 'mustache', 'spear'),
    程普: p('red', 'helmet', 'beard', 'spear'),
    张昭: p('red', 'guan', 'longbeard', 'scroll', {robe: LIGHT_RED}),
    孙尚香: p('red', 'hairpin', 'none', 'sword'),
    大乔: p('red', 'hairpin', 'none', 'fan', {robe: LIGHT_RED}),
    小乔: p('red', 'hairpin', 'none', 'fan', {robe: LIGHT_RED}),
  },
  '袁氏（gold）': {
    袁绍: p('gold', 'guan', 'beard', 'sword'),
    袁术: p('gold', 'guan', 'mustache', 'sword'),
    颜良: p('gold', 'helmet', 'beard', 'sword'),
    文丑: p('gold', 'helmet', 'beard', 'spear'),
    田丰: p('gold', 'guan', 'longbeard', 'scroll'),
    沮授: p('gold', 'guan', 'beard', 'scroll'),
    审配: p('gold', 'guan', 'beard', 'scroll'),
    许攸: p('gold', 'guan', 'mustache', 'scroll'),
    张角: p('gold', 'bun', 'longbeard', 'sword'),
  },
  '董卓、吕布（dark）': {
    董卓: p('dark', 'guan', 'beard', 'sword'),
    吕布: p('dark', 'helmet', 'none', 'spear'),
    貂蝉: p('dark', 'hairpin', 'none', 'fan', {robe: '#B0567A'}),
    李傕: p('dark', 'helmet', 'beard', 'sword'),
    郭汜: p('dark', 'helmet', 'mustache', 'sword'),
    陈宫: p('dark', 'guan', 'beard', 'scroll', {robe: '#6A6464'}),
  },
  '各地诸侯（brown）': {
    刘表: p('brown', 'guan', 'beard', 'scroll'),
    刘璋: p('brown', 'guan', 'mustache', 'none'),
    张鲁: p('brown', 'guan', 'beard', 'scroll'),
    马腾: p('brown', 'helmet', 'beard', 'spear'),
    韩遂: p('brown', 'helmet', 'beard', 'sword'),
    公孙瓒: p('brown', 'helmet', 'mustache', 'spear'),
    陶谦: p('brown', 'guan', 'longbeard', 'none'),
    张绣: p('brown', 'helmet', 'none', 'spear'),
    孟获: p('brown', 'helmet', 'beard', 'spear', {skin: 'dark'}),
  },
  '汉室（purple）': {
    汉献帝: p('purple', 'crown', 'none', 'none'),
    汉灵帝: p('purple', 'crown', 'mustache', 'none'),
    何进: p('purple', 'guan', 'beard', 'sword'),
    王允: p('purple', 'guan', 'longbeard', 'scroll'),
    卢植: p('purple', 'guan', 'longbeard', 'scroll'),
    皇甫嵩: p('purple', 'helmet', 'beard', 'sword'),
  },
  '路人（不写名字的群像，可以直接用）': {
    士兵: p('slate', 'helmet', 'none', 'spear'),
    武将: p('slate', 'helmet', 'beard', 'sword'),
    谋士: p('slate', 'guan', 'beard', 'scroll'),
    文官: p('slate', 'guan', 'mustache', 'brush'),
    皇帝: p('purple', 'crown', 'none', 'none'),
    女子: p('slate', 'hairpin', 'none', 'none'),
    百姓: p('brown', 'bun', 'none', 'none'),
  },
};

export const PRESETS: Record<string, Person> = Object.assign({}, ...Object.values(PRESET_GROUPS));

/** 内容文件里的 cast 覆盖预置 */
export const castOf = (video: Pick<Video, 'cast'>): Record<string, Person> => ({...PRESETS, ...(video.cast ?? {})});

export const robeOf = (person: Person) => person.robe ?? ROBE[person.color] ?? ROBE.slate;
