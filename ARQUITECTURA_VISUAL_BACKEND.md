# 🏗️ Diagrama de Arquitectura - GuanaGO Socios Backend

## Sistema Completo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                        🌐 FRONTEND (React + Vite)                          │
│                        http://localhost:5173                               │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ • PartnerDashboard.tsx (400 líneas)                                 │  │
│  │   - Estadísticas en tiempo real                                     │  │
│  │   - Gráficos de rendimiento                                         │  │
│  │   - Ventas recientes                                                │  │
│  │   - Top productos                                                   │  │
│  │                                                                      │  │
│  │ • PartnerSettings.tsx (700 líneas)                                  │  │
│  │   - Perfil del negocio                                              │  │
│  │   - Información de pagos                                            │  │
│  │   - Preferencias de notificaciones                                  │  │
│  │                                                                      │  │
│  │ • partnerService.ts (450 líneas)                                    │  │
│  │   - Cliente API completo                                            │  │
│  │   - 20+ métodos                                                     │  │
│  │   - Manejo de autenticación                                         │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│                   📡 HTTP Requests / JSON Responses                         │
│                            (CORS Enabled)                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                      🔧 BACKEND (Express + Node.js)                        │
│                      http://localhost:3001/api                             │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                      server.js (120 líneas)                         │  │
│  │                      Express Entry Point                            │  │
│  │                                                                      │  │
│  │  • CORS Middleware (localhost:5173)                                 │  │
│  │  • Body Parser (JSON/URL-encoded)                                   │  │
│  │  • Request Logger                                                   │  │
│  │  • Error Handler                                                    │  │
│  │  • Graceful Shutdown                                                │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌────────────────────────────┬────────────────────────────────────────┐  │
│  │    routes/healthRoutes.js   │   routes/partnerRoutes.js             │  │
│  │    (40 líneas)             │   (250+ líneas)                       │  │
│  │                             │                                        │  │
│  │ GET /api/health             │ POST   /api/partners/login            │  │
│  │ • Status                    │ POST   /api/partners/register         │  │
│  │ • Uptime                    │ GET    /api/partners/:id              │  │
│  │ • Environment               │ PUT    /api/partners/:id              │  │
│  │ • Timestamp                 │ GET    /api/partners/:id/dashboard... │  │
│  │                             │ GET    /api/partners/:id/sales/recent │  │
│  │ GET /api/health/ping        │ GET    /api/partners/:id/products/top │  │
│  │ • Simple ping               │ GET    /api/partners/:id/products     │  │
│  │                             │ POST   /api/partners/:id/products     │  │
│  │                             │ GET    /api/partners/:id/sales        │  │
│  │                             │ GET    /api/partners/:id/payouts      │  │
│  │                             │                                        │  │
│  │                             │ Mock Data:                             │  │
│  │                             │ • 1 Hotel (Hotel Paraíso)              │  │
│  │                             │ • 2 Productos                          │  │
│  │                             │ • Multiple Sales                       │  │
│  │                             │ • Statistics                           │  │
│  └────────────────────────────┴────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │            Próximamente:                                            │  │
│  │  • controllers/                                                     │  │
│  │  • services/                                                        │  │
│  │  • middleware/                                                      │  │
│  │  • Airtable Integration                                             │  │
│  │  • JWT Authentication                                               │  │
│  │  • Input Validation (Joi)                                           │  │
│  │  • Error Handling                                                   │  │
│  │  • Make.com Webhooks                                                │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │            Configuration:                                           │  │
│  │  • .env.local                                                       │  │
│  │    - NODE_ENV, PORT                                                 │  │
│  │    - JWT_SECRET, JWT_EXPIRATION                                     │  │
│  │    - CORS_ORIGINS                                                   │  │
│  │    - AIRTABLE_API_KEY, AIRTABLE_BASE_ID                             │  │
│  │    - EMAIL_SERVICE, EMAIL_USER                                      │  │
│  │    - MAKE_WEBHOOK_URLs                                              │  │
│  │                                                                      │  │
│  │  • package.json                                                     │  │
│  │    - express, cors, dotenv                                          │  │
│  │    - jsonwebtoken, bcryptjs                                         │  │
│  │    - axios, nodemailer, joi, uuid, airtable                         │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                    💾 DATA LAYER (Airtable)                                │
│                    Próximamente conectar                                    │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │ Tables Needed:                                                     │   │
│  │                                                                    │   │
│  │ • Partners_Aliados                                                │   │
│  │   - ID, BusinessName, Email, Phone, Category, Commission, Status  │   │
│  │                                                                    │   │
│  │ • PartnerProducts                                                 │   │
│  │   - ID, PartnerID, Name, Price, Status, Sales, Revenue           │   │
│  │                                                                    │   │
│  │ • PartnerSales                                                    │   │
│  │   - ID, PartnerID, ProductID, Amount, Date, Status               │   │
│  │                                                                    │   │
│  │ • PartnerPayouts                                                  │   │
│  │   - ID, PartnerID, Amount, Status, Date                           │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘


## Request/Response Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│          USER INTERACTS WITH FRONTEND (React)                  │
│                                                                 │
│  1. Click "Login"                                              │
│  2. Enter Email & Password                                     │
│  3. Click "Sign In"                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Frontend partnerService.ts CALLS Backend API                 │
│                                                                 │
│   POST http://localhost:3001/api/partners/login                │
│                                                                 │
│   Headers:                                                      │
│     Content-Type: application/json                             │
│                                                                 │
│   Body:                                                         │
│   {                                                             │
│     "email": "socio@test.com",                                 │
│     "password": "Test123456!"                                  │
│   }                                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Backend Express RECEIVES Request                             │
│                                                                 │
│   1. CORS Middleware allows request                            │
│   2. Body Parser extracts JSON                                 │
│   3. Request Logger logs: POST /api/partners/login             │
│   4. Route Handler processes request                           │
│   5. Validates inputs                                          │
│   6. Checks credentials against mock data                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Backend SENDS Response                                       │
│                                                                 │
│   HTTP 200 OK                                                  │
│                                                                 │
│   {                                                             │
│     "success": true,                                           │
│     "token": "eyJhbGciOiJIUzI1NiIs...",                        │
│     "partner": {                                               │
│       "id": "rec123abc",                                       │
│       "businessName": "Hotel Paraíso",                         │
│       "email": "socio@test.com",                               │
│       "rating": 4.5                                            │
│     }                                                           │
│   }                                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Frontend partnerService.ts RECEIVES Response                 │
│                                                                 │
│   1. Store token in localStorage                               │
│   2. Store partner info in state                               │
│   3. Redirect to Dashboard                                     │
│   4. React renders PartnerDashboard component                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│          USER SEES DASHBOARD                                   │
│                                                                 │
│  ✓ Welcome, Juan Pérez!                                        │
│  ✓ Revenue: $18,840,000                                        │
│  ✓ Sales: 127                                                  │
│  ✓ Products: 2                                                 │
│  ✓ Rating: 4.7/5                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```


## Technology Stack

```
FRONTEND LAYER
├── React 18+
├── TypeScript 5+
├── Vite 5+ (Build tool)
├── Tailwind CSS (Styling)
├── Lucide React (Icons)
└── Axios (HTTP requests)

BACKEND LAYER
├── Node.js 18+
├── Express 4.18.2 (Web framework)
├── CORS (Cross-origin requests)
├── dotenv (Environment variables)
├── jsonwebtoken (JWT tokens)
└── bcryptjs (Password hashing)

DEPENDENCIES
├── axios (HTTP client)
├── nodemailer (Email sending)
├── joi (Input validation)
├── uuid (ID generation)
└── airtable (Database client)

DEV TOOLS
├── nodemon (Auto-reload)
├── npm (Package manager)
├── Docker (Containerization)
└── VS Code (IDE)

OPTIONAL INTEGRATIONS
├── Airtable (Database)
├── Make.com (Webhooks)
├── Mapbox (Maps)
└── Gemini (AI)
```


## Deployment Architecture

```
┌──────────────────────────────────────────────────────┐
│                   RENDER.COM                         │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │ Frontend Service (Vite SPA)                    │ │
│  │ https://guanago-socios.onrender.com            │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │ Backend Service (Express API)                  │ │
│  │ https://api.guanago-socios.onrender.com        │ │
│  │ /api/partners/*                                │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│                AIRTABLE CLOUD                        │
│                                                      │
│  Base: GuanaGO Socios                               │
│  Tables:                                             │
│    • Partners_Aliados                                │
│    • PartnerProducts                                 │
│    • PartnerSales                                    │
│    • PartnerPayouts                                  │
│                                                      │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│                MAKE.COM                              │
│                                                      │
│  Webhooks:                                           │
│    • New Partner                                     │
│    • New Sale                                        │
│    • Payout Request                                  │
│                                                      │
└──────────────────────────────────────────────────────┘
```


## File Structure

```
GuanaGo-App-Enero-main/
│
├── 📄 LEER_PRIMERO.txt                    (Quick instructions)
├── 📄 README_INICIO.txt                   (ASCII instructions)
├── 📄 QUICKSTART_BACKEND.md               (3 steps guide)
├── 📄 README_BACKEND.md                   (Complete overview)
├── 📄 RESUMEN_BACKEND_COMPLETADO.md       (Summary)
├── 📄 INDICE_ARCHIVOS_BACKEND.md          (File index)
├── 📄 VERIFICACION_BACKEND_COMPLETO.md    (Checklist)
├── 📄 INICIO_LOCAL.bat                    (Windows startup script)
│
├── 📁 backend/
│   ├── 📄 server.js                       (Express server)
│   ├── 📄 package.json                    (Dependencies)
│   ├── 📄 .env.local                      (Configuration)
│   ├── 📄 INICIO_BACKEND.md               (Backend guide)
│   │
│   ├── 📁 routes/
│   │   ├── 📄 healthRoutes.js             (Health checks)
│   │   ├── 📄 partnerRoutes.js            (Partner API)
│   │   └── 📄 [other routes]
│   │
│   ├── 📁 controllers/                    (Ready to add)
│   ├── 📁 services/                       (Ready to add)
│   └── 📁 middleware/                     (Ready to add)
│
├── 📁 pages/
│   ├── PartnerDashboard.tsx
│   └── PartnerSettings.tsx
│
├── 📁 services/
│   └── partnerService.ts
│
├── 📁 components/
├── 📁 context/
└── 📁 styles/
```

---

## Development Workflow

```
1. START
   ↓
2. Execute .\INICIO_LOCAL.bat
   ↓
3. Wait for 2 terminals to open
   ↓
4. Frontend loads at http://localhost:5173
   ↓
5. Backend runs at http://localhost:3001
   ↓
6. Login with test credentials
   ↓
7. Navigate dashboard
   ↓
8. Open DevTools (F12) to debug
   ↓
9. Check backend logs in terminal
   ↓
10. Make changes to code
   ↓
11. Frontend auto-reloads (hot reload)
   ↓
12. Backend auto-reloads (nodemon)
   ↓
13. Test new features
   ↓
14. Repeat until satisfied
   ↓
15. Ready for production
```

---

**Versión:** 1.0.0  
**Estado:** ✅ Completado y Funcional  
**Última Actualización:** Enero 2026
