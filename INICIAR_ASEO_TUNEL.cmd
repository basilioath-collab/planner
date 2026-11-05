@echo off
setlocal
cd /d "%~dp0"
title ASEO - acesso protegido
if not exist node_modules (
  echo Instalando dependencias...
  call npm install || goto :erro
)
echo Preparando o ASEO...
call npm run build || goto :erro
set /p ASEO_PASSWORD=Senha de acesso do ASEO: 
if "%ASEO_PASSWORD%"=="" exit /b 1
if not exist tools\cloudflared.exe (
  echo Cloudflared nao encontrado em tools\cloudflared.exe.
  echo Baixe a versao oficial para Windows em https://github.com/cloudflare/cloudflared/releases/latest
  goto :erro
)
start "ASEO servidor protegido" /min cmd /c "set ASEO_PASSWORD=%ASEO_PASSWORD%&& node local-server.mjs"
timeout /t 2 /nobreak >nul
echo.
echo ASEO iniciado. O endereco publico aparecera abaixo em https://...trycloudflare.com
echo Mantenha esta janela aberta. Usuario: aseo
echo Pressione Ctrl+C para encerrar o tunel.
echo.
tools\cloudflared.exe tunnel --no-autoupdate --url http://127.0.0.1:4173
exit /b

:erro
echo.
echo Nao foi possivel iniciar o ASEO.
pause
exit /b 1
