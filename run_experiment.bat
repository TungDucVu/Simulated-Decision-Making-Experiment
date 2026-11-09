@echo off
title Decision-Making Experiment Server
echo =======================================================
echo   Launching Decision-Making Experiment Server...
echo =======================================================

where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Starting Node.js server...
    start http://localhost:3000
    node server.js
    goto end
)

where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Starting Python server...
    start http://localhost:3000
    python server.py
    goto end
)

echo Neither Node.js nor Python detected in PATH.
echo Opening index.html directly in your default browser...
start index.html

:end
pause

