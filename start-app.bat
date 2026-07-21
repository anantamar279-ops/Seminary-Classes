@echo off
cd /d "%~dp0"
C:\Python314\python.exe -m http.server 5500 --bind 127.0.0.1
pause
