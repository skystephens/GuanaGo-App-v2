# 🏗️ Arquitectura Backend para Socios/Aliados Locales
> Reutilización de Estructura Existente + Integración GuiaSAI B2B

**Versión:** 1.0  
**Fecha:** Enero 23, 2026  
**Objetivo:** Crear acceso unificado para aliados locales (restaurantes, alojamientos, comercios)

---

## 📋 Visión General

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         GUANAGO UNIFIED ECOSYSTEM                                │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────┐       ┌────────────────┐       ┌────────────────┐          │
│  │   PWA TRAVEL   │       │  PANEL SOCIOS  │       │  GUIASAI B2B   │          │
│  │  guanago.travel│       │  (Restaurantes │       │  (Portafolio   │          │
│  │                │       │   Alojamientos)│       │   Actualizado)  │          │
│  └────────┬────────┘       └────────┬────────┘       └────────┬────────┘          │
│           │                         │                        │                   │
│           └─────────────────────────┼────────────────────────┘                   │
│                                     │                                            │
│                                     ▼                                            │
│                        ┌─────────────────────────┐                              │
│                        │   BACKEND COMPARTIDO    │                              │
│                        │  (Express + Airtable)   │                              │
│                        └─────────────────────────┘                              │
│                                     │                                            │
│          ┌──────────────────────────┼──────────────────────────┐                │
│          │                          │                          │                │
│          ▼                          ▼                          ▼                │
│    ┌──────────────┐         ┌──────────────┐         ┌──────────────┐         │
│    │   AIRTABLE   │         │  MAKE.COM    │         │  GROQ AI     │         │
│    │              │         │   WEBHOOKS   │         │  CHATBOT     │         │
│    │ • Productos  │         │              │         │              │         │
│    │ • Aliados     │         └──────────────┘         └──────────────┘         │
│    │ • Pedidos     │                                                            │
│    │ • Usuarios    │                                                            │
│    └──────────────┘                                                             │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Casos de Uso Principales

### 1️⃣ Panel de Control Unificado (Reutilizando UI Existente)

**Acceso:** Portal Socios → "Mi Panel de Control"

```
Mi Panel de Control
├── 📊 Dashboard
│   ├── Resumen de ventas (últimos 30 días)
│   ├── Comisiones pendientes
│   ├── Productos activos
│   └── Performance de portafolio
│
├── 🏢 Mi Negocio
│   ├── Información empresarial
│   ├── Ubicación GPS
│   ├── Horarios de atención
│   ├── Documentos (RUT, permisos)
│   └── Fotos/logo
│
├── 📦 Mis Productos/Servicios
│   ├── Listar productos actuales
│   ├── Agregar nuevo producto
│   ├── Editar producto
│   ├── Cambiar estado (activo/inactivo)
│   └── Ver análisis por producto
│
├── 💰 Ganancias & Pagos
│   ├── Comisiones por venta
│   ├── Estado de pagos
│   ├── Historial transaccional
│   ├── Banco/cuenta bancaria
│   └── Generar reportes
│
├── 📱 Mi QR & Marketing
│   ├── Ver/descargar QR único
│   ├── Copiar link de referencia
│   ├── Materiales de promoción
│   └── Estadísticas de escaneos
│
└── ⚙️ Configuración
    ├── Datos de contacto
    ├── Notificaciones
    ├── Integraciones (Make.com, etc)
    └── Cerrar sesión
```

---

## 🔐 Autenticación de Aliados

### Estructura de Roles

```typescript
enum PartnerRole {
  RESTAURANT = 'restaurant',      // Restaurante/Comida
  HOTEL = 'hotel',                 // Alojamiento
  COMMERCE = 'commerce',           // Comercio
  SERVICE = 'service',             // Servicios (peluquería, spa, etc)
  OPERATOR = 'operator',           // Operador turístico
  ADMIN_SOCIO = 'admin_socio'      // Admin de socios (GuanaGO team)
}

interface PartnerUser {
  id: string;
  email: string;
  phone: string;
  password: string (hashed);
  partnerRole: PartnerRole;
  businessName: string;
  businessNIT?: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  commissionRate: number;        // % de comisión (ej: 10)
  bankAccount?: {
    bank: string;
    accountNumber: string;
    accountHolder: string;
  };
  createdAt: Date;
  approvedAt?: Date;
}
```

### Flujo de Autenticación

```
1. Aliado se registra en Portal Socios
   ├─ Datos básicos (email, teléfono, contraseña)
   ├─ Información del negocio (nombre, ubicación, tipo)
   └─ Carga documentos (RUT, cédula)

2. Email de verificación
   └─ Confirmar correo electrónico

3. Aprobación manual por Admin
   ├─ Revisar documentos
   ├─ Verificar ubicación GPS
   └─ Aprobar o rechazar

4. Login automático
   ├─ Email + Contraseña
   ├─ JWT token (válido 30 días)
   └─ Redirect a Panel de Control
```

---

## 📊 Base de Datos (Airtable)

### Nuevas Tablas Requeridas

#### 1. **Tabla: Partners_Aliados**
```
Campos:
├─ ID (autonumérico)
├─ Email (único)
├─ Nombre Negocio
├─ Tipo Negocio (restaurant/hotel/commerce/service)
├─ NIT/RUT
├─ Teléfono
├─ Dirección
├─ Latitude
├─ Longitude
├─ Logo (archivo)
├─ Descripción
├─ Horarios (JSON)
├─ Estado (pending/approved/rejected/suspended)
├─ Comisión (%)
├─ Banco
├─ Cuenta Bancaria
├─ QR Code (generado automáticamente)
├─ Token JWT (último)
├─ Aprobado Por (admin)
├─ Aprobado En (fecha)
├─ Documentos (links)
├─ Creado En
└─ Actualizado En
```

#### 2. **Tabla: PartnerProducts**
```
Campos:
├─ ID (autonumérico)
├─ Partner_ID (link a Partners_Aliados)
├─ Nombre Producto
├─ Tipo (tour/alojamiento/servicio/otro)
├─ Descripción
├─ Precio
├─ Categoría
├─ Imágenes (galería)
├─ Estado (active/inactive)
├─ Stock (si aplica)
├─ Visitas
├─ Conversiones
├─ Comisiones Generadas
├─ Creado En
└─ Actualizado En
```

#### 3. **Tabla: PartnerSales**
```
Campos:
├─ ID (autonumérico)
├─ Partner_ID (link a Partners_Aliados)
├─ Product_ID (link a PartnerProducts)
├─ Cliente Nombre
├─ Monto Original
├─ Comisión (%)
├─ Comisión Monto
├─ Estado Pago (pending/confirmed/rejected)
├─ Referencia Pedido (Make.com)
├─ Fecha Venta
└─ Fecha Pago
```

#### 4. **Tabla: PartnerPayouts**
```
Campos:
├─ ID (autonumérico)
├─ Partner_ID (link a Partners_Aliados)
├─ Período (mes-año)
├─ Total Comisiones
├─ Total Pagado
├─ Saldo Pendiente
├─ Método Pago (transferencia/billetera/otro)
├─ Estado (pending/processed/failed)
├─ Fecha Procesamiento
├─ Referencia Transferencia
└─ Comprobante (archivo)
```

---

## 🔌 Endpoints API Backend

### Base URL: `/api/v1/partners`

#### 🔓 PÚBLICOS (sin autenticación)

```http
POST /auth/register
Content-Type: application/json

{
  "email": "contacto@restaurant.com",
  "password": "securepass123",
  "businessName": "Restaurant El Mangle",
  "businessType": "restaurant",
  "phone": "+57 312 1234567",
  "latitude": 12.5849,
  "longitude": -81.7338,
  "address": "North End, San Andrés"
}

Response:
{
  "success": true,
  "message": "Registro exitoso. Por favor verifica tu email.",
  "partnerId": "pat_123456"
}
```

```http
POST /auth/login
Content-Type: application/json

{
  "email": "contacto@restaurant.com",
  "password": "securepass123"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "partner": {
    "id": "pat_123456",
    "businessName": "Restaurant El Mangle",
    "businessType": "restaurant",
    "status": "approved"
  }
}
```

#### 🔒 PRIVADOS (requieren JWT token)

**Header requerido:**
```
Authorization: Bearer <token>
```

### Dashboard & Información

```http
GET /dashboard
Response:
{
  "partnerId": "pat_123456",
  "businessName": "Restaurant El Mangle",
  "totalSales": 7200000,
  "totalCommission": 720000,
  "pendingPayout": 350000,
  "activeProducts": 5,
  "qrScans": 145,
  "conversionRate": 20.7,
  "lastUpdated": "2026-01-23T10:30:00Z"
}
```

```http
GET /profile
Response:
{
  "id": "pat_123456",
  "email": "contacto@restaurant.com",
  "businessName": "Restaurant El Mangle",
  "businessType": "restaurant",
  "nit": "123456789",
  "phone": "+57 312 1234567",
  "location": {
    "address": "North End, San Andrés",
    "latitude": 12.5849,
    "longitude": -81.7338
  },
  "logo": "https://bucket.s3.com/logo.png",
  "status": "approved",
  "commissionRate": 10,
  "bankAccount": {
    "bank": "Bancolombia",
    "accountNumber": "12345678901",
    "accountHolder": "Restaurant El Mangle"
  }
}
```

```http
PATCH /profile
Content-Type: application/json

{
  "phone": "+57 312 9876543",
  "bankAccount": {
    "bank": "Banco de Bogotá",
    "accountNumber": "98765432101"
  }
}

Response: 200 OK
```

### Productos/Servicios

```http
GET /products
Response:
{
  "products": [
    {
      "id": "prod_001",
      "name": "Tour Snorkel",
      "type": "tour",
      "description": "...",
      "price": 80000,
      "category": "acuático",
      "status": "active",
      "views": 342,
      "conversions": 28,
      "commission": 280000,
      "images": [...]
    }
  ],
  "total": 5,
  "stats": {
    "totalViews": 1200,
    "totalConversions": 85,
    "totalEarnings": 850000
  }
}
```

```http
POST /products
Content-Type: application/json

{
  "name": "Desayuno Típico",
  "type": "service",
  "description": "Desayuno tradicional de San Andrés",
  "price": 35000,
  "category": "comida",
  "stock": 50,
  "images": ["img1.jpg", "img2.jpg"]
}

Response: 201 Created
{
  "id": "prod_002",
  "name": "Desayuno Típico",
  "status": "active"
}
```

```http
GET /products/:productId
PATCH /products/:productId
DELETE /products/:productId
```

### Ventas & Comisiones

```http
GET /sales
Query params: ?month=01&year=2026&status=confirmed

Response:
{
  "sales": [
    {
      "id": "sale_001",
      "productName": "Tour Snorkel",
      "clientName": "Juan García",
      "amount": 80000,
      "commission": 8000,
      "date": "2026-01-20T14:30:00Z",
      "status": "confirmed"
    }
  ],
  "summary": {
    "totalSales": 7200000,
    "totalCommissions": 720000,
    "totalConfirmed": 680000,
    "totalPending": 40000
  }
}
```

```http
GET /payouts
Response:
{
  "payouts": [
    {
      "id": "payout_001",
      "period": "2025-12",
      "totalCommissions": 720000,
      "status": "processed",
      "processedAt": "2026-01-05T10:00:00Z",
      "reference": "TRX-2025-12-001"
    }
  ],
  "pendingAmount": 350000,
  "nextPayoutDate": "2026-02-05"
}
```

### QR & Marketing

```http
GET /qr-code
Response:
{
  "qrCode": "data:image/png;base64,...",
  "partnerId": "pat_123456",
  "qrUrl": "https://guanago.travel/p/pat_123456",
  "scans": {
    "total": 145,
    "thisMonth": 42,
    "lastScan": "2026-01-23T08:15:00Z"
  }
}
```

### Integración Make.com

```http
POST /sync-to-guiasai
Payload from Make.com:
{
  "action": "update_portfolio",
  "partnerId": "pat_123456",
  "products": [...]
}

Response: 200 OK
{
  "synced": true,
  "itemsUpdated": 5,
  "guiasaiId": "gsa_789012"
}
```

---

## 🔗 Flujo de Integración Make.com

```
PASO 1: Aliado agrega/edita producto en Panel Socios
   │
   ▼
PASO 2: Webhook gatillado (POST a Make.com)
   ├─ Partner ID
   ├─ Product ID
   ├─ Datos del producto
   └─ Timestamp
   │
   ▼
PASO 3: Make.com procesa
   ├─ Enriquece datos
   ├─ Valida información
   ├─ Genera SKU único
   └─ Mapea a GuiaSAI B2B
   │
   ▼
PASO 4: Make.com actualiza GuiaSAI B2B
   ├─ POST a API GuiaSAI
   ├─ Actualiza portafolio
   ├─ Genera landing page
   └─ Envía notificación
   │
   ▼
PASO 5: Confirmación al panel socios
   └─ Product status = "published"
```

---

## 🛠️ Estructura Backend (Express)

```
backend/
├── routes/
│   ├── auth.js                 # Registro/Login
│   ├── partners.js             # CRUD Partners
│   ├── products.js             # Productos/Servicios
│   ├── sales.js                # Ventas
│   ├── payouts.js              # Comisiones & Pagos
│   ├── dashboard.js            # Dashboard stats
│   ├── qr.js                   # Generador QR
│   └── integrations.js         # Make.com webhooks
│
├── controllers/
│   ├── partnerController.js    # Lógica Partners
│   ├── productController.js    # Lógica Productos
│   ├── salesController.js      # Lógica Ventas
│   ├── payoutController.js     # Lógica Pagos
│   ├── dashboardController.js  # Stats/Analytics
│   └── qrController.js         # QR generation
│
├── middleware/
│   ├── auth.js                 # JWT verification
│   ├── partnerAuth.js          # Partner-specific auth
│   ├── errorHandler.js         # Error handling
│   └── rateLimiter.js          # Rate limiting
│
├── services/
│   ├── airtableService.js      # Operaciones Airtable
│   ├── partnerService.js       # Lógica business Partners
│   ├── productService.js       # Lógica business Productos
│   ├── makeIntegration.js      # Webhooks Make.com
│   ├── paymentService.js       # Procesamiento pagos
│   ├── emailService.js         # Notificaciones
│   ├── qrService.js            # Generación QR
│   └── jwtService.js           # Token management
│
└── utils/
    ├── validators.js           # Validaciones
    ├── helpers.js              # Funciones auxiliares
    └── constants.js            # Constantes
```

---

## 🎨 Reutilización Frontend (Componentes)

### Componentes a Adaptar del Panel Actual

```typescript
// Panel Control Unificado
components/
├── UnifiedPanel.tsx          ← Base para Portal Socios
│   ├── PartnerDashboard.tsx  ← Resumen ventas
│   ├── PartnerProfile.tsx    ← Mi negocio
│   ├── PartnerProducts.tsx   ← Mis productos
│   ├── PartnerSales.tsx      ← Mis ventas
│   ├── PartnerPayouts.tsx    ← Comisiones & pagos
│   ├── PartnerQRCode.tsx     ← Mi QR + stats
│   └── PartnerSettings.tsx   ← Configuración

// Formularios
├── PartnerRegisterForm.tsx   ← Registro
├── PartnerLoginForm.tsx      ← Login
└── ProductForm.tsx           ← Crear/editar productos

// Utilitarios
├── PartnerAuthContext.tsx    ← Auth state
├── PartnerMetrics.tsx        ← Widgets métricas
└── QRCodeGenerator.tsx       ← QR visual
```

---

## 📱 UI/UX - Pantalla "Mi Panel de Control"

```
┌──────────────────────────────────────────────┐
│ ← GuanaGO   Mi Panel de Control    Perfil ⊙  │
├──────────────────────────────────────────────┤
│                                              │
│  👤 Restaurant El Mangle                     │
│  📍 North End, San Andrés                    │
│  ✅ Estado: Aprobado                        │
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│  ┌─────────────┐  ┌─────────────┐          │
│  │ 📊 ESTADÍSTICAS                           │
│  ├─────────────┤  ├─────────────┤          │
│  │ Ventas:     │  │ Comisión:   │          │
│  │ $7.2M       │  │ $720K       │          │
│  │ (+15% mes)  │  │ Pendiente: $350K       │
│  └─────────────┘  └─────────────┘          │
│                                              │
│  ┌─────────────┐  ┌─────────────┐          │
│  │ 📦 Productos │  │ 📱 Mi QR    │          │
│  ├─────────────┤  ├─────────────┤          │
│  │ 5 activos   │  │ [QR Image]  │          │
│  │ +Agregar    │  │ 145 escaneos│          │
│  │ Ver todos   │  │ Descargar   │          │
│  └─────────────┘  └─────────────┘          │
│                                              │
│  ┌──────────────────────────────┐          │
│  │ 💰 ÚLTIMAS TRANSACCIONES     │          │
│  ├──────────────────────────────┤          │
│  │ 20 ene - Tour Snorkel +$8K   │          │
│  │ 19 ene - Desayuno +$3.5K     │          │
│  │ 18 ene - Tour Beach +$8K     │          │
│  │ Ver todo →                   │          │
│  └──────────────────────────────┘          │
│                                              │
└──────────────────────────────────────────────┘
```

---

## ⚙️ Variables de Entorno Backend

```env
# === PARTNERS BACKEND ===
PARTNERS_PORT=3001
PARTNERS_ENV=development

# === AIRTABLE ===
AIRTABLE_API_KEY=xxxxx
AIRTABLE_BASE_ID=xxxxx
AIRTABLE_TABLE_PARTNERS=Partners_Aliados
AIRTABLE_TABLE_PRODUCTS=PartnerProducts
AIRTABLE_TABLE_SALES=PartnerSales
AIRTABLE_TABLE_PAYOUTS=PartnerPayouts

# === JWT ===
JWT_SECRET=your_secret_key_here
JWT_EXPIRATION=30d

# === MAKE.COM WEBHOOKS ===
MAKE_WEBHOOK_PRODUCTS=https://hook.make.com/xxxxx
MAKE_WEBHOOK_SALES=https://hook.make.com/xxxxx
MAKE_GUIASAI_WEBHOOK=https://hook.make.com/xxxxx

# === EMAILS ===
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@guanago.com
SMTP_PASS=xxxxx

# === SEGURIDAD ===
CORS_ORIGIN=https://guanago.travel,https://portal-socios.guanago.travel
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX_REQUESTS=100

# === PAGOS ===
STRIPE_API_KEY=xxxxx
STRIPE_WEBHOOK_SECRET=xxxxx

# === ALMACENAMIENTO ===
AWS_S3_BUCKET=guanago-partners
AWS_S3_REGION=us-east-1
AWS_S3_ACCESS_KEY=xxxxx
AWS_S3_SECRET_KEY=xxxxx
```

---

## 🚀 Plan de Implementación (Fase 1)

### Semana 1-2: Backend Básico
- [ ] Setup proyecto Express
- [ ] Schema Airtable (nuevas tablas)
- [ ] Autenticación (JWT)
- [ ] Endpoints básicos (GET/POST partners)

### Semana 3: API Completa
- [ ] Endpoints productos
- [ ] Endpoints ventas
- [ ] Endpoints payouts
- [ ] Generador QR

### Semana 4: Integraciones
- [ ] Make.com webhooks
- [ ] GuiaSAI B2B sync
- [ ] Email notifications
- [ ] Error handling robusto

### Semana 5: Frontend Panel
- [ ] Componentes dashboard
- [ ] Formularios
- [ ] Context auth
- [ ] Testing

---

## 🔒 Seguridad

- ✅ JWT tokens (30 días exp)
- ✅ Validación entrada + sanitización
- ✅ Rate limiting
- ✅ CORS restringido
- ✅ HTTPS obligatorio
- ✅ Hashing de contraseñas (bcrypt)
- ✅ Auditoría de operaciones
- ✅ Logs de acceso

---

## 📊 Métricas de Éxito

1. **Adopción:** X aliados registrados en mes 1
2. **Engagement:** % de QR escaneados
3. **Conversión:** % de escaneos → compra
4. **Retención:** Aliados activos mes 2+
5. **Comisiones:** Volumen total de comisiones pagadas

---

## 🤝 Próximos Pasos

1. ✅ **Validar esta arquitectura** con el equipo
2. ⬜ Comenzar desarrollo backend (REST API)
3. ⬜ Setup Airtable schema
4. ⬜ Crear componentes frontend
5. ⬜ Integración Make.com
6. ⬜ Testing end-to-end
7. ⬜ Deployment staging
8. ⬜ Beta con 5 aliados piloto
9. ⬜ Ajustes basados en feedback
10. ⬜ Lanzamiento oficial
