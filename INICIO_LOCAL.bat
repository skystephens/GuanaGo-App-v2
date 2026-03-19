@echo off
REM ============================================
REM  GuanaGO Socios - Inicio Local (Windows)
REM  Ejecuta Frontend + Backend automáticamente
REM ============================================

setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║     GuanaGO Socios - Inicio Local Development             ║
echo ║                                                            ║
echo ║     Frontend: http://localhost:5173                        ║
echo ║     Backend:  http://localhost:3001                        ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Detectar el directorio del proyecto
cd /d "%~dp0"

REM Verificar que Node y npm estén instalados
echo [1/5] Verificando Node.js y npm...
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: Node.js no está instalado o no está en PATH
    echo    Descargalo de: https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js detectado

REM Instalar dependencias del backend si no existen
echo.
echo [2/5] Preparando backend...
if not exist "backend\node_modules" (
    echo    Instalando dependencias del backend...
    cd backend
    call npm install >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ ERROR: No se pudieron instalar dependencias del backend
        pause
        exit /b 1
    )
    cd ..
    echo ✓ Backend listo
) else (
    echo ✓ Dependencias del backend ya existen
)

REM Instalar dependencias del frontend si no existen
echo.
echo [3/5] Preparando frontend...
if not exist "node_modules" (
    echo    Instalando dependencias del frontend...
    call npm install >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ ERROR: No se pudieron instalar dependencias del frontend
        pause
        exit /b 1
    )
    echo ✓ Frontend listo
) else (
    echo ✓ Dependencias del frontend ya existen
)

REM Verificar puertos disponibles
echo.
echo [4/5] Verificando puertos...

REM Revisar puerto 3001 (Backend)
netstat -ano | findstr ":3001 " >nul
if %ERRORLEVEL% EQU 0 (
    echo ⚠️  ADVERTENCIA: Puerto 3001 ya está en uso
    echo    Intentando liberar proceso...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001 "') do (
        taskkill /PID %%a /F >nul 2>&1
    )
    timeout /t 1 /nobreak >nul
)

REM Revisar puerto 5173 (Frontend)
netstat -ano | findstr ":5173 " >nul
if %ERRORLEVEL% EQU 0 (
    echo ⚠️  ADVERTENCIA: Puerto 5173 ya está en uso
    echo    Intentando liberar proceso...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173 "') do (
        taskkill /PID %%a /F >nul 2>&1
    )
    timeout /t 1 /nobreak >nul
)
echo ✓ Puertos verificados

REM Iniciar servicios
echo.
echo [5/5] Iniciando servicios...
echo.

REM Iniciar Backend en nueva ventana
echo    🔄 Iniciando Backend en puerto 3001...
start "GuanaGO Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"
timeout /t 2 /nobreak >nul

REM Iniciar Frontend en nueva ventana
echo    🔄 Iniciando Frontend en puerto 5173...
start "GuanaGO Frontend" cmd /k "cd /d "%~dp0" && npm run dev"

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║  ✅ Servicios iniciados correctamente!                     ║
echo ║                                                            ║
echo ║  Frontend:   http://localhost:5173                         ║
echo ║  Backend:    http://localhost:3001/api                     ║
echo ║  Health:     http://localhost:3001/api/health              ║
echo ║                                                            ║
echo ║  Para detener: Cierra ambas ventanas de consola            ║
echo ║  Presiona una tecla para continuar...                      ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Abrir navegador automáticamente
timeout /t 3 /nobreak >nul
start http://localhost:5173
start http://localhost:3001/api/health

pause
    echo ⚠ Advertencia: No se encontró backend\package.json
    echo   Se iniciará solo el frontend
    echo   Para iniciar el backend manualmente, ejecuta: cd backend && npm install && npm start
    echo.
)

REM Limpiar pantalla
cls

echo.
echo ╔════════════════════════════════════════╗
echo ║        Iniciando ambiente local...     ║
echo ╚════════════════════════════════════════╝
echo.

REM Crear ventanas separadas para frontend y backend
echo 📦 Iniciando Frontend (Vite)...
start "GuanaGO Frontend" cmd /k npm run dev

timeout /t 3 /nobreak

if exist "backend\package.json" (
    echo 📦 Iniciando Backend (Express)...
    start "GuanaGO Backend" cmd /k "cd backend && npm run dev"
)

timeout /t 2 /nobreak

echo.
echo ╔════════════════════════════════════════╗
echo ║        ✓ Servicios iniciados           ║
echo ╚════════════════════════════════════════╝
echo.
echo 🌐 Frontend: %FRONTEND_URL%
echo 🔌 Backend:  %BACKEND_URL%
echo 📚 API Docs: %BACKEND_URL%/api/docs (si está disponible)
echo.
echo 💡 Consejos:
echo    - Abre el navegador y ve a: %FRONTEND_URL%
echo    - Para detener, cierra las ventanas de Terminal
echo    - Los cambios en código se reflejarán automáticamente (Hot Reload)
echo    - Si algo no funciona, revisa: SETUP_LOCAL.md
echo.

pause
