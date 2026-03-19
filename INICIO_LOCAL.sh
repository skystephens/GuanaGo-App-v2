#!/usr/bin/env bash
# ============================================
# 🚀 GuanaGO - Script de Inicio LOCAL (Mac/Linux)
# ============================================
# Este script inicia el frontend y backend automáticamente

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
FRONTEND_PORT=5173
BACKEND_PORT=3001
FRONTEND_URL="http://localhost:$FRONTEND_PORT"
BACKEND_URL="http://localhost:$BACKEND_PORT"

echo ""
echo "╔════════════════════════════════════════╗"
echo "║   GuanaGO - Desarrollo Local (DEV)    ║"
echo "║   Frontend + Backend + Airtable        ║"
echo "╚════════════════════════════════════════╝"
echo ""

echo -e "${GREEN}✓ Frontend ejecutará en:${NC} $FRONTEND_URL"
echo -e "${GREEN}✓ Backend ejecutará en:${NC}  $BACKEND_URL"
echo -e "${GREEN}✓ API disponible en:${NC}     $BACKEND_URL/api"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}✗ Error: No se encontró package.json${NC}"
    echo "  Asegúrate de ejecutar este script desde la raíz del proyecto"
    exit 1
fi

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Instalando dependencias${NC}..."
    npm install
fi

# Verificar backend
if [ ! -f "backend/package.json" ]; then
    echo ""
    echo -e "${YELLOW}⚠ Advertencia: No se encontró backend/package.json${NC}"
    echo "  Se iniciará solo el frontend"
    echo "  Para iniciar el backend manualmente, ejecuta: cd backend && npm install && npm start"
    echo ""
fi

# Limpiar pantalla
clear

echo ""
echo "╔════════════════════════════════════════╗"
echo "║        Iniciando ambiente local...     ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Función para manejar Ctrl+C
cleanup() {
    echo ""
    echo -e "${YELLOW}Deteniendo servicios...${NC}"
    kill $FRONTEND_PID $BACKEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT

# Iniciar Frontend
echo -e "${BLUE}📦 Iniciando Frontend (Vite)...${NC}"
npm run dev &
FRONTEND_PID=$!

sleep 3

# Iniciar Backend
if [ -f "backend/package.json" ]; then
    echo -e "${BLUE}📦 Iniciando Backend (Express)...${NC}"
    (cd backend && npm run dev) &
    BACKEND_PID=$!
fi

sleep 2

echo ""
echo "╔════════════════════════════════════════╗"
echo "║        ✓ Servicios iniciados           ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}🌐 Frontend:${NC} $FRONTEND_URL"
echo -e "${GREEN}🔌 Backend:${NC}  $BACKEND_URL"
echo -e "${GREEN}📚 API Docs:${NC} $BACKEND_URL/api/docs (si está disponible)"
echo ""
echo "💡 Consejos:"
echo "   - Abre el navegador y ve a: $FRONTEND_URL"
echo "   - Para detener, presiona Ctrl+C"
echo "   - Los cambios en código se reflejarán automáticamente (Hot Reload)"
echo "   - Si algo no funciona, revisa: SETUP_LOCAL.md"
echo ""

# Esperar a que los procesos terminen
wait $FRONTEND_PID $BACKEND_PID
