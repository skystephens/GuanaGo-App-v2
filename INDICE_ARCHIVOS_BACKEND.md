# 📇 Índice Completo - GuanaGO Socios Backend

## 🚀 COMIENZA AQUÍ

### **Para Ejecutar (Haz esto primero):**
1. **[INICIO_LOCAL.bat](./INICIO_LOCAL.bat)** ← 🎯 HAGA CLICK AQUI
   - Script Windows que inicia Todo automáticamente
   - Frontend + Backend en dos ventanas
   - Abre navegador automáticamente

### **Documentación Rápida:**
2. **[QUICKSTART_BACKEND.md](./QUICKSTART_BACKEND.md)** - 3 pasos para ejecutar
3. **[README_BACKEND.md](./README_BACKEND.md)** - Overview completo del proyecto

---

## 📋 DOCUMENTACIÓN BACKEND

### Guías de Inicio
- **[backend/INICIO_BACKEND.md](./backend/INICIO_BACKEND.md)** - Guía completa de inicialización
- **[backend/README.md](./backend/README.md)** - README del backend (documentación previa)

### Verificación
- **[VERIFICACION_BACKEND_COMPLETO.md](./VERIFICACION_BACKEND_COMPLETO.md)** - Checklist de todo lo hecho ✅

---

## 💻 ARCHIVOS DE CÓDIGO BACKEND

### Punto de Entrada
- **[backend/server.js](./backend/server.js)** ← ⭐ Express server principal (120 líneas)
  - CORS configurado
  - Middleware setup
  - Route integration
  - Error handling

### Dependencias
- **[backend/package.json](./backend/package.json)** ← npm dependencies
  - express, cors, dotenv, jsonwebtoken, bcryptjs, axios, nodemailer, joi, uuid, airtable

### Configuración
- **[backend/.env.local](./backend/.env.local)** ← Variables de ambiente (ACTUALIZAR con tus datos)
  - PORT, JWT_SECRET, CORS_ORIGINS
  - AIRTABLE_API_KEY, AIRTABLE_BASE_ID
  - EMAIL_SERVICE, EMAIL_USER, EMAIL_PASSWORD

### Rutas
- **[backend/routes/healthRoutes.js](./backend/routes/healthRoutes.js)** ← Health checks (40 líneas)
  - GET /api/health - Status y uptime
  - GET /api/health/ping - Simple ping

- **[backend/routes/partnerRoutes.js](./backend/routes/partnerRoutes.js)** ← ⭐ Rutas de socios (250+ líneas)
  - POST /api/partners/login
  - POST /api/partners/register
  - GET /api/partners/:id
  - PUT /api/partners/:id
  - GET /api/partners/:id/dashboard/stats
  - GET /api/partners/:id/sales/recent
  - GET /api/partners/:id/products/top
  - Y más... (11 endpoints totales)

### Próximamente
- `backend/controllers/` - Controladores de lógica
- `backend/services/` - Servicios (Airtable, Email)
- `backend/middleware/` - Autenticación y validación

---

## ⚛️ ARCHIVOS DE CÓDIGO FRONTEND

### Componentes React
- **[pages/PartnerDashboard.tsx](./pages/PartnerDashboard.tsx)** - Dashboard de socios (400 líneas)
  - Estadísticas en tiempo real
  - Gráficos de rendimiento
  - Listado de ventas recientes
  - Top 5 productos

- **[pages/PartnerSettings.tsx](./pages/PartnerSettings.tsx)** - Configuración de socios (700 líneas)
  - 4 tabs: Perfil, Negocio, Pagos, Notificaciones
  - Formas editables
  - Guardado automático

### Servicio API
- **[services/partnerService.ts](./services/partnerService.ts)** - Cliente API completo (450 líneas)
  - Métodos para todos los endpoints
  - Manejo de autenticación
  - Gestión de tokens
  - Error handling

---

## 📚 DOCUMENTACIÓN COMPLETA

### Arquitectura y Diseño
- **[ARQUITECTURA_SISTEMA_COMPLETO.md](./ARQUITECTURA_SISTEMA_COMPLETO.md)** - Arquitectura del sistema
- **[MAPA_MENTAL_ANATO_2026.md](./MAPA_MENTAL_ANATO_2026.md)** - Mapa conceptual del proyecto
- **[HOJA_RUTA_2026_ANATO.md](./HOJA_RUTA_2026_ANATO.md)** - Roadmap 2026

### Base de Datos
- **[AIRTABLE_CONFIG_LOCAL.md](./AIRTABLE_CONFIG_LOCAL.md)** - Schema de Airtable (4 tablas, 65+ campos)
- **[MAPEO_AIRTABLE_CODIGO.md](./MAPEO_AIRTABLE_CODIGO.md)** - Mapeo entre código y Airtable

### Guías de Implementación
- **[GUIA_DASHBOARD_SOCIOS.md](./GUIA_DASHBOARD_SOCIOS.md)** - Guía del dashboard
- **[GUIA_TECNICA_ALOJAMIENTOS_v2.md](./GUIA_TECNICA_ALOJAMIENTOS_v2.md)** - Tech guide alojamientos
- **[GUIA_INTEGRACION_WORDPRESS.md](./GUIA_INTEGRACION_WORDPRESS.md)** - Integración WordPress

### Setup y Configuración
- **[SETUP_LOCAL.md](./SETUP_LOCAL.md)** - Configuración local completa
- **[TROUBLESHOOTING_LOCAL.md](./TROUBLESHOOTING_LOCAL.md)** - Solución de problemas
- **[README_DEPLOY.md](./README_DEPLOY.md)** - Deploy a producción
- **[PWA_CACHE_TECNICO.md](./PWA_CACHE_TECNICO.md)** - PWA cache técnico

---

## 🔧 SCRIPTS Y CONFIGURACIÓN

### Scripts de Inicio (Windows)
- **[INICIO_LOCAL.bat](./INICIO_LOCAL.bat)** - Inicia Frontend + Backend
- **[backend/INICIO_BACKEND.bat](./backend/INICIO_BACKEND.bat)** - Solo Backend (si existe)

### Scripts de Inicio (Mac/Linux)
- **[INICIO_LOCAL.sh](./INICIO_LOCAL.sh)** - Version para Mac/Linux
- **[backend/INICIO_BACKEND.sh](./backend/INICIO_BACKEND.sh)** - Solo Backend

### Docker
- **[docker-compose.yml](./docker-compose.yml)** - Docker Compose para dev
- **[Dockerfile.frontend](./Dockerfile.frontend)** - Image para frontend
- **[backend/Dockerfile](./backend/Dockerfile)** - Image para backend

### Configuración Frontend
- **[vite.config.ts](./vite.config.ts)** - Configuración Vite
- **[tsconfig.json](./tsconfig.json)** - TypeScript config
- **[package.json](./package.json)** - Dependencias frontend
- **[.env.local](./.env.local)** - Variables de ambiente frontend (si existe)

---

## 📊 ARCHIVOS DE ANÁLISIS

### Documentos de Contexto
- **[DISTINCION_ROLES_B2B_B2C.md](./DISTINCION_ROLES_B2B_B2C.md)** - Diferencia entre roles
- **[GUIA_ALIADOS_LOCALES_B2B.md](./GUIA_ALIADOS_LOCALES_B2B.md)** - Guía aliados locales
- **[PANEL_UNIFICADO_GUIA.md](./PANEL_UNIFICADO_GUIA.md)** - Guía panel unificado

### Documentos de Negocio
- **[FOLLETO_ANATO_2026_CONTENIDO.md](./FOLLETO_ANATO_2026_CONTENIDO.md)** - Contenido folleto
- **[Modelos de negocio extra 1901.md](./Modelos%20de%20negocio%20extra%201901.md)** - Modelos de negocio
- **[RIMM_NFT_STRATEGY.md](./RIMM_NFT_STRATEGY.md)** - Estrategia NFT

### Documentos de Sesiones
- **[RESUMEN_SESION_16ENE.md](./RESUMEN_SESION_16ENE.md)** - Resumen sesión 16 Ene
- **[RESUMEN_SESION_20ENE_GUIASAI.md](./RESUMEN_SESION_20ENE_GUIASAI.md)** - Resumen sesión 20 Ene

---

## 🎯 RESÚMENES EJECUTIVOS

- **[RESUMEN_EJECUTIVO_90_DIAS.md](./RESUMEN_EJECUTIVO_90_DIAS.md)** - Plan 90 días
- **[RESUMEN_EJECUTIVO_ALOJAMIENTOS_v2.md](./RESUMEN_EJECUTIVO_ALOJAMIENTOS_v2.md)** - Alojamientos
- **[RESUMEN_EJECUTIVO_GUIASAI_B2B.md](./RESUMEN_EJECUTIVO_GUIASAI_B2B.md)** - GuiasAI B2B
- **[RESUMEN_VERSION_LOCAL.md](./RESUMEN_VERSION_LOCAL.md)** - Resumen versión local
- **[ESTADO_PROYECTO_2026.md](./ESTADO_PROYECTO_2026.md)** - Estado del proyecto

---

## 🎨 VISUALES Y DIAGRAMAS

- **[MAPA_MENTAL_VISUAL.md](./MAPA_MENTAL_VISUAL.md)** - Mapa visual del proyecto
- **[PANEL_UNIFICADO_VISUAL.md](./PANEL_UNIFICADO_VISUAL.md)** - Panel visual
- **[MAPA_UBICACION_ALOJAMIENTOS.md](./MAPA_UBICACION_ALOJAMIENTOS.md)** - Mapa de ubicaciones
- **[HOTEL_DETAIL_DATA_FLOW_DIAGRAM.md](./HOTEL_DETAIL_DATA_FLOW_DIAGRAM.md)** - Data flow diagrama

---

## 🗂️ ESTRUCTURA DE CARPETAS

```
GuanaGo-App-Enero-main/
├── 📄 README_BACKEND.md                     ← Lee esto
├── 📄 QUICKSTART_BACKEND.md                 ← O esto
├── 📄 VERIFICACION_BACKEND_COMPLETO.md      ← O esto
├── 📄 INICIO_LOCAL.bat                      ← Ejecuta esto ⭐
├── 📄 package.json                          (Frontend)
├── 📄 vite.config.ts
├── 📄 tsconfig.json
├── 📄 index.tsx
├── 📄 index.html
│
├── 📁 backend/
│   ├── 📄 server.js                         ⭐ Express server
│   ├── 📄 package.json                      ⭐ Dependencies
│   ├── 📄 .env.local                        ⭐ Configuración
│   ├── 📄 INICIO_BACKEND.md                 ⭐ Guía
│   ├── 📁 routes/
│   │   ├── healthRoutes.js                  ⭐ Health checks
│   │   └── partnerRoutes.js                 ⭐ Rutas socios
│   ├── 📁 controllers/
│   ├── 📁 services/
│   └── 📁 middleware/
│
├── 📁 pages/
│   ├── PartnerDashboard.tsx                 ⭐ Dashboard
│   └── PartnerSettings.tsx                  ⭐ Settings
│
├── 📁 services/
│   └── partnerService.ts                    ⭐ API client
│
├── 📁 components/
├── 📁 context/
└── 📁 styles/
```

---

## 🎓 GUÍA DE LECTURA RECOMENDADA

**Si es tu primera vez:**

1. **Comienza aquí:** [QUICKSTART_BACKEND.md](./QUICKSTART_BACKEND.md)
2. **Luego lee:** [README_BACKEND.md](./README_BACKEND.md)
3. **Ejecuta:** [INICIO_LOCAL.bat](./INICIO_LOCAL.bat)
4. **Si hay errores:** [TROUBLESHOOTING_LOCAL.md](./TROUBLESHOOTING_LOCAL.md)
5. **Para entender el sistema:** [ARQUITECTURA_SISTEMA_COMPLETO.md](./ARQUITECTURA_SISTEMA_COMPLETO.md)

**Si necesitas cambiar el código:**

1. **API Endpoints:** [backend/routes/partnerRoutes.js](./backend/routes/partnerRoutes.js)
2. **Frontend:** [services/partnerService.ts](./services/partnerService.ts)
3. **Configuración:** [backend/.env.local](./backend/.env.local)
4. **Base de Datos:** [AIRTABLE_CONFIG_LOCAL.md](./AIRTABLE_CONFIG_LOCAL.md)

**Si necesitas conectar con APIs:**

1. **Airtable:** [AIRTABLE_CONFIG_LOCAL.md](./AIRTABLE_CONFIG_LOCAL.md)
2. **Make.com:** [GUIA_INTEGRACION_WORDPRESS.md](./GUIA_INTEGRACION_WORDPRESS.md)
3. **Email:** [backend/.env.local](./backend/.env.local)

---

## ✅ CHECKLIST ANTES DE EJECUTAR

- [ ] Node.js 18+ instalado (`node --version`)
- [ ] npm 9+ instalado (`npm --version`)
- [ ] Estoy en carpeta correcta: `C:\Users\skysk\OneDrive\Documentos\GuanaGO 2026\GuanaGo-App-Enero-main`
- [ ] Tengo permisos de escritura en la carpeta
- [ ] Puertos 3001 y 5173 están libres
- [ ] He leído al menos QUICKSTART_BACKEND.md

---

## 🚀 PRÓXIMO PASO

**Ejecuta esto en PowerShell:**

```powershell
cd "C:\Users\skysk\OneDrive\Documentos\GuanaGO 2026\GuanaGo-App-Enero-main"
.\INICIO_LOCAL.bat
```

---

## 📊 ESTADÍSTICAS DEL PROYECTO

| Item | Valor |
|------|-------|
| Archivos Backend Creados | 3 |
| Líneas de Código Backend | ~300 |
| Endpoints Implementados | 11 |
| Frontend Components | 2 |
| Documentación Archivos | 25+ |
| Total Líneas Documentación | 30,000+ |
| Status | ✅ Listo para ejecutar |

---

## 🆘 AYUDA RÁPIDA

| Problema | Solución |
|----------|----------|
| Puerto en uso | Ver [TROUBLESHOOTING_LOCAL.md](./TROUBLESHOOTING_LOCAL.md) |
| Node no instalado | Descargar https://nodejs.org/ |
| npm install falla | Eliminar node_modules y package-lock.json |
| Backend no responde | Reiniciar INICIO_LOCAL.bat |
| Frontend en blanco | Abrir F12 y revisar console |
| CORS error | Verificar CORS_ORIGINS en backend/.env.local |

---

**Última actualización:** Enero 2026  
**Versión:** 1.0.0 - Backend Funcional ✅
