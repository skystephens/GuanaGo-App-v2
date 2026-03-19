@echo off
REM ============================================
REM 🔍 SCRIPT DE DIAGNÓSTICO - LOCAL
REM ============================================
REM Detecta y soluciona problemas comunes

setlocal enabledelayedexpansion
cls

echo.
echo ╔════════════════════════════════════════╗
echo ║     DIAGNÓSTICO GUANAGO LOCAL          ║
echo ║     Detectando problemas...            ║
echo ╚════════════════════════════════════════╝
echo.

set ERRORS=0

REM ===========================================
REM 1. VERIFICAR NODE.JS
REM ===========================================
echo [1/8] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ✗ ERROR: Node.js no instalado
    set /a ERRORS=%ERRORS%+1
) else (
    for /f "tokens=*" %%i in ('node --version') do echo ✓ Node.js: %%i
)

echo.

REM ===========================================
REM 2. VERIFICAR NPM
REM ===========================================
echo [2/8] Verificando npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ✗ ERROR: npm no instalado
    set /a ERRORS=%ERRORS%+1
) else (
    for /f "tokens=*" %%i in ('npm --version') do echo ✓ npm: %%i
)

echo.

REM ===========================================
REM 3. VERIFICAR ARCHIVOS CLAVE
REM ===========================================
echo [3/8] Verificando archivos...
if not exist "package.json" (
    echo ✗ ERROR: package.json no encontrado
    set /a ERRORS=%ERRORS%+1
) else (
    echo ✓ package.json encontrado
)

if not exist "backend\package.json" (
    echo ✗ ERROR: backend/package.json no encontrado
    set /a ERRORS=%ERRORS%+1
) else (
    echo ✓ backend/package.json encontrado
)

if not exist ".env.local" (
    echo ✗ ERROR: .env.local no encontrado
    set /a ERRORS=%ERRORS%+1
) else (
    echo ✓ .env.local encontrado
)

if not exist "backend\.env.local" (
    echo ✗ ERROR: backend/.env.local no encontrado
    set /a ERRORS=%ERRORS%+1
) else (
    echo ✓ backend/.env.local encontrado
)

echo.

REM ===========================================
REM 4. VERIFICAR node_modules
REM ===========================================
echo [4/8] Verificando dependencias...
if not exist "node_modules" (
    echo ⚠ Falta instalar: npm install
    echo   Ejecutando: npm install
    call npm install >nul 2>&1
    if errorlevel 1 (
        echo ✗ ERROR: No se pudieron instalar dependencias
        set /a ERRORS=%ERRORS%+1
    ) else (
        echo ✓ Dependencias instaladas
    )
) else (
    echo ✓ node_modules encontrado
)

if not exist "backend\node_modules" (
    echo ⚠ Falta instalar: cd backend && npm install
    echo   Ejecutando: cd backend && npm install
    cd backend
    call npm install >nul 2>&1
    cd ..
    if errorlevel 1 (
        echo ✗ ERROR: No se pudieron instalar dependencias backend
        set /a ERRORS=%ERRORS%+1
    ) else (
        echo ✓ Dependencias backend instaladas
    )
) else (
    echo ✓ backend/node_modules encontrado
)

echo.

REM ===========================================
REM 5. VERIFICAR PUERTOS
REM ===========================================
echo [5/8] Verificando puertos...
netstat -ano | findstr :5173 >nul 2>&1
if errorlevel 1 (
    echo ✓ Puerto 5173 disponible
) else (
    echo ⚠ Puerto 5173 en uso (algo está ejecutándose)
)

netstat -ano | findstr :3001 >nul 2>&1
if errorlevel 1 (
    echo ✓ Puerto 3001 disponible
) else (
    echo ⚠ Puerto 3001 en uso (algo está ejecutándose)
)

echo.

REM ===========================================
REM 6. VERIFICAR VITE.CONFIG.TS
REM ===========================================
echo [6/8] Verificando configuración Vite...
if not exist "vite.config.ts" (
    echo ✗ ERROR: vite.config.ts no encontrado
    set /a ERRORS=%ERRORS%+1
) else (
    echo ✓ vite.config.ts encontrado
)

echo.

REM ===========================================
REM 7. VERIFICAR TSCONFIG
REM ===========================================
echo [7/8] Verificando TypeScript...
if not exist "tsconfig.json" (
    echo ✗ ERROR: tsconfig.json no encontrado
    set /a ERRORS=%ERRORS%+1
) else (
    echo ✓ tsconfig.json encontrado
)

echo.

REM ===========================================
REM 8. VERIFICAR BACKEND SERVER.JS
REM ===========================================
echo [8/8] Verificando backend...
if not exist "backend\server.js" (
    echo ✗ ERROR: backend/server.js no encontrado
    set /a ERRORS=%ERRORS%+1
) else (
    echo ✓ backend/server.js encontrado
)

echo.
echo ╔════════════════════════════════════════╗

if %ERRORS% equ 0 (
    echo ║  ✓ TODO PARECE OK                    ║
    echo ║  Puedes ejecutar: INICIO_LOCAL.bat  ║
) else (
    echo ║  ✗ Se encontraron %ERRORS% error(s) ║
    echo ║  Revisa el listado arriba            ║
)

echo ╚════════════════════════════════════════╝
echo.

pause
