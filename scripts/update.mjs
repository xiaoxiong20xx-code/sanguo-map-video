/**
 * 用新版工具包覆盖旧版。在【解压出来的新版文件夹】里运行：
 *   node scripts/update.mjs <旧工具包文件夹>
 * 不写路径时自动找：外层文件夹里的工具包 → ~/Documents/三国地图动画工具包
 *
 * 旧版里已经装好的环境（node_modules / .venv / .runtime / .local）、做好的视频（out）、
 * 录音、背景、配音缓存、正在做的 content/video.ts 和 口播文案.txt 都保留；
 * 程序文件夹（src / scripts / docs / content/examples）和新版完全一致，旧版多出来的文件会删掉。
 */
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {ROOT, fail, isWin, ok, say, step, warn} from './lib.mjs';

const KIT_NAME = 'sanguo-map-kit';
// 不从新版带过去的文件夹（新版里一般也没有）
const SKIP_DIRS = new Set(['node_modules', '.venv', '.runtime', '.local', 'out', 'dist', 'history', '.git', '.claude', 'data', 'dev']);
// 旧版里已经有就不覆盖：正在做的视频、录音、背景、配音缓存
const KEEP_EXISTING = [/^content\/video\.ts$/, /^口播文案\.txt$/, /^src\/generated\//, /^录音\//, /^背景\//, /^public\/voice\//, /^public\/backgrounds\//];
// 和新版完全一致的程序文件夹（用户不会改这里）
const MIRROR = [/^src\/(?!generated\/)/, /^scripts\//, /^docs\//, /^content\/examples\//];

const isKit = (dir) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).name === KIT_NAME;
  } catch {
    return false;
  }
};
const readText = (file) => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim() : null);

const findTarget = () => {
  const arg = process.argv[2];
  if (arg) return path.resolve(arg.replace(/^~(?=$|[\\/])/, os.homedir()));
  for (let dir = path.dirname(ROOT); dir !== path.dirname(dir); dir = path.dirname(dir)) {
    if (isKit(dir)) return dir;
  }
  return path.join(os.homedir(), 'Documents', '三国地图动画工具包');
};

const TARGET = findTarget();
say(`新版：${ROOT}`);
say(`旧版：${TARGET}`);
if (!isKit(ROOT)) {
  fail('这个脚本要在解压出来的新版工具包里运行。');
  process.exit(1);
}
if (!isKit(TARGET)) {
  fail(`没找到旧工具包（${TARGET}）。请把旧工具包的路径写在命令后面：node scripts/update.mjs <旧工具包文件夹>`);
  process.exit(1);
}
if (path.resolve(TARGET) === path.resolve(ROOT)) {
  fail('新版和旧版是同一个文件夹。请先把新版压缩包解压到别的临时文件夹再运行。');
  process.exit(1);
}
say(`版本：${readText(path.join(TARGET, '版本.txt'))?.split('\n')[0] ?? '更早的版本'} → ${readText(path.join(ROOT, '版本.txt'))?.split('\n')[0] ?? '新版'}`);

// ---------- 1. 备份正在做的视频 ----------
step(1, '备份旧版里正在做的视频');
const now = new Date();
const stamp = [now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes()].map((n) => String(n).padStart(2, '0')).join('');
const backup = path.join(TARGET, 'content', 'history', `更新前-${stamp}`);
for (const rel of ['content/video.ts', '口播文案.txt']) {
  const from = path.join(TARGET, rel);
  if (!fs.existsSync(from)) continue;
  fs.mkdirSync(backup, {recursive: true});
  fs.copyFileSync(from, path.join(backup, path.basename(rel)));
}
ok(`已备份到 content/history/更新前-${stamp}/（正在做的视频不会被覆盖，这份只是以防万一）`);

// ---------- 2. 复制新版文件 ----------
step(2, '复制新版文件');
const files = [];
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) walk(full);
    } else if (e.isFile()) {
      files.push(path.relative(ROOT, full).split(path.sep).join('/'));
    }
  }
};
walk(ROOT);

const oldPackage = readText(path.join(TARGET, 'package.json'));
let added = 0;
let updated = 0;
let kept = 0;
for (const rel of files) {
  const from = path.join(ROOT, rel);
  const to = path.join(TARGET, rel);
  if (fs.existsSync(to)) {
    if (KEEP_EXISTING.some((re) => re.test(rel))) {
      kept++;
      continue;
    }
    if (fs.readFileSync(from).equals(fs.readFileSync(to))) continue;
    updated++;
  } else {
    added++;
  }
  fs.mkdirSync(path.dirname(to), {recursive: true});
  fs.copyFileSync(from, to);
}
ok(`更新 ${updated} 个文件，新增 ${added} 个`);
if (kept) ok(`保留了旧版的 ${kept} 个文件（正在做的视频、录音、背景、配音缓存）`);

// ---------- 3. 删掉新版里已经没有的程序文件 ----------
const newFiles = new Set(files);
let removed = 0;
const prune = (dir) => {
  for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, e.name);
    const rel = path.relative(TARGET, full).split(path.sep).join('/');
    if (e.isDirectory()) {
      prune(full);
      if (fs.readdirSync(full).length === 0) fs.rmdirSync(full);
    } else if (MIRROR.some((re) => re.test(rel)) && !newFiles.has(rel)) {
      fs.rmSync(full);
      removed++;
    }
  }
};
for (const dir of ['src', 'scripts', 'docs', path.join('content', 'examples')]) {
  if (fs.existsSync(path.join(TARGET, dir))) prune(path.join(TARGET, dir));
}
if (removed) ok(`删掉了 ${removed} 个新版已经不用的旧程序文件`);

// ---------- 4. Mac：恢复双击运行的权限、去掉“来自互联网”的隔离标记 ----------
if (!isWin) {
  for (const rel of files.filter((f) => /\.(command|sh)$/.test(f))) fs.chmodSync(path.join(TARGET, rel), 0o755);
  if (os.platform() === 'darwin') spawnSync('xattr', ['-dr', 'com.apple.quarantine', TARGET]);
  ok('已恢复 .command 双击运行的权限');
}

// ---------- 5. 检查环境要不要重装 ----------
step(3, '检查环境');
const deps = (text) => {
  const p = JSON.parse(text ?? '{}');
  return JSON.stringify({...p.dependencies, ...p.devDependencies});
};
if (!fs.existsSync(path.join(TARGET, 'node_modules'))) {
  warn('旧版还没装好环境：请运行“1-首次安装”。');
} else if (oldPackage && deps(oldPackage) !== deps(readText(path.join(TARGET, 'package.json')))) {
  warn('新版的依赖有变化：请在工具包里运行 npm install（或重新运行“1-首次安装”）。');
} else {
  ok('依赖没有变化，不用重新安装');
}

say('\n更新完成。可以删掉解压出来的新版文件夹和压缩包了。');
say('下一步：npm run doctor 体检，再 npm run preview 出一张检查图确认。');
