@echo off
setlocal
cd /d "%~dp0"
py -3 --version >nul 2>&1
if not errorlevel 1 (
  py -3 "%~dp0launch-viewer.py"
  goto finished
)
python --version >nul 2>&1
if not errorlevel 1 (
  python "%~dp0launch-viewer.py"
  goto finished
)
echo Python 3 is required. Install Python 3, then run this file again.
echo See START_HERE.txt for Windows instructions.
:finished
pause
