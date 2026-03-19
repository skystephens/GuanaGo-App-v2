@echo off
REM ============================================
REM 🖥️ Frontend LOCAL - Script de Inicio
REM ============================================
REM Ejecuta solo el frontend (Vite)

title GuanaGO Frontend - Development
color 0C

cls
echo.
echo ╔════════════════════════════════════════╗
echo ║      GuanaGO Frontend - Dev Local      ║
echo ║      Puerto: 5173                      ║
echo ╚════════════════════════════════════════╝
echo.

REM Verificar que estamos en la carpeta raíz
if not exist "package.json" (
    echo ✗ Error: Debes ejecutar este script desde la raíz del proyecto
    echo   Uso: INICIO_FRONTEND.bat
    pause
    exit /b 1
)

REM Instalar dependencias si no existen
if not exist "node_modules" (
    echo 📦 Instalando dependencias...
    call npm install
    if errorlevel 1 (
        echo ✗ Error al instalar dependencias
        pause
        exit /b 1
    )
)

echo.
echo ✓ Iniciando servidor Vite...
echo ✓ Disponible en: http://localhost:5173
echo.
echo 💡 Presiona Ctrl+C para detener
echo.

call npm run dev

pause
