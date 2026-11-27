#!/bin/bash
# Mac 首次安装：不需要管理员密码。Node.js / Python 不够新就下载便携版，放在本文件夹的 .runtime/ 里。
set -u
cd "$(dirname "$0")/.."
ROOT="$PWD"
export LANG=en_US.UTF-8

NODE_VER=v24.22.1
PY_REL=20251217
PY_VER=3.12.12
RT="$ROOT/.runtime"
mkdir -p "$RT"

echo ""
echo "=============================================="
echo "  首次安装（大约 5~15 分钟，取决于网速）"
echo "=============================================="

# 0. 解除 macOS 对下载文件的拦截，并让 .command 文件可以双击运行
xattr -dr com.apple.quarantine "$ROOT" 2>/dev/null
chmod +x "$ROOT"/*.command "$ROOT"/scripts/*.sh 2>/dev/null


ARCH=$(uname -m)
download () {
  local out=$1; shift
  for url in "$@"; do
    curl -L --fail --progress-bar -o "$out" "$url" && return 0
    echo "  这个地址下载失败，换下一个…"
  done
  return 1
}

# 1. Node.js（需要 22.18 以上）
node_ok () {
  command -v node >/dev/null 2>&1 && node -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a>23||(a===23&&b>=6)||(a===22&&b>=18)?0:1)'
}
export PATH="$RT/node/bin:$PATH"
if node_ok; then
  echo "[1/4] Node.js $(node -v) ✓"
else
  echo "[1/4] 下载 Node.js…"
  NA=$([ "$ARCH" = "arm64" ] && echo arm64 || echo x64)
  F="node-$NODE_VER-darwin-$NA.tar.gz"
  if ! download "$RT/node.tgz" "https://registry.npmmirror.com/-/binary/node/$NODE_VER/$F" "https://nodejs.org/dist/$NODE_VER/$F"; then
    echo "Node.js 下载失败，请检查网络后重新安装。"; exit 1
  fi
  rm -rf "$RT/node" && mkdir -p "$RT/node" && tar -xzf "$RT/node.tgz" -C "$RT/node" --strip-components 1 && rm -f "$RT/node.tgz"
  if ! node_ok; then echo "Node.js 安装失败。"; exit 1; fi
  echo "[1/4] Node.js $(node -v) ✓"
fi

# 2. Python（便携版，不用系统自带的，免得弹出“安装开发者工具”）
if [ -x "$RT/python/bin/python3" ] || [ -x "$ROOT/.venv/bin/python" ]; then
  echo "[2/4] Python ✓"
else
  echo "[2/4] 下载 Python…"
  PA=$([ "$ARCH" = "arm64" ] && echo aarch64 || echo x86_64)
  F="cpython-$PY_VER+$PY_REL-$PA-apple-darwin-install_only.tar.gz"
  if ! download "$RT/py.tgz" "https://registry.npmmirror.com/-/binary/python-build-standalone/$PY_REL/$F" "https://github.com/astral-sh/python-build-standalone/releases/download/$PY_REL/${F/+/%2B}"; then
    echo "Python 下载失败，请检查网络后重新安装。"; exit 1
  fi
  rm -rf "$RT/python" && tar -xzf "$RT/py.tgz" -C "$RT" && rm -f "$RT/py.tgz"
  echo "[2/4] Python ✓"
fi

# 3. 项目依赖（先用官方源，失败换国内镜像）
echo "[3/4] 安装项目依赖…"
if ! npm install --no-audit --no-fund; then
  echo "官方源太慢或连不上，改用国内镜像…"
  npm install --no-audit --no-fund --registry=https://registry.npmmirror.com || { echo "依赖安装失败，请检查网络后重新安装。"; exit 1; }
fi

# 4. 配音工具 + 渲染浏览器 + 体检
echo "[4/4] 安装配音工具和渲染浏览器…"
node scripts/setup.mjs
