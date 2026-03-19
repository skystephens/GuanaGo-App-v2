# 🎨 Diagramas Visuales - Backend Socios

> Representación gráfica de flujos, arquitectura y componentes  
> Enero 2026

---

## 1️⃣ ARQUITECTURA GENERAL

```
                    ┌─────────────────────────────────────┐
                    │    PORTAL SOCIOS (React + TS)       │
                    │                                     │
                    │  • Dashboard                        │
                    │  • Mis Productos                    │
                    │  • Mis Ventas                       │
                    │  • Pagos & Comisiones              │
                    │  • Mi QR                            │
                    │  • Configuración                    │
                    └────────────┬────────────────────────┘
                                 │ JWT Token
                                 │ (Authorization: Bearer ...)
                                 ▼
        ┌────────────────────────────────────────────────────────┐
        │                 BACKEND EXPRESS (3001)                 │
        │                                                        │
        │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐   │
        │  │   Routes     │  │ Controllers  │  │ Services   │   │
        │  │              │  │              │  │            │   │
        │  │ • auth       │  │ • authCtrl   │  │ • airtable │   │
        │  │ • partners   │  │ • partnersCtrl│ │ • jwt      │   │
        │  │ • products   │  │ • productsCtrl│ │ • email    │   │
        │  │ • sales      │  │ • salesCtrl   │ │ • retry    │   │
        │  │ • payouts    │  │               │  │            │   │
        │  │ • webhooks   │  │               │  │            │   │
        │  └──────────────┘  └──────────────┘  └────────────┘   │
        │         │                                              │
        │         └──────────────────┬───────────────────────────┘
        │                            │
        └────────────────────────────┼───────────────────────────┘
                                     │
                ┌────────────────────┼────────────────────┐
                │                    │                    │
                ▼                    ▼                    ▼
         ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
         │  AIRTABLE    │    │  MAKE.COM    │    │   GROQ AI    │
         │              │    │  WEBHOOKS    │    │   CHATBOT    │
         │ • Partners   │    │              │    │              │
         │ • Products   │    │ • Enrich     │    │ • Context    │
         │ • Sales      │    │ • Validate   │    │ • Q&A        │
         │ • Payouts    │    │ • GuiaSAI    │    │ • Support    │
         └──────────────┘    │   Sync       │    └──────────────┘
                             └────────┬─────┘
                                      │
                                      ▼
                             ┌──────────────────┐
                             │   GUIASAI B2B    │
                             │                  │
                             │ • Products       │
                             │ • Portafolio     │
                             │ • Landing Pages  │
                             │ • Search Index   │
                             └──────────────────┘
```

---

## 2️⃣ FLUJO DE AUTENTICACIÓN

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO COMPLETO DE LOGIN                      │
└─────────────────────────────────────────────────────────────────┘

    ALIADO ACCEDE A PORTAL
           │
           ▼
    ┌─────────────────┐
    │ Email + Password│
    └────────┬────────┘
             │
             ▼
    ✓ Validar formato
    ✓ Conectar Airtable
    ✓ Buscar Partner
           │
           ▼
    ¿Email existe?
    │
    ├─ NO → ❌ 401 Inválido
    │
    └─ SÍ ↓
       ✓ Hash = bcrypt.compare()
           │
           ▼
       ¿Contraseña correcta?
       │
       ├─ NO → ❌ 401 Inválido
       │
       └─ SÍ ↓
          ✓ Status = 'approved'?
              │
              ├─ NO → ❌ 403 Pending/Rejected
              │
              └─ SÍ ↓
                 ✓ Generar JWT (30 días)
                 ✓ Actualizar lastLogin
                 ✓ Retornar token
                     │
                     ▼
                 ✅ 200 + Token
                     │
                     ▼
            Frontend almacena token
            localStorage.setItem('token', token)
                     │
                     ▼
            Cada request con:
            Authorization: Bearer TOKEN
                     │
                     ▼
            Middleware verifica token
            jwt.verify(token, SECRET)
                     │
                     ▼
            ✓ Acceso autorizado
            ❌ Token expirado → Refresh
```

---

## 3️⃣ FLUJO DE CREACIÓN DE PRODUCTO

```
┌──────────────────────────────────────────────────────────────────┐
│              ALIADO CREA NUEVO PRODUCTO/SERVICIO                 │
└──────────────────────────────────────────────────────────────────┘

    1. ALIADO COMPLETA FORMULARIO
       ┌──────────────────────┐
       │ Nombre               │
       │ Descripción          │
       │ Precio               │
       │ Categoría            │
       │ Imágenes             │
       │ Stock                │
       └──────────────────────┘
                │
                ▼
    2. FRONTEND VALIDA
       ✓ Campos requeridos
       ✓ Precio > 0
       ✓ Min 1 imagen
       ✓ Descripción >= 20 chars
                │
                ▼
    3. BACKEND RECIBE
       POST /api/v1/partners/products
       {
         "name": "Tour Snorkel",
         "price": 150000,
         "description": "...",
         "images": ["url1", "url2"]
       }
                │
                ▼
    4. VALIDAR + GUARDAR AIRTABLE
       ✓ Joi.validate()
       ✓ Generate Product ID
       ✓ Set status = "pending"
       ✓ Create PartnerProduct record
                │
                ▼
    5. GATILLAR WEBHOOK → MAKE.COM
       POST https://hook.make.com/xxxxx
       {
         "event": "product.created",
         "productId": "prod_abc123xyz",
         "partnerId": "par_001",
         "name": "Tour Snorkel",
         "price": 150000,
         ...
       }
                │
                ▼
    6. MAKE.COM PROCESA (5-10 seg)
       
       ├─ Filter: Validar datos
       │
       ├─ Action 1: Enrich
       │  ├─ Add partner info
       │  ├─ Add GPS coords
       │  └─ Generate SKU
       │
       ├─ Action 2: Call GuiaSAI API
       │  ├─ POST /products
       │  └─ Get guiasaiId
       │
       ├─ Action 3: Update Airtable
       │  ├─ Set guiasaiId
       │  ├─ Set status = "published"
       │  └─ Set syncedAt
       │
       └─ Action 4: Callback a Backend
          POST /api/v1/partners/webhooks/sync-callback
                │
                ▼
    7. BACKEND CONFIRMA
       ✓ Update PartnerProduct
       ✓ Send email notificación
       ✓ Retornar { success: true }
                │
                ▼
    8. FRONTEND MUESTRA
       ┌────────────────────┐
       │ ✅ Producto        │
       │ publicado en       │
       │ GuiaSAI B2B        │
       │ [Ver en GuiaSAI]   │
       └────────────────────┘
```

---

## 4️⃣ FLUJO DE VENTAS → COMISIONES

```
┌──────────────────────────────────────────────────────────────┐
│          TURISTA COMPRA → ALIADO GANA COMISIÓN               │
└──────────────────────────────────────────────────────────────┘

PASO 1: Turista descubre aliado
    │
    ├─ Escanea QR de restaurante
    ├─ Ve catálogo: Tours, Servicios
    └─ Lee comentarios
         │
         ▼

PASO 2: Turista selecciona y compra
    │
    ├─ Elige "Tour Snorkel"
    ├─ Ingresa datos
    ├─ Realiza pago
    └─ Confirmación email
         │
         ▼

PASO 3: Backend registra venta
    │
    ├─ Create PartnerSales record
    │  ├─ partnerId = "par_001"
    │  ├─ productId = "prod_abc123xyz"
    │  ├─ originalAmount = $150,000
    │  ├─ commissionPercent = 10%
    │  └─ commissionAmount = $15,000
    │
    ├─ paymentStatus = "confirmed"
    ├─ saleDate = Now
    └─ orderReference = from_order_system
         │
         ▼

PASO 4: Webhook → Make.com (opcional logging)
    │
    └─ POST https://hook.make.com/sales
       {
         "sale": { ... },
         "commission": 15000,
         "partnerName": "Restaurant El Mangle"
       }
            │
            ▼

PASO 5: Monthly aggregation (1º de cada mes)
    │
    ├─ Sum todas las sales confirmadas
    ├─ Calcular total comisiones
    ├─ Create PartnerPayouts record
    │  ├─ partnerId = "par_001"
    │  ├─ period = "2026-01"
    │  ├─ totalCommissions = $450,000
    │  └─ status = "pending"
    │
    └─ Email al aliado: "Comisión calculada"
         │
         ▼

PASO 6: Admin aprueba pago (manually)
    │
    ├─ Dashboard de admin
    ├─ Review payout
    ├─ Update status = "processed"
    ├─ Enter transferenceReference
    └─ Execute transfer (manual o automático)
         │
         ▼

PASO 7: Backend notifica
    │
    ├─ Update PartnerPayouts
    ├─ Email: "Pago de $450K procesado"
    ├─ Include: Referencia, comprobante
    └─ Link a portal para ver detalle
         │
         ▼

ALIADO RECIBE DINERO EN CUENTA BANCARIA
    │
    └─ Ver en su panel: Historial de pagos
       ├─ Fecha: 2026-01-05
       ├─ Monto: $450,000
       ├─ Referencia: TRX-2026-01-001
       └─ Estado: ✅ Completado
```

---

## 5️⃣ INTEGRACIÓN MAKE.COM (Flujo Visual)

```
┌────────────────────────────────────────────────────────────────┐
│           MAKE.COM SCENARIO: Socios → GuiaSAI B2B             │
└────────────────────────────────────────────────────────────────┘

TRIGGER: HTTP Webhook
┌─ URL: https://hook.make.com/xxxxxxxx
│
├─ Incoming body:
│  {
│    "productId": "prod_abc123xyz",
│    "name": "Tour Snorkel",
│    "price": 150000,
│    "images": ["url1", "url2"]
│  }
│
└──────────────┬──────────────────────────────────────────┐
               ▼                                           │
FILTER 1: Check Data Valid                                │
┌─ name != empty                                           │
├─ price > 0                                              │
├─ images.length > 0                                      │
└─ Continue ──────────────────────────────────────────────┼──┐
               ▼                                           │  │
ACTION 1: Format & Enrich Data                            │  │
┌─ Add timestamp                                           │  │
├─ Add partner details                                     │  │
├─ Add GPS coordinates                                     │  │
├─ Generate SKU = "GUANA-tour-prod_abc123"                │  │
└─ Set variables ─────────────────────────────────────────┼──┤
               ▼                                           │  │
ACTION 2: Call GuiaSAI API                                │  │
┌─ Method: POST                                            │  │
├─ URL: https://guiasai.com/api/v1/products              │  │
├─ Headers: Authorization Bearer {GUIASAI_API_KEY}       │  │
├─ Body: { name, description, price, images, sku }      │  │
└─ Response variables:                                    │  │
   - guiasaiId = response.id                             │  │
   - guiasaiUrl = response.landing_url                   │  │
   └───────────────────────────────────────────────────┬──┤
               ▼                                       │  │
ACTION 3: Update Airtable (PartnerProducts)            │  │
┌─ Method: PATCH                                       │  │
├─ Record ID: product.airtableId                       │  │
├─ Updates:                                            │  │
│  ├─ guiasaiId = {guiasaiId}                          │  │
│  ├─ guiasaiStatus = "synced"                         │  │
│  ├─ guiasaiUrl = {guiasaiUrl}                        │  │
│  └─ syncedAt = NOW()                                 │  │
└─ Success ──────────────────────────────────────────┬──┤
               ▼                                       │  │
ACTION 4: Webhook to Backend                          │  │
┌─ Method: POST                                       │  │
├─ URL: https://backend.guanago.travel/api/v1/       │  │
│        partners/webhooks/sync-callback              │  │
├─ Body:                                              │  │
│  {                                                   │  │
│    "productId": "prod_abc123xyz",                    │  │
│    "guiasaiId": "gsa_xxxx",                          │  │
│    "status": "success",                              │  │
│    "guiasaiUrl": "https://..."                       │  │
│  }                                                   │  │
└─ Confirm ──────────────────────────────────────────┬──┤
               ▼                                       │  │
ACTION 5: Send Email Notification                     │  │
┌─ To: partner.email                                  │  │
├─ Subject: "✅ Producto publicado en GuiaSAI"       │  │
├─ Body: "Tour Snorkel ahora está en GuiaSAI.com"    │  │
├─ Link: https://guiasai.com/productos/gsa_xxxx      │  │
└─ Complete ──────────────────────────────────────────┘  │
                                                         │
RESULTADO: Aliado ve en el panel                        │
  ✓ Producto status = "published"                       │
  ✓ [Ver en GuiaSAI]                                    │
  ✓ Email recibido                                      │
  └─────────────────────────────────────────────────────┘
```

---

## 6️⃣ ESTADO DEL PRODUCTO (Ciclo de Vida)

```
┌────────────────────────────────────────────────────────┐
│           PRODUCT LIFECYCLE STATES                     │
└────────────────────────────────────────────────────────┘

                    ┌─────────────┐
                    │   pending   │  ← Creado, esperando sync
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ publishing  │  ← Enviando a GuiaSAI
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
    SUCCESS              ERROR            TIMEOUT
      │                   │                │
      ▼                   ▼                ▼
  ┌──────────┐       ┌──────────┐     ┌──────────┐
  │published │       │error     │     │pending   │
  │✅ En     │       │❌ Falló  │     │⏳ Retry  │
  │GuiaSAI   │       │sinc      │     │automático│
  └──────────┘       └──────────┘     └──────────┘
      │                   │                │
      │                   └────────┬───────┘
      │                            │
      └────────────────────────────┼────────────┐
                                   │            │
                          ALIADO VERIFICA    ADMIN FIX
                               │                │
                               └────────────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │ Retry automático │
                          │ en Make.com      │
                          └────────┬─────────┘
                                   │
                                   ▼
                              ¿Funciona?
                                   │
                ┌──────────────────┼──────────────────┐
                │                  │                  │
              SÍ                 NO                  -
                │                  │
                ▼                  ▼
          ┌──────────┐       ┌──────────┐
          │published │       │error     │
          │✅ OK     │       │❌ Mantiene
          └──────────┘       └──────────┘
```

---

## 7️⃣ ESTRUCTURA DE CARPETAS

```
GuanaGO-App-Enero-main/
│
├── backend/
│   │
│   ├── existing_files...
│   │
│   └── partners/                  ← NUEVA CARPETA
│       │
│       ├── server.js              ← Express app
│       ├── .env                   ← Configuración
│       ├── .env.example           ← Template
│       │
│       ├── routes/                ← Endpoints
│       │   ├── auth.js
│       │   ├── partners.js
│       │   ├── products.js
│       │   ├── sales.js
│       │   ├── payouts.js
│       │   └── webhooks.js
│       │
│       ├── controllers/           ← Lógica
│       │   ├── authController.js
│       │   ├── partnersController.js
│       │   ├── productsController.js
│       │   └── salesController.js
│       │
│       ├── services/              ← Servicios
│       │   ├── jwtService.js
│       │   ├── airtablePartnerService.js
│       │   ├── emailService.js
│       │   ├── qrService.js
│       │   ├── retryService.js
│       │   └── makeIntegration.js
│       │
│       ├── middleware/            ← Middlewares
│       │   ├── auth.js
│       │   ├── errorHandler.js
│       │   └── rateLimiter.js
│       │
│       ├── utils/                 ← Utilidades
│       │   ├── helpers.js
│       │   ├── validators.js
│       │   ├── logger.js
│       │   └── constants.js
│       │
│       ├── tests/                 ← Tests
│       │   ├── auth.test.js
│       │   ├── partners.test.js
│       │   ├── products.test.js
│       │   └── integration.test.js
│       │
│       ├── logs/                  ← Logs generados
│       │   └── *.log
│       │
│       ├── package.json
│       ├── package-lock.json
│       └── README.md
│
└── ... resto del proyecto

```

---

## 8️⃣ TABLA COMPARATIVA: Old Panel vs. New Socios Portal

```
┌──────────────────┬──────────────────┬──────────────────┐
│     ASPECTO      │    Panel Admin    │    Panel Socios  │
├──────────────────┼──────────────────┼──────────────────┤
│ Usuarios         │ 5-10 (staff)     │ 500+ (aliados)   │
│ Propósito        │ Administrar app  │ Gestionar negocio│
│ Datos críticos   │ Todo el sistema  │ Solo su negocio  │
│ Permisos         │ Full access      │ Limited scope    │
│ Monetización     │ N/A              │ Comisiones ✅    │
│ Integraciones    │ Airtable         │ Make + GuiaSAI   │
│ Auth             │ PIN code         │ Email + Pass     │
│ Público          │ NO (internal)    │ SÍ (socios)      │
│ URL              │ /admin           │ socios.guanago.. │
│ Componentes      │ UnifiedPanel     │ Reutilizados ✅  │
└──────────────────┴──────────────────┴──────────────────┘
```

---

## 9️⃣ TIMELINE VISUAL

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PROYECTO: 5 SEMANAS                              │
└─────────────────────────────────────────────────────────────────────┘

SEMANA 1-2: BACKEND BÁSICO
├─ Día 1-2: Setup express, estructura
├─ Día 3-4: Airtable + JWT
├─ Día 5-8: Auth endpoints
└─ Salida: 🟢 Aliados pueden registrarse

SEMANA 3: API COMPLETA
├─ Día 1-2: Products CRUD
├─ Día 3-4: Sales + Payouts
├─ Día 5: QR generator
└─ Salida: 🟢 Panel funcional sin integraciones

SEMANA 4: INTEGRACIONES
├─ Día 1-2: Make.com setup + webhooks
├─ Día 3-4: GuiaSAI B2B API
├─ Día 5: Email + error handling
└─ Salida: 🟢 Productos auto-publican en GuiaSAI

SEMANA 5: FRONTEND + TESTING
├─ Día 1-2: React componentes
├─ Día 3: Auth context
├─ Día 4: Tests + deploy staging
└─ Salida: 🟢 Panel visible + testeado

POST-LANZAMIENTO:
├─ Beta con 5 socios
├─ Feedback + ajustes
└─ 🟢 Lanzamiento oficial
```

---

## 🔟 MATRIZ DE DECISIONES

```
¿Usar panel existente de Guanago.travel?
│
├─ ✅ SÍ porque:
│  ├─ UI/UX ya validada
│  ├─ Componentes funcionan
│  ├─ Usuarios conocen la interfaz
│  ├─ Reduce tiempo desarrollo
│  └─ Menos bugs
│
└─ ❌ NO porque:
   ├─ Roles diferentes
   ├─ Datos diferentes
   ├─ Permisos diferentes
   └─ Scalabilidad dudosa

DECISIÓN: ✅ Reutilizar + adaptar

---

¿Usar Airtable como base de datos?
│
├─ ✅ SÍ porque:
│  ├─ Ya lo usan
│  ├─ Integración Make.com fácil
│  ├─ Webhook automáticos
│  ├─ No requiere DevOps
│  └─ Barato
│
└─ ❌ NO porque:
   ├─ Límites de rows
   ├─ Escalabilidad limitada
   ├─ Latencia puede crecer
   └─ Costos pueden subir

DECISIÓN: ✅ Airtable (considerar migración SQL en Fase 2)

---

¿Integración automática con GuiaSAI B2B?
│
├─ ✅ SÍ porque:
│  ├─ Enriquece portafolio
│  ├─ Synergía B2B
│  ├─ Win-win para aliados
│  └─ Aumenta conversiones
│
└─ ❌ NO porque:
   ├─ Complejidad extra
   ├─ Debugging difícil
   └─ Costos Make.com

DECISIÓN: ✅ Integración automática (es el valor agregado)
```

---

Este documento proporciona una **guía visual completa** de cómo funciona el sistema, cómo se relacionan los componentes, y cómo fluyen los datos.

💡 **Tip:** Imprime estos diagramas o guárdalos como referencias rápidas durante el desarrollo.
