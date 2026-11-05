@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Preparando o ASEO pela primeira vez...
  call npm install
)
start "" "http://127.0.0.1:5173/"
call npm run dev -- --host 127.0.0.1
