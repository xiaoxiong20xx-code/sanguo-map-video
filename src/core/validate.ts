// 检查 content/video.ts 写得对不对。错误信息写成能直接发给 AI 的中文修改要求。
import type {Color, MapItem, Place, Scene, Video, When} from './types.ts';
import {cleanScript, speakable, textWidthEm} from './text.ts';
import {inBounds} from './geo.ts';
import {lookupPlace, similarPlaces} from './places.ts';
import {castOf} from './cast.ts';
import {findWhen} from './plan.ts';

export const SCENE_TYPES: Scene['type'][] = ['map', 'title', 'balance', 'list'];
export const COLORS: Color[] = ['blue', 'gold', 'slate', 'brown', 'dark', 'purple', 'green', 'red'];
export const REGIONS = ['司隶', '豫州', '兖州', '徐州', '青州', '冀州', '幽州', '并州', '凉州', '益州', '荆州', '扬州', '交州'];
const BANNER_STYLES = ['slate', 'red', 'black', 'purple', 'wood'];
const MOODS = ['happy', 'neutral', 'worried', 'angry'];
const MARKS = ['?', '!', '…'];
const HATS = ['guan', 'crown', 'bun', 'helmet', 'hairpin', 'none'];
const FACES = ['none', 'mustache', 'beard', 'longbeard'];
const PROPS = ['none', 'scroll', 'sword', 'fan', 'brush', 'spear'];
const SKINS = ['normal', 'red', 'dark'];
const ITEM_TYPES = ['figure', 'city', 'label', 'stamp', 'arrow', 'battle'];

/** 文字上限（按字宽算，1 个汉字 = 1） */
export const LIMITS = {
  banner: 10,
  stamp: 4,
  label: 6,
  cityLabel: 5,
  year: 8,
  era: 6,
  personLine: 18,
  zi: 5,
  book: 16,
  date: 16,
  quote: 52,
  title: 7,
  tag: 14,
  balanceLabel: 5,
  listTitle: 10,
  point: 12,
  seal: 5,
};

export const normalizeCopy = (s: string) => cleanScript(s).replace(/\s+/g, '');

export const validateVideo = (video: Video, originalCopy?: string) => {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!video || typeof video !== 'object') return {errors: ['文件里没有导出视频内容（最后一行要有 export default video;）'], warnings};
  if (!video.title || typeof video.title !== 'string') errors.push('缺少 title（视频标题）');
  if (video.seal !== undefined && (typeof video.seal !== 'string' || textWidthEm(video.seal) > LIMITS.seal)) errors.push(`seal（印章）要写 1~${LIMITS.seal} 个字`);
  if (video.readAs !== undefined && (typeof video.readAs !== 'object' || Object.values(video.readAs).some((v) => typeof v !== 'string')))
    errors.push("readAs 要写成 {'原文': '读法'} 这样");
  if (!Array.isArray(video.scenes) || video.scenes.length === 0) {
    errors.push('scenes 是空的，至少要有一段');
    return {errors, warnings};
  }

  // 自定义人物
  for (const [name, p] of Object.entries(video.cast ?? {})) {
    const w = `cast 里的“${name}”`;
    if (!p || typeof p !== 'object') {
      errors.push(`${w}要写成 {color: 'blue', hat: 'guan', face: 'beard', prop: 'scroll'} 这样`);
      continue;
    }
    if (!COLORS.includes(p.color)) errors.push(`${w}：color 必须是 ${COLORS.join(' / ')} 之一`);
    if (p.hat !== undefined && !HATS.includes(p.hat)) errors.push(`${w}：hat 必须是 ${HATS.join(' / ')} 之一`);
    if (p.face !== undefined && !FACES.includes(p.face)) errors.push(`${w}：face 必须是 ${FACES.join(' / ')} 之一`);
    if (p.prop !== undefined && !PROPS.includes(p.prop)) errors.push(`${w}：prop 必须是 ${PROPS.join(' / ')} 之一`);
    if (p.skin !== undefined && !SKINS.includes(p.skin)) errors.push(`${w}：skin 必须是 ${SKINS.join(' / ')} 之一`);
    if (p.robe !== undefined && !/^#[0-9a-fA-F]{6}$/.test(p.robe)) errors.push(`${w}：robe 要写成 '#3A62A8' 这样的颜色`);
    if (textWidthEm(name) > 5) errors.push(`${w}：名字最多 5 个字（名牌放不下）`);
  }
  const cast = castOf(video);

  let cards = 0;
  video.scenes.forEach((scene, i) => {
    const where = `第 ${i + 1} 段（${scene?.type ?? '未知类型'}）`;
    if (!scene || !SCENE_TYPES.includes(scene.type)) {
      errors.push(`${where}：type 必须是 ${SCENE_TYPES.join(' / ')} 之一`);
      return;
    }
    if (!scene.script || typeof scene.script !== 'string' || !speakable(cleanScript(scene.script))) {
      errors.push(`${where}：缺少 script（这一段的口播原文）`);
      return;
    }
    if (scene.type !== 'map') cards++;
    const sec = speakable(cleanScript(scene.script)).length / 5.3;
    if (sec > 14) warnings.push(`${where}：这一段口播约 ${sec.toFixed(0)} 秒，太长了画面会单调，建议拆成两段`);

    const need = (v: unknown, field: string) => {
      if (v === undefined || v === null || v === '') {
        errors.push(`${where}：缺少 ${field}`);
        return false;
      }
      return true;
    };
    const text = (v: unknown, field: string, max: number, required = true) => {
      if (v === undefined || v === null || v === '') {
        if (required) errors.push(`${where}：缺少 ${field}`);
        return;
      }
      if (typeof v !== 'string') errors.push(`${where}：${field} 要写成文字（带引号）`);
      else if (textWidthEm(v) > max) errors.push(`${where}：${field}“${v}”太长了，最多 ${max} 个字`);
    };
    const when = (w: When | undefined, field: string, required = false) => {
      if (w === undefined || w === null || w === '') {
        if (required) errors.push(`${where}：缺少 ${field}（从这一段 script 里原样摘一个词，说到这个词时画面动作发生）`);
        return;
      }
      if (typeof w !== 'string') {
        errors.push(`${where}：${field} 要写成这一段口播里的一个词（带引号）`);
        return;
      }
      if (findWhen(scene.script, w) < 0) {
        const nth = w.match(/#(\d+)$/);
        errors.push(
          nth
            ? `${where}：${field} 写的“${w}”——这个词在这一段口播里没有出现 ${nth[1]} 次`
            : `${where}：${field} 写的“${w}”在这一段的口播里找不到。必须从这一段 script 里原样摘一个词（2~4 个字），不能改字、不能用别的段的词`,
        );
      }
    };
    const place = (p: Place | undefined, field: string) => {
      if (p === undefined) {
        errors.push(`${where}：缺少 ${field}（地名或 [经度, 纬度]）`);
        return;
      }
      const ll = lookupPlace(p);
      if (!ll) {
        if (typeof p === 'string') {
          const sim = similarPlaces(p);
          errors.push(`${where}：${field} 的地名“${p}”不在地名表里${sim.length ? `（相近的有：${sim.join('、')}）` : ''}。请换成 docs/地名表.md 里的地名，或者直接写 [经度, 纬度]，例如 [113.6, 34.7]`);
        } else errors.push(`${where}：${field} 要写成地名或 [经度, 纬度]`);
        return;
      }
      if (!inBounds(ll)) errors.push(`${where}：${field} 的位置 [${ll.join(', ')}] 不在地图范围内（经度 95~133，纬度 17~45.5）`);
    };
    const who = (name: unknown, field: string) => {
      if (!need(name, field)) return;
      if (typeof name !== 'string' || !cast[name])
        errors.push(`${where}：${field}“${String(name)}”不在人物表里。预置人物见 docs/人物表.md；新人物请在 cast 里加一行，例如 ${String(name)}: {color: 'blue', hat: 'guan', face: 'beard', prop: 'scroll'}`);
    };
    const color = (c: unknown, field: string) => {
      if (!COLORS.includes(c as Color)) errors.push(`${where}：${field} 必须是 ${COLORS.join(' / ')} 之一`);
    };
    const banner = (b: {text: string; style?: string; when?: When} | undefined, field = 'banner') => {
      if (!b) return;
      text(b.text, `${field}.text`, LIMITS.banner);
      if (b.style !== undefined && !BANNER_STYLES.includes(b.style)) errors.push(`${where}：${field}.style 必须是 ${BANNER_STYLES.join(' / ')} 之一`);
      when(b.when, `${field}.when`);
    };

    if (scene.type === 'title') {
      text(scene.title, 'title', LIMITS.title);
      text(scene.tag, 'tag', LIMITS.tag, false);
      if (scene.cast !== undefined) {
        if (!Array.isArray(scene.cast) || scene.cast.length > 3) errors.push(`${where}：cast 写 1~3 个人名，例如 ['曹操', '刘备', '孙权']`);
        else scene.cast.forEach((n, k) => who(n, `cast[${k}]`));
      }
      return;
    }
    if (scene.type === 'balance') {
      for (const side of ['left', 'right'] as const) {
        const s = scene[side];
        if (!s || typeof s !== 'object') {
          errors.push(`${where}：缺少 ${side}（{who: '人名', label: '两三个字'}）`);
          continue;
        }
        who(s.who, `${side}.who`);
        text(s.label, `${side}.label`, LIMITS.balanceLabel);
        when(s.when, `${side}.when`);
      }
      banner(scene.banner);
      return;
    }
    if (scene.type === 'list') {
      text(scene.title, 'title', LIMITS.listTitle);
      if (scene.style !== undefined && !BANNER_STYLES.includes(scene.style)) errors.push(`${where}：style 必须是 ${BANNER_STYLES.join(' / ')} 之一`);
      if (!Array.isArray(scene.points) || scene.points.length < 2 || scene.points.length > 4) errors.push(`${where}：points 要写 2~4 条`);
      else
        scene.points.forEach((pt, k) => {
          text(pt?.text, `points[${k}].text`, LIMITS.point);
          if (pt?.who !== undefined) who(pt.who, `points[${k}].who`);
          when(pt?.when, `points[${k}].when`, true);
        });
      return;
    }

    // ---------- map ----------
    if (scene.territories !== undefined) {
      if (!Array.isArray(scene.territories)) errors.push(`${where}：territories 要写成数组 [...]`);
      else
        scene.territories.forEach((t, k) => {
          const f = `territories[${k}]`;
          if (!t || typeof t !== 'object') return errors.push(`${where}：${f} 写法不对`);
          if (!t.regions && !t.around) errors.push(`${where}：${f} 要写 regions（哪几个州）或 around（某地周围一圈）`);
          if (t.regions !== undefined) {
            if (!Array.isArray(t.regions) || !t.regions.length) errors.push(`${where}：${f}.regions 要写成 ['冀州', '青州'] 这样`);
            else t.regions.forEach((r) => !REGIONS.includes(r) && errors.push(`${where}：${f}.regions 里的“${r}”不是东汉十三州（${REGIONS.join('、')}）`));
          }
          if (t.around !== undefined) {
            place(t.around?.at, `${f}.around.at`);
            if (typeof t.around?.radius !== 'number' || t.around.radius < 0.3 || t.around.radius > 6) errors.push(`${where}：${f}.around.radius 是半径几度，写 0.3~6 之间的数字`);
          }
          color(t.color, `${f}.color`);
          when(t.appear, `${f}.appear`);
          if (t.recolor !== undefined) {
            color(t.recolor?.color, `${f}.recolor.color`);
            when(t.recolor?.when, `${f}.recolor.when`, true);
            if (t.recolor?.from !== undefined) place(t.recolor.from, `${f}.recolor.from`);
          }
        });
    } else if (!video.scenes.slice(0, i).some((s) => s.type === 'map' && s.territories)) {
      warnings.push(`${where}：没写 territories，前面也没有地图段写过，地图上就没有势力版图`);
    }

    const items = scene.items ?? [];
    if (!Array.isArray(items)) errors.push(`${where}：items 要写成数组 [...]`);
    else
      items.forEach((it: MapItem, k) => {
        const f = `items[${k}]`;
        if (!it || !ITEM_TYPES.includes(it.type)) return errors.push(`${where}：${f}.type 必须是 ${ITEM_TYPES.join(' / ')} 之一`);
        switch (it.type) {
          case 'figure':
            who(it.who, `${f}.who`);
            place(it.at, `${f}.at`);
            when(it.when, `${f}.when`);
            if (it.mood !== undefined && !MOODS.includes(it.mood)) errors.push(`${where}：${f}.mood 必须是 ${MOODS.join(' / ')} 之一`);
            if (it.mark !== undefined) {
              if (!MARKS.includes(it.mark?.kind)) errors.push(`${where}：${f}.mark.kind 必须是 '?' / '!' / '…' 之一`);
              when(it.mark?.when, `${f}.mark.when`, true);
            }
            if (it.moveTo !== undefined) {
              place(it.moveTo?.at, `${f}.moveTo.at`);
              when(it.moveTo?.when, `${f}.moveTo.when`, true);
            }
            when(it.cross, `${f}.cross`);
            if (it.moodAfter !== undefined) {
              if (!MOODS.includes(it.moodAfter?.mood)) errors.push(`${where}：${f}.moodAfter.mood 必须是 ${MOODS.join(' / ')} 之一`);
              when(it.moodAfter?.when, `${f}.moodAfter.when`, true);
            }
            break;
          case 'city':
            place(it.at, `${f}.at`);
            text(it.label, `${f}.label`, LIMITS.cityLabel, false);
            when(it.when, `${f}.when`);
            if (it.size !== undefined && !['big', 'small'].includes(it.size)) errors.push(`${where}：${f}.size 写 'big' 或 'small'`);
            break;
          case 'label':
            place(it.at, `${f}.at`);
            text(it.text, `${f}.text`, LIMITS.label);
            when(it.when, `${f}.when`);
            if (it.swap !== undefined) {
              text(it.swap?.text, `${f}.swap.text`, LIMITS.label);
              when(it.swap?.when, `${f}.swap.when`, true);
            }
            break;
          case 'stamp':
            place(it.at, `${f}.at`);
            text(it.text, `${f}.text`, LIMITS.stamp);
            when(it.when, `${f}.when`, true);
            break;
          case 'arrow':
            place(it.from, `${f}.from`);
            place(it.to, `${f}.to`);
            when(it.when, `${f}.when`, true);
            break;
          case 'battle':
            place(it.at, `${f}.at`);
            when(it.when, `${f}.when`, true);
            break;
        }
      });

    banner(scene.banner);
    if (scene.year !== undefined) {
      text(scene.year?.year, 'year.year', LIMITS.year);
      text(scene.year?.era, 'year.era', LIMITS.era, false);
      when(scene.year?.when, 'year.when');
    }
    if (scene.person !== undefined) {
      who(scene.person?.who, 'person.who');
      text(scene.person?.zi, 'person.zi', LIMITS.zi, false);
      text(scene.person?.line, 'person.line', LIMITS.personLine);
      text(scene.person?.source, 'person.source', LIMITS.book, false);
      when(scene.person?.when, 'person.when');
    }
    if (scene.source !== undefined) {
      text(scene.source?.book, 'source.book', LIMITS.book);
      text(scene.source?.date, 'source.date', LIMITS.date, false);
      text(scene.source?.quote, 'source.quote', LIMITS.quote);
      when(scene.source?.when, 'source.when');
      if (typeof scene.source?.quote === 'string' && !/【[^】]+】/.test(scene.source.quote)) warnings.push(`${where}：source.quote 里没有用【】标出重点，史料卡就没有红线划重点`);
    }
    if (scene.person && scene.source) errors.push(`${where}：person（左侧人物卡）和 source（右侧史料卡）同一段只能用一个，地图会被挡住`);
    if (scene.camera !== undefined) {
      if (scene.camera.center !== undefined) place(scene.camera.center, 'camera.center');
      if (scene.camera.span !== undefined && (typeof scene.camera.span !== 'number' || scene.camera.span < 5.5 || scene.camera.span > 34))
        errors.push(`${where}：camera.span 是画面横向跨几度经度，写 5.5（一个郡）~ 34（全国）之间的数字`);
    }
    const timed = items.filter((it) => it && ('when' in it ? it.when : false)).length + (scene.territories ?? []).filter((t) => t?.appear || t?.recolor).length;
    if (!items.length && !(scene.territories ?? []).some((t) => t?.appear || t?.recolor)) warnings.push(`${where}：地图上什么都没有（没有人物、标记，版图也没变化），画面会是静止的`);
    else if (sec > 6 && timed < 2) warnings.push(`${where}：约 ${sec.toFixed(0)} 秒只有 ${timed} 个跟着口播出现的动作，建议给人物 / 红印 / 箭头多加几个 when`);
  });

  if (cards > video.scenes.length / 2) warnings.push(`地图以外的卡片段（title / balance / list）有 ${cards} 段，超过一半了，看起来会像 PPT；能在地图上演示的尽量用 map`);

  if (originalCopy) {
    const joined = normalizeCopy(video.scenes.map((s) => s?.script ?? '').join(''));
    const orig = normalizeCopy(originalCopy);
    if (joined !== orig) {
      let k = 0;
      while (k < joined.length && k < orig.length && joined[k] === orig[k]) k++;
      const ctx = (s: string) => s.slice(Math.max(0, k - 8), k + 12);
      errors.push(
        `所有段的 script 连起来必须和 口播文案.txt 一字不差（标点也不能改）。从第 ${k + 1} 个字开始不一样：\n     原文案：…${ctx(orig)}…\n     video.ts：…${ctx(joined)}…`,
      );
    }
  }
  return {errors, warnings};
};
