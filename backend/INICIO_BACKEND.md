# 🚀 Inicio Rápido Backend - GuanaGO Socios

## 1️⃣ Instalación de Dependencias

```bash
cd backend
npm install
```

## 2️⃣ Configurar Archivo .env

Copia el contenido en `backend/.env.local` (si no existe):

```bash
NODE_ENV=development
PORT=3001
JWT_SECRET=your_jwt_secret_key_here_min_32_characters_long
JWT_EXPIRATION=30d
CORS_ORIGINS=http://localhost:5173,http://localhost:5000
AIRTABLE_API_KEY=your_airtable_api_key_here
AIRTABLE_BASE_ID=your_base_id_here
ENVIRONMENT=local
```

## 3️⃣ Iniciar Backend

**Opción A: Desarrollo (con auto-reload)**
```bash
npm run dev
```

**Opción B: Producción**
```bash
npm start
```

## 4️⃣ Verificar que Funciona

Abre en tu navegador o con curl:

```bash
# Health check
curl http://localhost:3001/api/health

# Root API
curl http://localhost:3001/api

# Login
curl -X POST http://localhost:3001/api/partners/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "socio@test.com",
    "password": "Test123456!"
  }'
```

**Respuestas esperadas:**

✅ Health Check (200):
```json
{
  "status": "OK",
  "uptime": 45.2,
  "environment": "development",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

✅ API Root (200):
```json
{
  "name": "GuanaGO Backend API",
  "version": "1.0.0",
  "status": "running",
  "endpoints": {
    "health": "/api/health",
    "partners": "/api/partners"
  }
}
```

✅ Login (200):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "partner": {
    "id": "rec123abc",
    "businessName": "Hotel Paraíso",
    ...
  }
}
```

## Endpoints Disponibles

### Autenticación
- `POST /api/partners/login` - Iniciar sesión
- `POST /api/partners/register` - Registrarse

### Dashboard
- `GET /api/partners/:id/dashboard/stats` - Estadísticas del dashboard
- `GET /api/partners/:id/sales/recent` - Ventas recientes
- `GET /api/partners/:id/products/top` - Productos top

### Perfil
- `GET /api/partners/:id` - Obtener perfil
- `PUT /api/partners/:id` - Actualizar perfil

### Productos
- `GET /api/partners/:id/products` - Listar productos
- `POST /api/partners/:id/products` - Crear producto

### Ventas
- `GET /api/partners/:id/sales` - Listar ventas

### Pagos
- `GET /api/partners/:id/payouts` - Obtener pagos pendientes

## Solución de Problemas

**Puerto 3001 ya está en uso:**
```bash
# Encuentra el proceso
netstat -ano | findstr :3001

# O cambia el puerto
$env:PORT=3002
npm start
```

**Módulos no encontrados:**
```bash
# Limpia y reinstala
rm -r node_modules package-lock.json
npm install
```

**CORS errors:**
- Verifica que frontend esté en http://localhost:5173
- Revisa CORS_ORIGINS en .env

**No responde:**
- Verifica que el servidor está corriendo
- Revisa que estés en http://localhost:3001 (no 5000)
- Mira los logs en la consola

## Desarrollo

Estructura del backend:
```
backend/
├── server.js                 # Entry point
├── package.json             # Dependencias
├── .env.local              # Configuración
├── routes/
│   ├── healthRoutes.js     # Health checks
│   └── partnerRoutes.js    # Partner endpoints
├── controllers/            # Lógica de negocios
├── services/              # Servicios (Airtable, etc)
└── middleware/            # Custom middleware
```

Para agregar nuevos endpoints:
1. Crea en `routes/`
2. Luego en `server.js` añade: `app.use('/api/ruta', require('./routes/...'))`
3. Reinicia con `npm run dev`

## Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|------------|---------|
| `NODE_ENV` | Ambiente | `development` |
| `PORT` | Puerto | `3001` |
| `JWT_SECRET` | Secret para tokens | `supersecret123` |
| `CORS_ORIGINS` | Origins CORS | `http://localhost:5173` |
| `AIRTABLE_API_KEY` | API Key Airtable | `key...` |
| `AIRTABLE_BASE_ID` | Base ID | `app...` |

## Comandos npm

```bash
npm start          # Iniciar producción
npm run dev        # Iniciar desarrollo con nodemon
npm test           # Ejecutar tests (cuando existan)
```

## Para Comenzar (Windows)

```powershell
# Abre PowerShell y navega a la carpeta del proyecto

# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend
npm install
npm run dev

# Luego abre en navegador:
# http://localhost:5173 - Frontend
# http://localhost:3001/api - Backend
```

¡Listo! El backend está corriendo en http://localhost:3001 🎉
