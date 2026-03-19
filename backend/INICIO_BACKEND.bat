@echo off
REM ============================================
REM 🖥️ Backend LOCAL - Script de Inicio
REM ============================================
REM Ejecuta solo el backend (Express)

title GuanaGO Backend - Development
color 0B

cls
echo.
echo ╔════════════════════════════════════════╗
echo ║      GuanaGO Backend - Dev Local       ║
echo ║      Puerto: 3001                      ║
echo ╚════════════════════════════════════════╝
echo.

REM Verificar que estamos en el directorio backend
if not exist "package.json" (
    echo ✗ Error: Debes ejecutar este script desde la carpeta 'backend'
    echo   Uso: cd backend && INICIO_BACKEND.bat
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
echo ✓ Iniciando servidor backend...
echo ✓ Escuchando en: http://localhost:3001
echo ✓ API disponible en: http://localhost:3001/api
echo.
echo 💡 Presiona Ctrl+C para detener
echo.

call npm run dev

pause
