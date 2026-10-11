@echo off
setlocal
echo Installing XPM...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo Installation encountered an error.
) else (
    echo.
    echo Installation complete.
)
pause
