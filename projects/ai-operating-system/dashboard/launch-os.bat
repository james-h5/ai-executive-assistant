@echo off
REM ─────────────────────────────────────────────────────────────
REM  James OS — Auto Launcher
REM
REM  TO AUTO-LAUNCH ON STARTUP:
REM  1. Right-click this file → Create Shortcut
REM  2. Move the shortcut to:
REM     %APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
REM ─────────────────────────────────────────────────────────────

cd /d "%~dp0"

REM Kill any stale Python server on port 8000
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":8000 "') do (
    taskkill /F /PID %%a >nul 2>&1
)

REM Start Python HTTP server silently in the background
START "" /B python -m http.server 8000 >nul 2>&1

REM Wait 2 seconds for the server to be ready
timeout /t 2 /nobreak >nul

REM Open in kiosk mode (no address bar, fullscreen feel)
set CHROME="C:\Program Files\Google\Chrome\Application\chrome.exe"
set EDGE="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

if exist %CHROME% (
    START "" %CHROME% --kiosk --app=http://localhost:8000
) else if exist %EDGE% (
    START "" %EDGE% --kiosk --app=http://localhost:8000
) else (
    START http://localhost:8000
)
