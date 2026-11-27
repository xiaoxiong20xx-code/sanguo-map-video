#!/bin/bash
# Mac 双击：用 content/video.ts 生成成片（第一次请先双击“1-首次安装”）
cd "$(dirname "$0")"
export LANG=en_US.UTF-8
export PATH="$PWD/.runtime/node/bin:$PATH"
node scripts/guard.mjs && node scripts/make.mjs --open
echo ""
read -n 1 -s -r -p "按任意键关闭窗口…"
