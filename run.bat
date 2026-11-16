@echo off
title STUDY DASH Server
echo ========================================================
echo   Starting STUDY DASH Local Server...
echo ========================================================

where python >nul 2>nul
if %errorlevel% equ 0 (
    echo Launching with Python...
    start http://localhost:8080
    python server.py
    goto end
)

where node >nul 2>nul
if %errorlevel% equ 0 (
    echo Launching with Node.js...
    start http://localhost:8080
    node server.js
    goto end
)

echo [ERROR] Neither Python nor Node.js was found on PATH.
echo Please install Python (3.8+) or Node.js (18+) to run the local server.
pause

:end

