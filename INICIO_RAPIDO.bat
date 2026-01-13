@echo off
echo.
echo ========================================
echo   GuanaGO - Inicio Completo
echo ========================================
echo.
echo Abriendo API Tester en navegador...
start backend\api-tester.html
echo.
echo Abriendo documentacion...
start GUIA_INICIO_BACKEND.md
echo.
echo Iniciando servidor backend...
echo.
npm run dev:server
