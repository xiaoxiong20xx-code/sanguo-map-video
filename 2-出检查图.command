#!/bin/bash
# Mac 双击：只出检查图和画面报告（不渲染整片）
cd "$(dirname "$0")"
export LANG=en_US.UTF-8
export PATH="$PWD/.runtime/node/bin:$PATH"
node scripts/guard.mjs && node scripts/make.mjs --no-video --open
echo ""
read -n 1 -s -r -p "按任意键关闭窗口…"
