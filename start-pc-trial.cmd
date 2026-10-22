@echo off
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel% equ 0 (
  py -3 launch-pc-trial.py
) else (
  python launch-pc-trial.py
)
if errorlevel 1 (
  echo Install Python 3, or see PC_TRIAL_START.md.
  pause
)
