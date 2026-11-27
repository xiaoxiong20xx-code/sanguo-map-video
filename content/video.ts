import type {Video} from '../src/core/types.ts';

// 示例：三国合伙人·颍川士族（就是样片那条）。新视频照着这个格式写在 content/video.ts。
const video: Video = {
  title: '三国合伙人：颍川士族',
  seal: '频道',
  // 预置人物表（docs/人物表.md）里没有的人，在这里补外观
  cast: {
    荀氏: {color: 'slate', hat: 'guan', face: 'longbeard', prop: 'scroll'},
    陈氏: {color: 'slate', hat: 'guan', face: 'beard', prop: 'scroll'},
    钟氏: {color: 'slate', hat: 'guan', face: 'longbeard', prop: 'brush'},
    韩氏: {color: 'slate', hat: 'guan', face: 'beard', prop: 'scroll'},
  },
  scenes: [
    {
      type: 'map',
      script: '曹操能平定北方，靠的不只是刀枪，还有一笔看不见的天使投资。',
      territories: [
        {regions: ['冀州', '青州', '幽州', '并州'], color: 'gold'},
        {regions: ['兖州'], color: 'blue', appear: '曹操'},
        {regions: ['豫州', '司隶'], around: {at: '颍川', radius: 0.95}, color: 'slate', appear: '看不见'},
      ],
      items: [
        {type: 'figure', who: '袁绍', at: '邺'},
        {type: 'figure', who: '曹操', at: '东郡', when: '曹操', mark: {kind: '?', when: '刀枪'}},
        {type: 'stamp', text: '天使投资', at: '颍川', when: '天使投资'},
      ],
      camera: {center: '许', span: 20},
    },
    {
      type: 'title',
      script: '今天咱们聊聊，三国第一大股东：颍川士族。',
      title: '三国合伙人',
      tag: '第一期 · 颍川士族',
      cast: ['荀彧', '曹操', '汉献帝'],
    },
    {
      type: 'map',
      script: '东汉的颍川郡，就是当时的人才交易所。荀、陈、钟、韩四大家族世代读书做官，号称颍川四长，门生故吏遍布朝廷。',
      territories: [
        {regions: ['冀州', '青州', '幽州', '并州'], color: 'gold'},
        {regions: ['兖州'], color: 'blue'},
        {regions: ['豫州', '司隶'], around: {at: '颍川', radius: 0.95}, color: 'slate', appear: '颍川郡'},
      ],
      items: [
        {type: 'city', at: [112.75, 34.55], label: '颍川郡', when: '颍川郡'},
        {type: 'figure', who: '荀氏', at: '颍川', when: '荀'},
        {type: 'figure', who: '陈氏', at: '颍川', when: '陈'},
        {type: 'figure', who: '钟氏', at: '颍川', when: '钟'},
        {type: 'figure', who: '韩氏', at: '颍川', when: '韩', mark: {kind: '…', when: '门生故吏'}},
        {type: 'stamp', text: '世家', at: [112.55, 33.6], when: '世代'},
        {type: 'stamp', text: '四长', at: [114.45, 34.75], when: '四长'},
      ],
      banner: {text: '人才交易所', style: 'slate', when: '人才交易所'},
    },
    {
      type: 'map',
      script: '公元191年，荀彧看透了袁绍，转身投奔还只是东郡太守的曹操。',
      items: [
        {type: 'figure', who: '袁绍', at: '邺', cross: '看透', moodAfter: {mood: 'worried', when: '看透'}},
        {type: 'figure', who: '荀彧', at: '邺', moveTo: {at: '东郡', when: '投奔', arrow: true}},
        {type: 'figure', who: '曹操', at: '东郡'},
        {type: 'label', text: '东郡', at: [115.05, 35.2], when: '东郡'},
      ],
      year: {year: '公元191年', era: '初平二年'},
      person: {who: '荀彧', zi: '字文若', line: '颍川颍阴人 · 首席谋士', source: '《三国志·荀彧传》', when: '荀彧'},
    },
    {
      type: 'map',
      script: '曹操大喜过望：吾之子房也！这是我的张良啊。',
      items: [
        {type: 'figure', who: '袁绍', at: '邺', mood: 'worried'},
        {type: 'figure', who: '荀彧', at: '东郡'},
        {type: 'figure', who: '曹操', at: '东郡', mark: {kind: '!', when: '大喜过望'}},
        {type: 'stamp', text: '张良', at: [115.9, 36.75], when: '张良'},
      ],
      source: {book: '《三国志·魏书十·荀彧传》', date: '初平二年（公元191年）', quote: '彧去绍从太祖。【太祖大悦曰：“吾之子房也。”】以为司马，时年二十九。', when: '曹操'},
    },
    {
      type: 'map',
      script: '可荀彧带来的不只是他自己，而是一整套班底：郭嘉出谋划策，钟繇镇守关中，陈群制定法度。',
      territories: [
        {regions: ['冀州', '青州', '幽州', '并州'], color: 'gold'},
        {regions: ['兖州'], color: 'blue'},
        {regions: ['豫州', '司隶'], around: {at: '颍川', radius: 0.95}, color: 'slate', recolor: {color: 'blue', when: '一整套班底', from: '颍川'}},
      ],
      items: [
        {type: 'figure', who: '荀彧', at: '东郡'},
        {type: 'figure', who: '曹操', at: '东郡'},
        {type: 'figure', who: '郭嘉', at: '颍川', moveTo: {at: '东郡', when: '郭嘉'}},
        {type: 'figure', who: '钟繇', at: '颍川', moveTo: {at: '东郡', when: '钟繇'}},
        {type: 'figure', who: '陈群', at: '颍川', moveTo: {at: '东郡', when: '陈群'}},
        {type: 'stamp', text: '入股', at: [117.0, 36.2], when: '带来的'},
        {type: 'stamp', text: '重组', at: [117.2, 35.1], when: '不只是'},
      ],
      banner: {text: '人才入股 · 一次到位', style: 'red', when: '一整套班底'},
    },
    {
      type: 'map',
      script: '公元196年，曹操迎汉献帝到许县，改名许都。颍川士族坐镇尚书台，替他管起了整个朝廷。',
      territories: [
        {regions: ['冀州', '青州', '幽州', '并州'], color: 'gold'},
        {regions: ['兖州', '豫州'], color: 'blue'},
      ],
      items: [
        {type: 'city', at: '洛阳', label: '洛阳', size: 'small'},
        {type: 'figure', who: '汉献帝', at: '洛阳', moveTo: {at: '许', when: '迎汉献帝'}},
        {type: 'figure', who: '曹操', at: '许'},
        {type: 'label', text: '许县', at: [113.85, 34.45], when: '许县', swap: {text: '许都', when: '改名许都'}},
        {type: 'city', at: [113.1, 33.55], label: '尚书台', size: 'small', when: '尚书台'},
        {type: 'figure', who: '荀彧', at: [113.6, 33.5], when: '颍川士族'},
        {type: 'figure', who: '陈群', at: [114.05, 33.5], when: '坐镇'},
      ],
      year: {year: '公元196年', era: '建安元年'},
    },
    {
      type: 'balance',
      script: '曹操握着枪杆子，士族握着笔杆子，谁也离不开谁。',
      left: {who: '曹操', label: '枪杆子', when: '曹操'},
      right: {who: '荀彧', label: '笔杆子', when: '士族'},
      banner: {text: '枪杆子 + 笔杆子', style: 'black'},
    },
    {
      type: 'map',
      script: '靠着这套班底，曹操官渡击败袁绍，一路拿下了整个北方。',
      territories: [
        {regions: ['兖州', '豫州', '徐州', '司隶'], color: 'blue'},
        {regions: ['冀州', '青州', '幽州', '并州'], color: 'gold', recolor: {color: 'blue', when: '一路拿下', from: '官渡'}},
      ],
      items: [
        {type: 'battle', at: '官渡', when: '官渡'},
        {type: 'figure', who: '曹操', at: '官渡'},
        {type: 'figure', who: '袁绍', at: '邺', cross: '击败', moodAfter: {mood: 'worried', when: '击败'}},
      ],
    },
    {
      type: 'map',
      script: '可生意做大了，股东之间迟早要算账。咱们下期接着聊。',
      territories: [
        {regions: ['兖州', '豫州', '徐州', '司隶', '冀州', '青州', '幽州', '并州'], color: 'blue'},
        {regions: ['豫州', '司隶'], around: {at: '颍川', radius: 0.95}, color: 'slate', recolor: {color: 'dark', when: '股东'}},
      ],
      items: [
        {type: 'figure', who: '曹操', at: '东郡', mood: 'neutral', moodAfter: {mood: 'angry', when: '股东'}},
        {type: 'figure', who: '荀彧', at: '颍川', mood: 'neutral', mark: {kind: '?', when: '算账'}, moodAfter: {mood: 'worried', when: '股东'}},
      ],
      banner: {text: '股东算账', style: 'red'},
    },
  ],
};

export default video;
