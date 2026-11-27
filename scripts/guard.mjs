// 检查 Node.js 版本：脚本直接运行 .ts 文件，需要 Node 22.18+（或 23.6+）
const [major, minor] = process.versions.node.split('.').map(Number);
const ok = major > 23 || (major === 23 && minor >= 6) || (major === 22 && minor >= 18);
if (!ok) {
  console.log(`✗ Node.js 版本太旧（现在是 ${process.versions.node}，需要 22.18 以上）。请重新运行“1-首次安装”，它会自动装好新版。`);
  process.exit(1);
}
