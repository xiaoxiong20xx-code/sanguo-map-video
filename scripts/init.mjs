/**
 * 把工具包复制到一个工作文件夹（作为 Skill 使用时：Skill 文件夹只当“源码”，配音、渲染、成片都在工作文件夹里）
 *
 *   node <skill 文件夹>/scripts/init.mjs [工作文件夹]
 *
 * 不写工作文件夹时用 ~/三国地图动画工具包。
 * 工作文件夹已经是工具包时不会覆盖，请改用：node <skill 文件夹>/scripts/update.mjs <工作文件夹>
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {ROOT, fail, ok, say} from './lib.mjs';

const SKIP = new Set(['.git', 'node_modules', '.venv', '.runtime', '.local', 'out', 'dist', 'data', 'dev', '.claude', 'history']);
const target = path.resolve((process.argv[2] ?? path.join(os.homedir(), '三国地图动画工具包')).replace(/^~(?=$|[\\/])/, os.homedir()));

if (path.resolve(target) === path.resolve(ROOT)) {
  ok('工作文件夹就是工具包本身，不用复制。');
  process.exit(0);
}
if (fs.existsSync(path.join(target, 'package.json'))) {
  fail(`${target} 里已经有工具包了，不会覆盖。要更新到新版请运行：`);
  say(`   node "${path.join(ROOT, 'scripts', 'update.mjs')}" "${target}"`);
  process.exit(1);
}

let n = 0;
const copy = (src, dst) => {
  for (const e of fs.readdirSync(src, {withFileTypes: true})) {
    if (SKIP.has(e.name)) continue;
    const s = path.join(src, e.name);
    const d = path.join(dst, e.name);
    if (e.isDirectory()) copy(s, d);
    else {
      fs.mkdirSync(dst, {recursive: true});
      fs.copyFileSync(s, d);
      if (/\.(command|sh)$/.test(e.name) && process.platform !== 'win32') fs.chmodSync(d, 0o755);
      n++;
    }
  }
};
copy(ROOT, target);
ok(`已复制 ${n} 个文件到 ${target}`);
say('');
say('下一步（在工作文件夹里运行）：');
say(process.platform === 'win32' ? '   powershell -ExecutionPolicy Bypass -File scripts/install.ps1' : '   bash scripts/install.sh');
say('装好后按工作文件夹里的 AGENTS.md 做视频。');
