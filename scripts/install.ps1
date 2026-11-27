# 首次安装：装好 Node.js、Python，再安装项目依赖、配音工具、渲染浏览器
$ErrorActionPreference = 'Continue'
[Console]::OutputEncoding = [Text.Encoding]::UTF8
Set-Location (Split-Path $PSScriptRoot -Parent)

function Has($cmd) { [bool](Get-Command $cmd -ErrorAction SilentlyContinue) }
function Refresh-Path {
  $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
}
function Has-RealPython {
  foreach ($c in @('py', 'python')) {
    if (Has $c) {
      $v = & $c --version 2>&1
      if ("$v" -match 'Python 3\.(\d+)' -and [int]$Matches[1] -ge 9) { return $true }
    }
  }
  return $false
}

Write-Host ''
Write-Host '=============================================='
Write-Host '  首次安装（大约 5~15 分钟，取决于网速）'
Write-Host '=============================================='

# 1. Node.js（需要 22.18 以上；没装或太旧都自动装 LTS 版）
function Node-Ok {
  if (-not (Has 'node')) { return $false }
  node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>23||(a===23&&b>=6)||(a===22&&b>=18)?0:1)" 2>$null
  return ($LASTEXITCODE -eq 0)
}
if (-not (Node-Ok)) {
  Write-Host '[1/4] 安装 / 升级 Node.js…'
  if (Has 'winget') {
    winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
    Refresh-Path
  }
}
if (-not (Node-Ok)) {
  Write-Host '没能自动安装新版 Node.js。请打开 https://nodejs.org/zh-cn 下载 LTS 版安装，装好后重新双击“1-首次安装.bat”。' -ForegroundColor Red
  exit 1
}
Write-Host "[1/4] Node.js $(node --version) ✓"

# 2. Python
if (-not (Has-RealPython)) {
  Write-Host '[2/4] 安装 Python…'
  if (Has 'winget') {
    winget install -e --id Python.Python.3.12 --accept-source-agreements --accept-package-agreements
    Refresh-Path
  }
}
if (-not (Has-RealPython)) {
  Write-Host '没能自动安装 Python。请打开 https://www.python.org/downloads/ 下载安装（勾选 Add python.exe to PATH），装好后重新双击“1-首次安装.bat”。' -ForegroundColor Red
  exit 1
}
Write-Host '[2/4] Python ✓'

# 3. 项目依赖（先用官方源，失败就换国内镜像）
Write-Host '[3/4] 安装项目依赖…'
npm install --no-audit --no-fund
if ($LASTEXITCODE -ne 0) {
  Write-Host '官方源太慢或连不上，改用国内镜像…'
  npm install --no-audit --no-fund --registry=https://registry.npmmirror.com
}
if ($LASTEXITCODE -ne 0) {
  Write-Host '依赖安装失败，请检查网络后重新双击“1-首次安装.bat”。' -ForegroundColor Red
  exit 1
}

# 4. 配音工具 + 渲染浏览器 + 体检
Write-Host '[4/4] 安装配音工具和渲染浏览器…'
node scripts/setup.mjs
