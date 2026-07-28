@echo off
title Soundville - Reset Admin Password
cd /d "c:\Users\hramd\Documents\TA dan Outline Dipta\TA CV. Soundville Music Studio\server"

echo.
echo ================================================
echo   Reset Password Admin - Soundville
echo ================================================
echo.
echo PASTIKAN: Laragon sudah dijalankan dan MySQL aktif!
echo.
pause

node scripts/reset-admin.js

echo.
echo ================================================
echo Tekan tombol apa saja untuk keluar...
pause
