/**
 * 安装 / 体检（“1-首次安装.bat”会调用）
 *
 *   npm run setup    装好配音工具和渲染用的浏览器，最后体检一遍
 *   npm run doctor   只体检，不安装
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {P, ROOT, browserOptions, edgeTtsBin, fail, ffmpegBin, ffprobeBin, isWin, ok, proxyUrl, pythonBin, run, say, step, warn} from './lib.mjs';

const CHECK_ONLY = process.argv.includes('--check');
/** --mirror：跳过官方下载，直接从国内镜像下载渲染浏览器（官方下载卡住时用） */
const MIRROR_ONLY = process.argv.includes('--mirror');
const problems = [];

// ---------- Python + edge-tts ----------
const findSystemPython = () => {
  // Mac 上优先用安装脚本下载的便携版 Python（.runtime/python）
  const portable = path.join(ROOT, '.runtime', 'python', 'bin', 'python3');
  const candidates = isWin
    ? [['py', ['-3']], ['python', []], ['python3', []]]
    : [...(fs.existsSync(portable) ? [[portable, []]] : []), ['python3', []], ['python', []]];
  for (const [cmd, pre] of candidates) {
    const r = run(cmd, [...pre, '--version']);
    const m = `${r.stdout}${r.stderr}`.match(/Python 3\.(\d+)/);
    if (r.status === 0 && m && Number(m[1]) >= 9) return [cmd, pre];
  }
  return null;
};

const setupPython = () => {
  step('1', '配音工具（Python + edge-tts）');
  if (!pythonBin()) {
    if (CHECK_ONLY) return problems.push('还没装配音工具：请运行“1-首次安装”');
    const sys = findSystemPython();
    if (!sys) return problems.push('没找到 Python 3.9+：请重新运行“1-首次安装”（Windows 也可以到 https://www.python.org/downloads/ 手动安装，勾选 Add to PATH）');
    say('   创建 Python 虚拟环境…');
    const r = run(sys[0], [...sys[1], '-m', 'venv', P.venv]);
    if (r.status !== 0) return problems.push(`创建 Python 虚拟环境失败：${(r.stderr || '').trim().split('\n').pop()}`);
  }
  if (!CHECK_ONLY) {
    say('   安装 / 升级 edge-tts…');
    const py = pythonBin();
    let done = false;
    for (const mirror of [[], ['-i', 'https://pypi.tuna.tsinghua.edu.cn/simple']]) {
      if (run(py, ['-m', 'pip', 'install', '-q', '--disable-pip-version-check', '-U', '-r', path.join(ROOT, 'requirements.txt'), ...mirror], {timeout: 300000}).status === 0) {
        done = true;
        break;
      }
    }
    if (!done) return problems.push('安装 edge-tts 失败：请检查网络后重新运行“1-首次安装”');
  }
  if (!edgeTtsBin()) return problems.push('没找到 edge-tts');
  ok('edge-tts 已安装');

  // 试着合成一句，确认能连上微软的语音服务
  const test = path.join(os.tmpdir(), `tts-test-${Date.now()}.mp3`);
  const ttsArgs = ['--voice', 'zh-CN-YunxiNeural', '--text', '你好', '--write-media', test];
  if (proxyUrl()) ttsArgs.push('--proxy', proxyUrl());
  const r = run(edgeTtsBin(), ttsArgs, {timeout: 60000});
  if (r.status === 0 && fs.existsSync(test) && fs.statSync(test).size > 1000) ok('配音服务连接正常');
  else {
    problems.push(
      '连不上微软配音服务（edge-tts）。可以：① 换个网络再试；② 如果平时用代理，先设置环境变量 HTTPS_PROXY=http://127.0.0.1:端口；③ 暂时不管，生成的视频会先没有声音。',
    );
    warn(`配音测试失败：${(r.stderr || '').trim().split('\n').pop()}`);
  }
  fs.rmSync(test, {force: true});
};

// ---------- 渲染用的浏览器 ----------
const headlessShellDir = path.join(ROOT, 'node_modules', '.remotion', 'chrome-headless-shell');
const SHELL_NAMES = new Set(['chrome-headless-shell', 'chrome-headless-shell.exe', 'headless_shell']);
const findShell = (dir, depth = 3) => {
  if (!fs.existsSync(dir) || depth < 0) return null;
  for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, e.name);
    if (e.isFile() && SHELL_NAMES.has(e.name)) return full;
    if (e.isDirectory()) {
      const found = findShell(full, depth - 1);
      if (found) return found;
    }
  }
  return null;
};
/** Remotion 自己的浏览器缓存是否已就绪 */
// 新版 Remotion 放在 chrome-headless-shell/<版本>/<平台>/ 下，旧版直接放在 chrome-headless-shell/<平台>/ 下，两种都认
const hasHeadlessShell = () => Boolean(findShell(headlessShellDir, 4));

const testedVersion = () => {
  const f = path.join(ROOT, 'node_modules', '@remotion', 'renderer', 'dist', 'browser', 'get-chrome-download-url.js');
  return fs.readFileSync(f, 'utf8').match(/TESTED_VERSION = '([\d.]+)'/)?.[1];
};

const platformName = () =>
  isWin ? 'win64' : os.platform() === 'darwin' ? (os.arch() === 'arm64' ? 'mac-arm64' : 'mac-x64') : 'linux64';

/** Google 的下载地址在国内打不开时，改从 npmmirror 下载同一个版本 */
const downloadFromMirror = () => {
  const version = testedVersion();
  if (!version) return false;
  const plat = platformName();
  const url = `https://cdn.npmmirror.com/binaries/chrome-for-testing/${version}/${plat}/chrome-headless-shell-${plat}.zip`;
  const zip = path.join(os.tmpdir(), `chrome-headless-shell-${version}-${plat}.zip`);
  say('   从国内镜像下载渲染浏览器（约 110MB）…');
  // Windows 用系统自带的 curl / tar（tar 能解 zip）；Mac 用 curl / unzip
  const sys32 = path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32');
  const curl = isWin && fs.existsSync(path.join(sys32, 'curl.exe')) ? path.join(sys32, 'curl.exe') : 'curl';
  const dl = run(curl, ['-L', '--fail', '--progress-bar', '-o', zip, url], {stdio: 'inherit', timeout: 900000});
  if (dl.status !== 0) return false;
  // 解压到 .local，并告诉渲染脚本直接用它（不依赖 Remotion 自己的缓存目录结构，新旧版本都能用）
  const dest = path.join(P.local, 'chrome-headless-shell');
  fs.rmSync(dest, {recursive: true, force: true});
  fs.mkdirSync(dest, {recursive: true});
  const tar = isWin && fs.existsSync(path.join(sys32, 'tar.exe')) ? path.join(sys32, 'tar.exe') : 'tar';
  const ex = isWin ? run(tar, ['-xf', zip, '-C', dest]) : run('unzip', ['-q', '-o', zip, '-d', dest]);
  fs.rmSync(zip, {force: true});
  const exe = ex.status === 0 ? findShell(dest) : null;
  if (!exe) return false;
  if (!isWin) fs.chmodSync(exe, 0o755);
  fs.writeFileSync(P.browserConfig, JSON.stringify({executable: exe, chromeMode: 'headless-shell'}, null, 2));
  return true;
};

const systemChrome = () => {
  const list = isWin
    ? [
        path.join(process.env['ProgramFiles'] ?? 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'),
        path.join(process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe'),
        path.join(process.env.LOCALAPPDATA ?? '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
      ]
    : ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome'];
  return list.find((f) => f && fs.existsSync(f));
};

const setupBrowser = () => {
  step('2', '渲染用的浏览器');
  if (!MIRROR_ONLY) {
    if (hasHeadlessShell()) return ok('已就绪（Chrome Headless Shell）');
    if (browserOptions().browserExecutable) return ok(`已就绪：${browserOptions().browserExecutable}`);
  }
  if (CHECK_ONLY) return problems.push('还没装渲染用的浏览器：请运行“1-首次安装”');
  fs.mkdirSync(P.local, {recursive: true});

  if (!MIRROR_ONLY) {
    say('   下载渲染浏览器…');
    const cli = path.join(ROOT, 'node_modules', '@remotion', 'cli', 'remotion-cli.js');
    const r = run(process.execPath, [cli, 'browser', 'ensure'], {cwd: ROOT, timeout: 240000});
    if (r.status === 0 && hasHeadlessShell()) return ok('已下载（Chrome Headless Shell）');
    say('   官方地址下载失败，换国内镜像…');
  }
  if (downloadFromMirror()) return ok('已从国内镜像下载（Chrome Headless Shell）');
  const chrome = systemChrome();
  if (chrome) {
    fs.writeFileSync(P.browserConfig, JSON.stringify({executable: chrome, chromeMode: 'chrome-for-testing'}, null, 2));
    return ok(`下载失败，改用本机的 Chrome：${chrome}`);
  }
  problems.push('渲染浏览器下载失败，本机也没有 Chrome。请安装 Google Chrome（https://www.google.cn/chrome/）后重新运行“1-首次安装”。');
};

// ---------- 其他 ----------
const checkBasics = () => {
  step('3', '其他检查');
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (!(major > 23 || (major === 23 && minor >= 6) || (major === 22 && minor >= 18))) {
    problems.push(`Node.js 版本太旧（${process.versions.node}），需要 22.18 以上：请重新运行“1-首次安装”`);
  } else ok(`Node.js ${process.versions.node}`);
  if (!fs.existsSync(path.join(ROOT, 'node_modules', 'remotion'))) problems.push('缺少依赖：请在本文件夹运行 npm install（或重新运行“1-首次安装”）');
  else ok('依赖已安装');
  if (ffmpegBin() && ffprobeBin()) ok('ffmpeg 可用');
  else problems.push('缺少 ffmpeg（正常情况下 Remotion 自带，请重新运行 npm install）');
  const fonts = ['MaShanZheng-Regular.ttf', 'NotoSerifSC.ttf'].filter((f) => !fs.existsSync(path.join(ROOT, 'public', 'fonts', f)));
  if (!fonts.length) ok('字体（马善政楷书、思源宋体）已就位');
  else problems.push(`缺少字体文件 public/fonts/${fonts.join('、')}`);
  if (fs.existsSync(path.join(ROOT, 'public', 'map', 'map.json'))) ok('底图已就位');
  else problems.push('缺少底图 public/map/：请重新解压工具包');
};

setupPython();
setupBrowser();
checkBasics();

say('');
if (problems.length) {
  fail('还有问题需要处理：');
  problems.forEach((p, i) => say(`   ${i + 1}. ${p}`));
  process.exit(1);
}
say('✅ 全部就绪！接下来看《使用说明》做第一条视频。');
