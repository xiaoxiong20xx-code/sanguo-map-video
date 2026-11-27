import type {Video} from '../../src/core/types.ts';

// 示例：官渡之战（演示行军箭头、交战、投奔、夜袭、版图换色、要点清单的写法）
//
// 原文案：
//   公元200年，北方只剩两个玩家：袁绍和曹操。袁绍坐拥四个州，兵力十万；曹操只有兖州、豫州，兵不到两万。
//   袁绍大军南下，先派颜良围攻白马。曹操声东击西，关羽阵前斩杀颜良，白马之围就解了。
//   两军最后在官渡对峙，曹操粮草快撑不住了。这时候，袁绍的谋士许攸跑来投奔，带来一个情报：袁军的粮仓，就在乌巢。
//   曹操亲自带五千人夜袭乌巢，一把火烧光了袁军的粮草。袁军军心大乱，十万大军一夜崩盘。
//   袁绍输在三点：犹豫不决，内部争斗，后方被烧。官渡之后，北方再也没人能挡住曹操。
const video: Video = {
  title: '官渡之战',
  seal: '频道',
  scenes: [
    {
      type: 'map',
      script: '公元200年，北方只剩两个玩家：袁绍和曹操。',
      territories: [
        {regions: ['冀州', '青州', '幽州', '并州'], color: 'gold', appear: '袁绍'},
        {regions: ['兖州', '豫州'], color: 'blue', appear: '曹操'},
      ],
      items: [
        {type: 'figure', who: '袁绍', at: '邺', when: '袁绍'},
        {type: 'figure', who: '曹操', at: '许', when: '曹操'},
      ],
      year: {year: '公元200年', era: '建安五年'},
      banner: {text: '北方决赛', style: 'red', when: '两个玩家'},
    },
    {
      type: 'map',
      script: '袁绍坐拥四个州，兵力十万；曹操只有兖州、豫州，兵不到两万。',
      items: [
        {type: 'figure', who: '袁绍', at: '邺', mark: {kind: '!', when: '坐拥'}},
        {type: 'stamp', text: '十万', at: [116.2, 37.6], when: '兵力十万'},
        {type: 'figure', who: '曹操', at: '许', mood: 'worried', moodAfter: {mood: 'neutral', when: '曹操'}},
        {type: 'stamp', text: '两万', at: [115.6, 33.6], when: '两万'},
      ],
    },
    {
      type: 'map',
      script: '袁绍大军南下，先派颜良围攻白马。',
      items: [
        {type: 'figure', who: '袁绍', at: '黎阳'},
        {type: 'arrow', from: '邺', to: '黎阳', when: '南下'},
        {type: 'figure', who: '颜良', at: '黎阳', moveTo: {at: '白马', when: '围攻', arrow: true}},
        {type: 'label', text: '白马', at: [114.52, 35.4], when: '白马'},
      ],
    },
    {
      type: 'map',
      script: '曹操声东击西，关羽阵前斩杀颜良，白马之围就解了。',
      items: [
        {type: 'figure', who: '颜良', at: '白马'},
        {type: 'figure', who: '曹操', at: '延津', when: '曹操', mark: {kind: '!', when: '声东击西'}},
        {type: 'figure', who: '关羽', at: '延津', when: '关羽', moveTo: {at: '白马', when: '阵前', arrow: true}},
        {type: 'battle', at: [114.52, 35.4], when: '斩杀'},
        {type: 'stamp', text: '解围', at: [115.3, 35.6], when: '解了'},
      ],
      person: {who: '关羽', zi: '字云长', line: '此时暂在曹营 · 万军中斩颜良', source: '《三国志·关羽传》', when: '关羽'},
    },
    {
      type: 'map',
      script: '两军最后在官渡对峙，曹操粮草快撑不住了。',
      items: [
        {type: 'figure', who: '袁绍', at: '乌巢'},
        {type: 'figure', who: '曹操', at: '官渡', mark: {kind: '…', when: '粮草'}, moodAfter: {mood: 'worried', when: '撑不住'}},
        {type: 'battle', at: [114.2, 34.9], when: '对峙'},
      ],
      banner: {text: '官渡对峙', style: 'slate', when: '官渡'},
    },
    {
      type: 'map',
      script: '这时候，袁绍的谋士许攸跑来投奔，带来一个情报：袁军的粮仓，就在乌巢。',
      items: [
        {type: 'figure', who: '袁绍', at: '黎阳'},
        {type: 'figure', who: '许攸', at: '黎阳', when: '许攸', moveTo: {at: '官渡', when: '投奔', arrow: true}},
        {type: 'figure', who: '曹操', at: '官渡', mood: 'worried', mark: {kind: '!', when: '情报'}, moodAfter: {mood: 'happy', when: '情报'}},
        {type: 'city', at: '乌巢', label: '乌巢', size: 'small', when: '粮仓'},
      ],
      person: {who: '许攸', zi: '字子远', line: '袁绍谋士 · 曹操的老朋友', when: '许攸'},
    },
    {
      type: 'map',
      script: '曹操亲自带五千人夜袭乌巢，一把火烧光了袁军的粮草。',
      items: [
        {type: 'city', at: '乌巢', label: '乌巢', size: 'small'},
        {type: 'figure', who: '曹操', at: '官渡', moveTo: {at: '乌巢', when: '夜袭', arrow: true}},
        {type: 'stamp', text: '五千', at: [113.6, 35.0], when: '五千人'},
        {type: 'stamp', text: '火烧', at: [114.9, 35.2], when: '一把火'},
      ],
    },
    {
      type: 'map',
      script: '袁军军心大乱，十万大军一夜崩盘。',
      territories: [
        {regions: ['兖州', '豫州'], color: 'blue'},
        {regions: ['冀州', '青州', '幽州', '并州'], color: 'gold', recolor: {color: 'dark', when: '大乱', from: '官渡'}},
      ],
      items: [
        {type: 'figure', who: '袁绍', at: '邺', mood: 'worried', cross: '崩盘'},
        {type: 'stamp', text: '崩盘', at: [116.3, 37.2], when: '一夜'},
      ],
    },
    {
      type: 'list',
      script: '袁绍输在三点：犹豫不决，内部争斗，后方被烧。',
      title: '袁绍输在哪',
      points: [
        {text: '犹豫不决', who: '袁绍', when: '犹豫'},
        {text: '内部争斗', who: '许攸', when: '内部'},
        {text: '后方被烧', when: '后方'},
      ],
    },
    {
      type: 'map',
      script: '官渡之后，北方再也没人能挡住曹操。',
      territories: [
        {regions: ['兖州', '豫州'], color: 'blue'},
        {regions: ['冀州', '青州', '幽州', '并州'], color: 'dark', recolor: {color: 'blue', when: '北方', from: '官渡'}},
      ],
      items: [{type: 'figure', who: '曹操', at: '邺', when: '挡住', mark: {kind: '!', when: '曹操'}}],
      banner: {text: '一统北方', style: 'red', when: '没人'},
    },
  ],
};

export default video;
