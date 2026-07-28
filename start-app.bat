@echo off
title Soundville Music Studio - Starter
echo.
echo ================================================
echo   Soundville Music Studio - Starting...
echo ================================================
echo.

echo [1/2] Menjalankan Backend (port 5000)...
start "SOUNDVILLE BACKEND" cmd /k "cd /d \"c:\Users\hramd\Documents\TA dan Outline Dipta\TA CV. Soundville Music Studio\server\" && echo Backend sedang starting... && npm run dev"

echo Menunggu backend siap...
timeout /t 3 /nobreak > nul

echo [2/2] Menjalankan Frontend (port 3000)...
start "SOUNDVILLE FRONTEND" cmd /k "cd /d \"c:\Users\hramd\Documents\TA dan Outline Dipta\TA CV. Soundville Music Studio\client\" && echo Frontend sedang starting... && npm run dev"

echo.
echo ================================================
echo   Kedua server sedang berjalan!
echo   Backend  : http://localhost:5000
echo   Frontend : http://localhost:3000
echo.
echo   Login Admin:
echo   Email    : admin@soundville.com
echo   Password : admin123
echo ================================================
echo.
timeout /t 5 /nobreak > nul
start http://localhost:3000
