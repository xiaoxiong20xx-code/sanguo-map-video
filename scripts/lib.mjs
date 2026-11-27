// 脚本公用的小工具：路径、ffmpeg、edge-tts、浏览器、剪贴板、读取内容文件
import {spawn, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const P = {
  content: path.join(ROOT, 'content', 'video.ts'),
  history: path.join(ROOT, 'content', 'history'),
  copy: path.join(ROOT, '口播文案.txt'),
  recordings: path.join(ROOT, '录音'),
  voice: path.join(ROOT, 'public', 'voice'),
  timeline: path.join(ROOT, 'src', 'generated', 'timeline.json'),
  out: path.join(ROOT, 'out'),
  local: path.join(ROOT, '.local'),
  browserConfig: path.join(ROOT, '.local', 'browser.json'),
  venv: path.join(ROOT, '.venv'),
};

export const isWin = os.platform() === 'win32';

// ---------- 输出 ----------
export const say = (msg = '') => console.log(msg);
export const ok = (msg) => console.log(`  ✓ ${msg}`);
export const warn = (msg) => console.log(`  ⚠ ${msg}`);
export const fail = (msg) => console.log(`  ✗ ${msg}`);
export const step = (n, msg) => console.log(`\n【${n}】${msg}`);

// ---------- ffmpeg：优先用系统的，没有就用 Remotion 自带的 ----------
const which = (cmd) => {
  const r = spawnSync(isWin ? 'where' : 'which', [cmd], {encoding: 'utf8'});
  return r.status === 0 ? r.stdout.split(/\r?\n/)[0].trim() : null;
};
const bundledBin = (name) => {
  const dirs = fs.existsSync(path.join(ROOT, 'node_modules', '@remotion'))
    ? fs.readdirSync(path.join(ROOT, 'node_modules', '@remotion')).filter((d) => d.startsWith('compositor-'))
    : [];
  for (const d of dirs) {
    const f = path.join(ROOT, 'node_modules', '@remotion', d, isWin ? `${name}.exe` : name);
    if (fs.existsSync(f)) return f;
  }
  return null;
};
export const ffmpegBin = () => which('ffmpeg') ?? bundledBin('ffmpeg');
export const ffprobeBin = () => which('ffprobe') ?? bundledBin('ffprobe');

export const run = (cmd, args, opts = {}) => spawnSync(cmd, args, {encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...opts});

/** 运行 ffmpeg / ffprobe。Mac 上 Remotion 自带的版本要在它自己的目录里、带上动态库路径运行（和 Remotion 的做法一样） */
export const runFf = (bin, args) => {
  const dir = path.dirname(bin);
  const opts = os.platform() === 'darwin' && path.isAbsolute(bin) ? {cwd: dir, env: {...process.env, DYLD_LIBRARY_PATH: dir}} : {};
  return run(bin, args, opts);
};

// ---------- edge-tts ----------
export const pythonBin = () => {
  const venvPy = isWin ? path.join(P.venv, 'Scripts', 'python.exe') : path.join(P.venv, 'bin', 'python');
  return fs.existsSync(venvPy) ? venvPy : null;
};
export const edgeTtsBin = () => {
  const venvBin = isWin ? path.join(P.venv, 'Scripts', 'edge-tts.exe') : path.join(P.venv, 'bin', 'edge-tts');
  return fs.existsSync(venvBin) ? venvBin : which('edge-tts');
};
export const proxyUrl = () => process.env.EDGE_TTS_PROXY || process.env.HTTPS_PROXY || process.env.HTTP_PROXY || '';

// ---------- 浏览器 ----------
export const browserOptions = () => {
  try {
    const cfg = JSON.parse(fs.readFileSync(P.browserConfig, 'utf8'));
    if (cfg.executable && fs.existsSync(cfg.executable)) return {browserExecutable: cfg.executable, chromeMode: cfg.chromeMode ?? 'chrome-for-testing'};
  } catch {}
  return {};
};

// ---------- 剪贴板 ----------
// Mac 的 pbcopy / pbpaste 按语言环境转码，指定 UTF-8 免得中文乱码
const UTF8_ENV = {...process.env, LANG: 'en_US.UTF-8', LC_CTYPE: 'en_US.UTF-8'};
export const readClipboard = () => {
  if (isWin) {
    const r = run('powershell', ['-NoProfile', '-Command', '[Console]::OutputEncoding=[Text.Encoding]::UTF8; Get-Clipboard -Raw']);
    return r.status === 0 ? r.stdout : '';
  }
  const r = run(os.platform() === 'darwin' ? 'pbpaste' : 'xclip', os.platform() === 'darwin' ? [] : ['-o', '-selection', 'clipboard'], {env: UTF8_ENV});
  return r.status === 0 ? r.stdout : '';
};

export const writeClipboard = (text) => {
  try {
    if (isWin) {
      const tmp = path.join(os.tmpdir(), `clip-${Date.now()}.txt`);
      fs.writeFileSync(tmp, text, 'utf8');
      const r = run('powershell', ['-NoProfile', '-Command', `Get-Content -Raw -Encoding UTF8 '${tmp.replace(/'/g, "''")}' | Set-Clipboard`]);
      fs.rmSync(tmp, {force: true});
      return r.status === 0;
    }
    const r = run(os.platform() === 'darwin' ? 'pbcopy' : 'xclip', os.platform() === 'darwin' ? [] : ['-selection', 'clipboard'], {input: text, env: UTF8_ENV});
    return r.status === 0;
  } catch {
    return false;
  }
};

export const openFolder = (dir) => {
  if (isWin) spawnSync('explorer', [dir]);
  else if (os.platform() === 'darwin') spawnSync('open', [dir]);
};

/** 用记事本 / 文本编辑打开一个文本文件 */
export const openTextFile = (file) => {
  if (isWin) spawn('notepad', [file], {detached: true, stdio: 'ignore'}).unref();
  else if (os.platform() === 'darwin') spawnSync('open', ['-e', file]);
};

// ---------- 内容文件 ----------
/** 每次都重新读取（不用缓存），语法错误时给出中文提示 */
export const loadContent = async () => {
  const url = pathToFileURL(P.content).href + `?t=${Date.now()}`;
  try {
    const mod = await import(url);
    return {video: mod.default};
  } catch (err) {
    const msg = String(err?.message ?? err).split('\n')[0];
    const where = String(err?.stack ?? '').match(/video\.ts:(\d+)/);
    return {error: `content/video.ts 写法有错误${where ? `（第 ${where[1]} 行附近）` : ''}：${msg}`};
  }
};

export const readOriginalCopy = () => {
  if (!fs.existsSync(P.copy)) return '';
  const text = fs.readFileSync(P.copy, 'utf8').replace(/^﻿/, '');
  // 模板里的说明行（以 # 开头）不算文案
  return text
    .split(/\r?\n/)
    .filter((l) => !l.trim().startsWith('#'))
    .join('\n')
    .trim();
};

export const safeName = (s) => String(s || 'video').replace(/[\\/:*?"<>|\s：·]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
