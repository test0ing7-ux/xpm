@echo off
setlocal
echo Uninstalling XPM...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0uninstall.ps1"
echo.
echo Uninstallation finished.
pause
