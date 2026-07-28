@echo off
title Soundville - Debug & Fix Admin Login
cd /d "c:\Users\hramd\Documents\TA dan Outline Dipta\TA CV. Soundville Music Studio\server"

echo.
echo ================================================
echo   Soundville - Debug ^& Fix Admin Login
echo ================================================
echo.

echo [1] Menjalankan script cek database...
node scripts/check-db.js

echo.
echo [2] Membaca hasil...
if exist scripts\check-result.txt (
    type scripts\check-result.txt
) else (
    echo Hasil tidak ditemukan, ada error saat menjalankan script
)

echo.
echo ================================================
echo Selesai! Tekan tombol apa saja untuk keluar...
pause
