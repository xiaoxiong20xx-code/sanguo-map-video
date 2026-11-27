@echo off
chcp 65001 >nul
cd /d "%~dp0"
node scripts\guard.mjs && node scripts\make.mjs --open
pause
