@echo off
REM Lumina - Quick Launch
cd /d "%~dp0"
start "" /min cmd /c "npm run build >nul 2>&1 && npx cross-env NODE_ENV=production electron ."

