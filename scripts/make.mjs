/**
 * 一键生成视频：检查内容 → 配音 → 排时间轴 → 画面报告 → 渲染 → 统一音量 → 检查图
 *
 *   npm run check     只检查 content/video.ts（格式、地名、人物、when、文字长度、排版），不配音不渲染
 *   npm run preview   配音 + 排时间轴 + 画面报告 + 检查图，不渲染整片（约 1~2 分钟）
 *   npm run make      完整出片：out/<标题>.mp4、.srt、检查图、画面报告
 *   其他参数：--open 完成后打开输出文件夹
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {P, ROOT, browserOptions, fail, ffmpegBin, loadContent, ok, openFolder, pythonBin, readOriginalCopy, run, runFf, safeName, say, step, warn} from './lib.mjs';
import {validateVideo} from '../src/core/validate.ts';
import {estimateTiming, FPS, LEAD, planVideo} from '../src/core/plan.ts';
import {cleanScript, DEFAULT_READ_AS, displayText, PUNCT, splitScript, toTts} from '../src/core/text.ts';

const args = new Set(process.argv.slice(2));
const COMPOSITION_ID = 'HistoryVideo';
const VOICE_DEFAULT = {name: 'zh-CN-YunxiNeural', rate: '+20%'};
const GAP = 0.3; // 每段说完停 0.3 秒
const END_HOLD = 2.0; // 最后一段说完停 2 秒

const fmt = (frames) => {
  const s = frames / FPS;
  return `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
};

// ---------- 出错时：打印 + 生成一段能直接发给 AI 的修改要求 ----------
const stopWithErrors = (errors, warnings = []) => {
  say('');
  fail('content/video.ts 需要修改：');
  errors.forEach((e, i) => say(`   ${i + 1}. ${e}`));
  const fix =
    `程序检查 content/video.ts 时发现下面的问题，请逐条改好（只改 content/video.ts，不要改文案）：\n\n` +
    errors.map((e, i) => `${i + 1}. ${e}`).join('\n') +
    (warnings.length ? `\n\n另外注意：\n${warnings.map((w) => `- ${w}`).join('\n')}` : '');
  fs.mkdirSync(P.out, {recursive: true});
  fs.writeFileSync(path.join(P.out, '错误信息.txt'), fix, 'utf8');
  say(`\n👉 修改要求也保存在 out/错误信息.txt。改好后重新运行。`);
  process.exit(1);
};

// ---------- 配音（每段一条，带每个词的时间） ----------
const sha = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 12);

/** 配音文字里每个字开始出声的秒数（词内按字均分，标点取后一个字的时间） */
const charTimes = (ttsText, words) => {
  const t = new Array(ttsText.length + 1).fill(null);
  let cur = 0;
  for (const w of words) {
    const at = ttsText.indexOf(w.text, cur);
    if (at < 0) continue;
    for (let j = 0; j < w.text.length; j++) t[at + j] = w.start + ((w.end - w.start) * j) / w.text.length;
    cur = at + w.text.length;
    t[cur] = Math.max(t[cur] ?? 0, w.end);
  }
  t[ttsText.length] = words[words.length - 1].end;
  for (let k = ttsText.length - 1; k >= 0; k--) if (t[k] === null) t[k] = t[k + 1];
  for (let k = 1; k <= ttsText.length; k++) t[k] = Math.max(t[k], t[k - 1]);
  return t;
};

const makeVoice = (video) => {
  step('2', '生成配音');
  const voice = {...VOICE_DEFAULT, ...(video.voice ?? {})};
  const readAs = {...DEFAULT_READ_AS, ...(video.readAs ?? {})};
  fs.mkdirSync(P.voice, {recursive: true});
  const jobs = video.scenes.map((scene) => {
    const clean = cleanScript(scene.script);
    const tts = toTts(clean, readAs);
    const name = `${sha(`${voice.name}|${voice.rate}|${tts.text}`)}`;
    return {clean, tts, mp3: path.join(P.voice, `${name}.mp3`), words: path.join(P.voice, `${name}.words.json`), audio: `voice/${name}.mp3`};
  });
  const missing = jobs.filter((j) => !fs.existsSync(j.mp3) || !fs.existsSync(j.words));
  say(`   共 ${jobs.length} 段，需要新生成 ${missing.length} 段（音色 ${voice.name}，语速 ${voice.rate}）`);
  let failed = false;
  if (missing.length) {
    const py = pythonBin();
    if (!py) {
      warn('没找到配音工具（.venv），请先运行“1-首次安装”');
      failed = true;
    } else {
      const jobsFile = path.join(P.out, 'voice-jobs.json');
      fs.mkdirSync(P.out, {recursive: true});
      fs.writeFileSync(jobsFile, JSON.stringify(missing.map((j) => ({text: j.tts.text, voice: voice.name, rate: voice.rate, out: j.mp3}))));
      const r = run(py, ['-I', path.join(ROOT, 'scripts', 'tts.py'), jobsFile], {stdio: 'inherit', timeout: 600000});
      fs.rmSync(jobsFile, {force: true});
      if (r.status !== 0) {
        warn('edge-tts 配音失败（多半是网络连不上微软的配音服务）');
        failed = true;
      }
    }
  }
  let estimated = 0;
  const timings = jobs.map((j) => {
    if (fs.existsSync(j.mp3) && fs.existsSync(j.words)) {
      const words = JSON.parse(fs.readFileSync(j.words, 'utf8'));
      if (words.length) {
        const ct = charTimes(j.tts.text, words);
        const charFrames = [...Array(j.clean.length + 1).keys()].map((i) => LEAD + ct[j.tts.map[i]] * FPS);
        return {charFrames, speechEnd: LEAD + words[words.length - 1].end * FPS, audio: j.audio};
      }
    }
    estimated++;
    return {...estimateTiming(j.clean), audio: null};
  });
  if (estimated) warn(`${estimated} 段没有配音，先按每秒约 5.3 个字估算时长（成片会是无声的）。联网后重新运行即可补上。`);
  else ok('配音就绪');
  // 清掉不再用到的旧配音
  const used = new Set(jobs.flatMap((j) => [path.basename(j.mp3), path.basename(j.words)]));
  for (const f of fs.readdirSync(P.voice)) if (!used.has(f) && /\.(mp3|json)$/.test(f)) fs.rmSync(path.join(P.voice, f), {force: true});
  return {timings, estimated: estimated > 0 || failed};
};

// ---------- 时间轴 ----------
const makeTimeline = (video, timings) => {
  step('3', '按配音排时间轴');
  const n = video.scenes.length;
  let durs = timings.map((t, i) => Math.ceil(t.speechEnd + (i === n - 1 ? END_HOLD : GAP) * FPS));
  // 动画没演完就延长这一段
  const first = planVideo({video, timings: timings.map((t, i) => ({...t, dur: durs[i]}))});
  const notes = [];
  durs = durs.map((d, i) => {
    const need = Math.ceil(first[i].needEnd + 8);
    if (need > d) {
      notes.push(`第 ${i + 1} 段结尾多停了 ${((need - d) / FPS).toFixed(1)} 秒，给动画留时间`);
      return need;
    }
    return d;
  });
  let from = 0;
  const scenes = video.scenes.map((scene, i) => {
    const t = timings[i];
    const lines = splitScript(scene.script);
    const subs = lines.map((l, k) => ({text: l.text, from: Math.max(0, Math.round(t.charFrames[l.start] - 2)), to: 0}));
    subs.forEach((s, k) => (s.to = k + 1 < subs.length ? subs[k + 1].from : durs[i]));
    const out = {script: scene.script, type: scene.type, from, dur: durs[i], audio: t.audio, charFrames: t.charFrames.map((f) => +f.toFixed(2)), speechEnd: +t.speechEnd.toFixed(2), subs};
    from += durs[i];
    return out;
  });
  const timeline = {fps: FPS, total: from, scenes};
  fs.mkdirSync(path.dirname(P.timeline), {recursive: true});
  fs.writeFileSync(P.timeline, JSON.stringify(timeline));
  notes.forEach((x) => say(`   · ${x}`));
  ok(`总时长 ${(from / FPS).toFixed(1)} 秒，共 ${n} 段`);
  return timeline;
};

const writeSrt = (timeline, file) => {
  const t = (frames) => {
    const ms = Math.round((frames / FPS) * 1000);
    const p = (v, w = 2) => String(v).padStart(w, '0');
    return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
  };
  let k = 1;
  const out = timeline.scenes.flatMap((s) => s.subs.map((c) => `${k++}\n${t(s.from + c.from)} --> ${t(s.from + c.to)}\n${displayText(c.text)}\n`));
  fs.writeFileSync(file, out.join('\n'), 'utf8');
};

/** 画面报告：每段几秒到几秒、哪一刻出现什么、排版问题。给看不了图片的 AI 核对用 */
const reportScenes = (video, timeline, plan, file) => {
  step('4', '画面报告');
  const lines = [];
  let issues = 0;
  let maxGap = 0;
  plan.forEach((p, i) => {
    const t = timeline.scenes[i];
    lines.push(`第 ${i + 1} 段（${p.type}）${fmt(t.from)}–${fmt(t.from + t.dur)}  ${cleanScript(video.scenes[i].script)}`);
    const beats = [...p.beats].filter((b) => b.t >= 0).sort((a, b) => a.t - b.t);
    for (const b of beats) lines.push(`    ${fmt(t.from + b.t)}  ${b.what}`);
    // 最长空档（不算字幕换句）
    const marks = [0, ...beats.map((b) => b.t).filter((x) => x < t.speechEnd), Math.min(t.dur, t.speechEnd + 10)];
    const gap = Math.max(...marks.slice(1).map((m, k) => m - marks[k])) / FPS;
    maxGap = Math.max(maxGap, gap);
    if (gap > 3 && p.type === 'map') lines.push(`    ⚠ 最长有 ${gap.toFixed(1)} 秒画面没有新变化，可以多加一个 when`);
    for (const x of p.issues) {
      lines.push(`    ⚠ ${x}`);
      issues++;
    }
  });
  fs.writeFileSync(file, lines.join('\n') + '\n', 'utf8');
  lines.forEach((l) => say(`   ${l}`));
  if (issues) warn(`有 ${issues} 处排版问题（上面 ⚠ 的行），建议改 content/video.ts：换地点、减少同一段的人物、或把东西放到别的段`);
  else ok('排版检查通过：没有出画、被挡住或压在一起的东西');
  return issues;
};

// ---------- 统一音量到 -16 LUFS ----------
const loudnorm = (input, output) => {
  const target = 'I=-16:TP=-1.5:LRA=11';
  const m = runFf(ffmpegBin(), ['-hide_banner', '-i', input, '-vn', '-af', `loudnorm=${target}:print_format=json`, '-f', 'null', '-']);
  const block = [...(m.stderr || '').matchAll(/\{[^{}]*"input_i"[^{}]*\}/g)].pop();
  if (!block) return fs.renameSync(input, output), null;
  const j = JSON.parse(block[0]);
  if (!Number.isFinite(parseFloat(j.input_i))) return fs.renameSync(input, output), null;
  const filter = `loudnorm=${target}:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true`;
  const r = runFf(ffmpegBin(), ['-hide_banner', '-v', 'error', '-y', '-i', input, '-c:v', 'copy', '-af', filter, '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', output]);
  if (r.status !== 0) return fs.renameSync(input, output), null;
  fs.rmSync(input, {force: true});
  return parseFloat(j.input_i);
};

/** 检查图要看的帧：地图段取中间一张 + 结尾一张，卡片段取结尾 */
const keyframesFor = (timeline, plan) => {
  const picks = [];
  plan.forEach((p, i) => {
    const t = timeline.scenes[i];
    const subAt = (f) => displayText(t.subs.find((c) => f >= c.from && f < c.to)?.text ?? '');
    const add = (f, end) => picks.push({frame: t.from + f, label: `第${i + 1}段 ${fmt(t.from + f)} ${subAt(f)}`, end});
    if (p.type === 'map' && t.dur > 90) add(Math.round(t.dur * 0.5), false);
    add(t.dur - 8, true);
  });
  return picks;
};

// ---------- 主流程 ----------
const main = async () => {
  say('==============================================');
  say('  三国地图动画 · 一键生成');
  say('==============================================');

  step('1', '检查 content/video.ts');
  if (!fs.existsSync(P.content)) stopWithErrors(['找不到 content/video.ts']);
  const {video, error} = await loadContent();
  if (error) stopWithErrors([error]);
  const original = readOriginalCopy();
  const {errors, warnings} = validateVideo(video, original);
  warnings.forEach((w) => warn(w));
  if (errors.length) stopWithErrors(errors, warnings);
  ok(`格式正确：《${video.title}》共 ${video.scenes.length} 段${original ? '，文案和 口播文案.txt 一字不差' : ''}`);
  if (!original) warn('口播文案.txt 是空的，没法核对文案有没有被改（请把原文案贴进去）');

  if (args.has('--check-only')) {
    const est = video.scenes.map((s) => {
      const e = estimateTiming(cleanScript(s.script));
      return {...e, dur: Math.ceil(e.speechEnd + GAP * FPS)};
    });
    const plan = planVideo({video, timings: est});
    const issues = plan.flatMap((p) => p.issues);
    if (issues.length) {
      say('');
      warn('排版问题（按估算的时间，配音后以 npm run preview 的画面报告为准）：');
      issues.forEach((x) => say(`     · ${x}`));
    } else ok('排版检查通过');
    say('\n字幕断句预览：');
    video.scenes.forEach((s, i) => splitScript(s.script).forEach((l) => say(`   ${String(i + 1).padStart(2, '0')}  ${displayText(l.text)}`)));
    return;
  }

  const {timings, estimated} = makeVoice(video);
  const timeline = makeTimeline(video, timings);
  const plan = planVideo({video, timings: timeline.scenes.map((s) => ({charFrames: s.charFrames, speechEnd: s.speechEnd, dur: s.dur}))});
  const name = safeName(video.title);
  fs.mkdirSync(P.out, {recursive: true});
  writeSrt(timeline, path.join(P.out, `${name}.srt`));
  reportScenes(video, timeline, plan, path.join(P.out, `${name}-画面报告.txt`));

  step('5', args.has('--no-video') ? '准备画面' : '渲染视频（第一次会慢一点）');
  const {bundle} = await import('@remotion/bundler');
  const {renderMedia, renderStill, selectComposition} = await import('@remotion/renderer');
  const browser = browserOptions();
  const serveUrl = await bundle({entryPoint: path.join(ROOT, 'src', 'index.ts'), publicDir: path.join(ROOT, 'public')});
  const composition = await selectComposition({serveUrl, id: COMPOSITION_ID, ...browser});
  const mp4 = path.join(P.out, `${name}.mp4`);
  if (!args.has('--no-video')) {
    const tmp = path.join(P.out, '_render.mp4');
    let last = -1;
    await renderMedia({
      composition,
      serveUrl,
      codec: 'h264',
      crf: 18,
      pixelFormat: 'yuv420p',
      imageFormat: 'jpeg',
      jpegQuality: 92,
      outputLocation: tmp,
      overwrite: true,
      ...browser,
      onProgress: ({progress}) => {
        const pct = Math.floor(progress * 100);
        if (pct !== last) process.stdout.write(`\r   渲染中 ${pct}%   `);
        last = pct;
      },
    });
    say('');
    step('6', '统一音量');
    const lufs = estimated ? null : loudnorm(tmp, mp4);
    if (estimated) fs.renameSync(tmp, mp4);
    ok(lufs === null ? '跳过（没有配音）' : `响度 ${lufs.toFixed(1)} → -16 LUFS`);
  }

  step('7', '导出检查图');
  const picks = keyframesFor(timeline, plan);
  const props = {frames: picks.map((p) => p.frame), labels: picks.map((p) => p.label)};
  const sheetComp = await selectComposition({serveUrl, id: 'ContactSheet', inputProps: props, ...browser});
  const sheet = path.join(P.out, `${name}-检查图.png`);
  await renderStill({composition: sheetComp, serveUrl, output: sheet, inputProps: props, imageFormat: 'png', overwrite: true, ...browser});
  const framesDir = path.join(P.out, `${name}-关键帧`);
  fs.rmSync(framesDir, {recursive: true, force: true});
  fs.mkdirSync(framesDir, {recursive: true});
  let k = 0;
  for (const p of picks.filter((x) => x.end)) {
    k++;
    await renderStill({composition, serveUrl, output: path.join(framesDir, `${String(k).padStart(2, '0')}.png`), frame: p.frame, imageFormat: 'png', overwrite: true, ...browser});
  }
  ok(`检查图：out/${name}-检查图.png；每段结尾大图：out/${name}-关键帧/`);

  say('\n==============================================');
  if (args.has('--no-video')) {
    say('  预览完成（没有渲染整片）。看检查图和画面报告没问题，再运行 npm run make 出成片。');
  } else {
    say(`  完成！成片：out/${name}.mp4（${(timeline.total / FPS).toFixed(1)} 秒）`);
    say(`  字幕文件：out/${name}.srt`);
  }
  say(`  画面报告：out/${name}-画面报告.txt`);
  say('==============================================');
  if (args.has('--open')) openFolder(P.out);
};

main().catch((err) => {
  say('');
  fail(`出错了：${err?.message ?? err}`);
  if (/browser|Chrome|chromium/i.test(String(err?.message))) say('   浏览器启动失败：请重新运行“1-首次安装”。');
  process.exit(1);
});
