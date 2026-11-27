#!/bin/bash
# Mac 首次安装
cd "$(dirname "$0")"
bash scripts/install.sh
echo ""
read -n 1 -s -r -p "按任意键关闭窗口…"
