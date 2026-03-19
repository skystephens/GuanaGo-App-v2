# ⚡ Inicio Rápido - GuanaGO Socios Backend

## 🎯 En 3 Pasos

### Paso 1: Abre PowerShell
```powershell
# Navega a la carpeta del proyecto
cd "C:\Users\skysk\OneDrive\Documentos\GuanaGO 2026\GuanaGo-App-Enero-main"
```

### Paso 2: Ejecuta el Script de Inicio
```powershell
.\INICIO_LOCAL.bat
```

**Esto hará automáticamente:**
- ✅ Verifica Node.js y npm
- ✅ Instala dependencias del backend (si falta)
- ✅ Instala dependencias del frontend (si faltan)
- ✅ Libera puertos 3001 y 5173 si están ocupados
- ✅ Inicia Backend en ventana nueva (Puerto 3001)
- ✅ Inicia Frontend en ventana nueva (Puerto 5173)
- ✅ Abre navegador automáticamente

### Paso 3: ¡Listo! Accede a:
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3001/api
- **Health Check:** http://localhost:3001/api/health

---

## 🚀 Opción Manual (Si el script no funciona)

### Terminal 1: Backend
```bash
cd backend
npm install
npm run dev
```

Debería ver:
```
╔════════════════════════════════════════╗
║      GuanaGO Backend Server 🚀        ║
╚════════════════════════════════════════╝

✓ Servidor escuchando en: http://localhost:3001
✓ API base: http://localhost:3001/api
✓ Health check: http://localhost:3001/api/health
```

### Terminal 2: Frontend
```bash
npm install
npm run dev
```

Debería ver:
```
  VITE v5.x.x  ready in ... ms

  ➜  Local:   http://localhost:5173/
  ➜  press h + enter to show help
```

---

## 🧪 Pruebas de Conexión

### Test Backend (Terminal 3)
```bash
# Health check
curl http://localhost:3001/api/health

# Root API
curl http://localhost:3001/api

# Login de prueba
curl -X POST http://localhost:3001/api/partners/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\": \"socio@test.com\", \"password\": \"Test123456!\"}"
```

### Respuestas Esperadas ✅

**GET /api/health → (200 OK)**
```json
{
  "status": "OK",
  "uptime": 45.231,
  "environment": "development",
  "timestamp": "2024-01-15T14:30:45.123Z"
}
```

**GET /api → (200 OK)**
```json
{
  "name": "GuanaGO Backend API",
  "version": "1.0.0",
  "status": "running",
  "timestamp": "2024-01-15T14:30:45.123Z",
  "endpoints": {
    "health": "/api/health",
    "partners": "/api/partners",
    "docs": "/api/docs"
  }
}
```

**POST /api/partners/login → (200 OK)**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "partner": {
    "id": "rec123abc",
    "businessName": "Hotel Paraíso",
    "contactName": "Juan Pérez",
    "email": "socio@test.com",
    "category": "Alojamiento",
    "commission": 12,
    "status": "active",
    "rating": 4.5
  }
}
```

---

## 📝 Credenciales de Prueba

**Email:** `socio@test.com`
**Contraseña:** `Test123456!`

---

## 🐛 Solución de Problemas

### ❌ "Port 3001 is already in use"

```powershell
# Opción 1: Liberar puerto
netstat -ano | findstr :3001
# Reemplaza XXXX con el número de proceso
taskkill /PID XXXX /F

# Opción 2: Cambiar puerto
$env:PORT=3002
npm run dev
```

### ❌ "Node.js not found"
- Descarga: https://nodejs.org/
- Instala versión LTS (18+)
- Reinicia PowerShell
- Verifica: `node --version`

### ❌ "npm install falla"
```powershell
# Limpia y reinstala
rm -r node_modules, package-lock.json
npm install
```

### ❌ "Veo página en blanco"
1. Abre DevTools: `F12`
2. Ve a pestaña "Console"
3. Busca errores rojos
4. Verifica que Backend está corriendo en 3001
5. Revisa CORS en backend/.env.local

### ❌ "Backend responde en puerto 5000"
- Cierra ambas terminales
- Ejecuta: `netstat -ano | findstr :5000`
- Mata el proceso: `taskkill /PID XXXX /F`
- Vuelve a intentar: `.\INICIO_LOCAL.bat`

---

## 📊 Endpoints Disponibles

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api` | Info del API |
| GET | `/api/health` | Health check |
| POST | `/api/partners/login` | Login socio |
| POST | `/api/partners/register` | Registrar socio |
| GET | `/api/partners/:id` | Obtener perfil |
| PUT | `/api/partners/:id` | Actualizar perfil |
| GET | `/api/partners/:id/dashboard/stats` | Estadísticas |
| GET | `/api/partners/:id/sales/recent` | Ventas recientes |
| GET | `/api/partners/:id/products/top` | Top productos |

---

## 🔐 Estructura del Proyecto

```
GuanaGo-App-Enero-main/
├── INICIO_LOCAL.bat              ← ¡EJECUTA ESTE! 🚀
├── package.json                  ← Frontend
├── vite.config.ts
├── index.tsx
├── tsconfig.json
│
├── backend/
│   ├── package.json             ← Backend
│   ├── server.js                ← Punto de entrada Express
│   ├── .env.local               ← Configuración
│   │
│   ├── routes/
│   │   ├── healthRoutes.js      ← Health checks
│   │   └── partnerRoutes.js     ← Endpoints de socios
│   │
│   ├── controllers/             ← Próximamente
│   ├── services/                ← Próximamente
│   └── middleware/              ← Próximamente
│
├── pages/
│   ├── PartnerDashboard.tsx     ← Componente dashboard
│   └── PartnerSettings.tsx      ← Componente settings
│
├── services/
│   └── partnerService.ts        ← Cliente API
│
├── components/                  ← Componentes compartidos
└── context/                     ← Context API
```

---

## 📚 Documentación Relacionada

- [BACKEND INIT](./backend/INICIO_BACKEND.md) - Guía detallada del backend
- [SETUP LOCAL](./SETUP_LOCAL.md) - Configuración completa
- [ARCHITECTURE](./ARQUITECTURA_SISTEMA_COMPLETO.md) - Arquitectura del sistema
- [TROUBLESHOOTING](./TROUBLESHOOTING_LOCAL.md) - Solución de problemas

---

## ✨ Próximos Pasos Después de Iniciar

1. **Login**: Usa `socio@test.com` / `Test123456!`
2. **Explorar Dashboard**: Ve a http://localhost:5173/dashboard
3. **Ver Datos**: Revisa estadísticas, ventas, productos
4. **Conectar Airtable**: Actualiza credenciales en `backend/.env.local`
5. **Agregar Endpoints**: Crea nuevas rutas en `backend/routes/`

---

## 🆘 ¿Necesitas Ayuda?

1. Revisa `backend/server.js` - Comentarios en cada sección
2. Revisa `backend/routes/partnerRoutes.js` - Ejemplos de endpoints
3. Abre DevTools (F12) y revisa Console
4. Verifica logs en ambas terminales

---

**¡Listo para comenzar! Ejecuta `INICIO_LOCAL.bat` 🚀**
