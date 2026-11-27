/**
 * 打交付包：npm run package → dist/三国地图动画工具包.zip
 * 不打包 node_modules / .venv / .runtime / out 等（用户运行“1-首次安装”会自动装好），
 * 但会带上示例视频的配音缓存，装好后不联网也能先渲染出示例。
 */
import fs from 'node:fs';
import path from 'node:path';
import {ROOT, pythonBin, run, say} from './lib.mjs';
import './docs.mjs'; // 先重新生成 docs/地名表.md、docs/人物表.md

const NAME = '三国地图动画工具包';
const EXCLUDE_DIRS = new Set(['node_modules', '.venv', '.runtime', 'out', 'dist', '.local', 'history', '.git', '.claude', 'data', 'dev']);
const EXCLUDE_FILES = [/\.log$/];

const py = pythonBin();
if (!py) throw new Error('需要先运行 npm run setup（打包用到 Python）');

// ---------- 使用说明.md → 使用说明.html（Windows 双击 .md 打不开，HTML 双击就能看） ----------
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>');
const mdToHtml = (md) => {
  const out = [];
  const lines = md.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^#{1,3} /.test(l)) {
      const n = l.match(/^#+/)[0].length;
      out.push(`<h${n}>${inline(l.slice(n + 1))}</h${n}>`);
    } else if (/^---+$/.test(l.trim())) out.push('<hr>');
    else if (l.startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++]);
      i--;
      const cells = (r) => r.split('|').slice(1, -1).map((c) => inline(c.trim()));
      out.push('<table>' + `<tr>${cells(rows[0]).map((c) => `<th>${c}</th>`).join('')}</tr>` + rows.slice(2).map((r) => `<tr>${cells(r).map((c) => `<td>${c}</td>`).join('')}</tr>`).join('') + '</table>');
    } else if (/^(\d+\.|-) /.test(l.trim())) {
      const ordered = /^\d+\./.test(l.trim());
      const items = [];
      while (i < lines.length && /^\s*(\d+\.|-) /.test(lines[i])) items.push(lines[i++].trim().replace(/^(\d+\.|-) /, ''));
      i--;
      out.push(`<${ordered ? 'ol' : 'ul'}>${items.map((x) => `<li>${inline(x)}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`);
    } else if (l.startsWith('> ')) out.push(`<blockquote>${inline(l.slice(2))}</blockquote>`);
    else if (l.trim()) out.push(`<p>${inline(l)}</p>`);
  }
  return out.join('\n');
};
const guide = fs.readFileSync(path.join(ROOT, '使用说明.md'), 'utf8');
fs.writeFileSync(
  path.join(ROOT, '使用说明.html'),
  `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>使用说明</title>
<style>body{font-family:"Microsoft YaHei","PingFang SC",sans-serif;max-width:820px;margin:32px auto;padding:0 20px;line-height:1.75;color:#222;background:#F5F1E6}
h1{color:#8E2A22}h2{border-left:8px solid #B3302A;padding-left:12px;margin-top:36px}h3{color:#8E2A22}
code{background:#fff;border:1px solid #ddd;border-radius:6px;padding:1px 6px}b{color:#8E2A22}
table{border-collapse:collapse;width:100%;background:#fff}td,th{border:1px solid #ddd;padding:8px 10px;text-align:left;vertical-align:top}th{background:#F3E3D3}
blockquote{background:#fff;border-left:4px solid #B3302A;margin:12px 0;padding:8px 14px}hr{border:none;border-top:1px dashed #ccc;margin:28px 0}</style>
</head><body>
${mdToHtml(guide)}
</body></html>`,
  'utf8',
);

// 版本号 = 打包日期，远程排查时看这个文件就知道是哪一版
const today = new Date();
const version = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')} 版`;
fs.writeFileSync(path.join(ROOT, '版本.txt'), `${version}\n更新方法：见 使用说明 里的“更新工具包”。\n`, 'utf8');

const files = [];
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, e.name);
    const rel = path.relative(ROOT, full).split(path.sep).join('/');
    if (e.isDirectory()) {
      if (!EXCLUDE_DIRS.has(e.name)) walk(full);
    } else if (!EXCLUDE_FILES.some((re) => re.test(e.name))) {
      files.push(rel);
    }
  }
};
walk(ROOT);

// 配音缓存只保留示例视频用到的那些
const timeline = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'generated', 'timeline.json'), 'utf8'));
const used = new Set(timeline.scenes.flatMap((s) => (s.audio ? [`public/${s.audio}`, `public/${s.audio.replace(/\.mp3$/, '.words.json')}`] : [])));
const allKept = files.filter((f) => !f.startsWith('public/voice/') || used.has(f));

// --to <文件夹>：导出开源仓库（同步文件，保留那个文件夹里的 .git）；不写就打 zip（zip 里不带 README 用的演示动图）
const toIdx = process.argv.indexOf('--to');
if (toIdx > 0) {
  const dest = path.resolve(process.argv[toIdx + 1]);
  fs.mkdirSync(dest, {recursive: true});
  const want = new Set(allKept);
  const prune = (dir) => {
    for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
      if (e.name === '.git') continue;
      const full = path.join(dir, e.name);
      const rel = path.relative(dest, full).split(path.sep).join('/');
      if (e.isDirectory()) {
        prune(full);
        if (!fs.readdirSync(full).length) fs.rmdirSync(full);
      } else if (!want.has(rel)) fs.rmSync(full);
    }
  };
  prune(dest);
  for (const rel of allKept) {
    const d = path.join(dest, rel);
    fs.mkdirSync(path.dirname(d), {recursive: true});
    fs.copyFileSync(path.join(ROOT, rel), d);
  }
  say(`已导出 ${allKept.length} 个文件 → ${dest}`);
  process.exit(0);
}
const keep = allKept.filter((f) => !f.startsWith('docs/assets/'));

const listFile = path.join(ROOT, 'dist', 'files.txt');
fs.mkdirSync(path.dirname(listFile), {recursive: true});
fs.writeFileSync(listFile, keep.join('\n'), 'utf8');
const zip = path.join(ROOT, 'dist', `${NAME}.zip`);
const script = `
import zipfile, sys, os, time
root, listfile, out, name = sys.argv[1:5]
with open(listfile, encoding='utf-8') as f: files = [l for l in f.read().split('\\n') if l]
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    for rel in files:
        src = root + '/' + rel
        info = zipfile.ZipInfo(name + '/' + rel, time.localtime(os.path.getmtime(src))[:6])
        info.compress_type = zipfile.ZIP_DEFLATED
        # 写成 Unix 权限，Mac 解压后 .command / .sh 才能运行
        info.create_system = 3
        mode = 0o755 if rel.endswith(('.command', '.sh')) else 0o644
        info.external_attr = (0o100000 | mode) << 16
        with open(src, 'rb') as fh: z.writestr(info, fh.read())
`;
const r = run(py, ['-c', script, ROOT, listFile, zip, NAME]);
fs.rmSync(listFile);
if (r.status !== 0) throw new Error(r.stderr);
say(`已打包 ${keep.length} 个文件 → dist/${NAME}.zip（${(fs.statSync(zip).size / 1024 / 1024).toFixed(1)} MB）`);
