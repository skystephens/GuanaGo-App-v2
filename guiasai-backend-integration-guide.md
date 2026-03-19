# 🔧 GUIASAI BUSINESS - BACKEND & INTEGRACIÓN AIRTABLE
## Sistema de Gestión para Proveedores y Administradores

---

## 📑 ÍNDICE

1. Arquitectura del Sistema
2. Integración Airtable
3. API Endpoints
4. Modelos de Datos
5. Flujos de Trabajo
6. Seguridad y Autenticación
7. Guía de Implementación

---

## 1. ARQUITECTURA DEL SISTEMA

### 🏗️ Estructura General

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│  ┌─────────────────┐  ┌──────────────────────────┐      │
│  │ Cliente Agencia │  │ Panel Proveedor/Admin    │      │
│  │ (Public Site)   │  │ (Private Dashboard)       │      │
│  └─────────────────┘  └──────────────────────────┘      │
└─────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────┐
│              API LAYER (Node.js/Express)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Auth Service │  │ Quote Service│  │ Booking Svc  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  AIRTABLE (Database)                     │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐          │
│  │Cotizaciones│ │  Servicios │ │ Proveedores│          │
│  │    GG      │ │            │ │            │          │
│  └────────────┘ └────────────┘ └────────────┘          │
└─────────────────────────────────────────────────────────┘
```

### 🎯 Roles y Permisos

#### **1. Agencia de Viajes (Cliente)**
- Ver catálogo de servicios
- Crear cotizaciones
- Seguimiento de solicitudes
- Historial de reservas

#### **2. Proveedor (Hotel/Tour/Transporte)**
- Ver cotizaciones de sus servicios
- Aprobar/Rechazar cotizaciones
- Gestionar disponibilidad (calendario)
- Actualizar precios e inventario
- Ver reportes de ventas

#### **3. Administrador GuiaSAI**
- Ver TODAS las cotizaciones
- Supervisar aprobaciones
- Gestionar proveedores
- Acceso a analytics globales
- Configuración del sistema

---

## 2. INTEGRACIÓN AIRTABLE

### 📊 Estructura de Bases de Datos

#### **Base: GuiaSAI_Business**

**Tabla 1: CotizacionesGG**
```javascript
{
  fields: {
    // Identificación
    "ID_Cotizacion": "COT-1247",
    "Fecha_Solicitud": "2026-01-29T10:30:00.000Z",
    
    // Información del Servicio
    "Servicio": ["recXYZ123"],  // Link to Servicios table
    "Nombre_Servicio": "Suite Premium Ocean View",
    "Tipo_Servicio": "Alojamiento",
    "Proveedor": ["recABC456"],  // Link to Proveedores table
    
    // Detalles de la Cotización
    "Agencia": "TravelPro Agency",
    "Email_Agencia": "contact@travelpro.com",
    "Telefono_Agencia": "+1-305-555-0123",
    
    // Fechas y Huéspedes
    "Fecha_Checkin": "2026-02-15",
    "Fecha_Checkout": "2026-02-22",
    "Num_Noches": 7,
    "Num_Adultos": 4,
    "Num_Ninos": 2,
    "Edades_Ninos": "8, 10",
    
    // Pricing
    "Precio_Base": 1620,
    "Precio_Servicios_Adicionales": 270,
    "Precio_Total": 1890,
    "Moneda": "USD",
    "Comision_Agencia": 15,  // Porcentaje
    
    // Estado y Aprobación
    "Estado": "Pendiente",  // Pendiente | Aprobada | Rechazada | Expirada
    "Fecha_Aprobacion": null,
    "Fecha_Rechazo": null,
    "Aprobado_Por": null,
    "Motivo_Rechazo": null,
    
    // Notas
    "Notas_Agencia": "Cliente celebra aniversario, solicita decoración especial",
    "Notas_Proveedor": null,
    "Notas_Internas": null,
    
    // Tracking
    "Convertida_a_Reserva": false,
    "ID_Reserva": null,  // Link cuando se convierte
    
    // Timestamps
    "Creado": "2026-01-29T10:30:00.000Z",
    "Modificado": "2026-01-29T10:30:00.000Z"
  }
}
```

**Tabla 2: Servicios**
```javascript
{
  fields: {
    // Identificación
    "ID_Servicio": "SRV-HOTEL-001",
    "Nombre": "Suite Premium Ocean View",
    "Tipo": "Alojamiento",  // Alojamiento | Tour | Transporte
    "Subtipo": "Hotel",  // Hotel | Posada | Resort | etc.
    
    // Proveedor
    "Proveedor": ["recABC456"],  // Link to Proveedores
    
    // Descripción
    "Descripcion_Corta": "Suite de lujo frente al mar...",
    "Descripcion_Larga": "Amplia suite de 60m² con...",
    "Caracteristicas": ["Vista al mar", "Balcón privado", "Jacuzzi"],
    
    // Capacidad
    "Capacidad_Adultos": 4,
    "Capacidad_Ninos": 2,
    "Num_Habitaciones": 2,
    "Num_Banos": 2,
    
    // Amenidades
    "Amenidades": ["WiFi", "TV", "Minibar", "Aire acondicionado", "Caja fuerte"],
    "Servicios_Incluidos": ["Desayuno", "Traslado aeropuerto"],
    
    // Pricing
    "Precio_Base_Noche": 245,
    "Precio_Temporada_Alta": 320,
    "Precio_Fin_Semana": 275,
    "Precio_Minimo_Noches": 3,
    "Moneda": "USD",
    
    // Media
    "Imagenes": [
      { url: "https://...", filename: "suite-001.jpg" },
      { url: "https://...", filename: "suite-002.jpg" }
    ],
    
    // Ubicación
    "Ubicacion": "San Andrés, Playa Spratt Bight",
    "Coordenadas": "12.5847, -81.7006",
    
    // Estado
    "Activo": true,
    "Destacado": true,
    
    // Cotizaciones relacionadas
    "Cotizaciones": ["recCOT001", "recCOT002"],  // Links
    
    // Timestamps
    "Creado": "2025-12-01T00:00:00.000Z",
    "Modificado": "2026-01-15T00:00:00.000Z"
  }
}
```

**Tabla 3: Proveedores**
```javascript
{
  fields: {
    // Identificación
    "ID_Proveedor": "PROV-HC-001",
    "Nombre_Comercial": "Hotel Casablanca",
    "Razon_Social": "Hotel Casablanca SAS",
    "NIT": "900123456-7",
    
    // Tipo
    "Tipo_Proveedor": "Alojamiento",  // Alojamiento | Tours | Transporte | Múltiple
    "Categoria": "Premium",  // Budget | Standard | Premium | Luxury
    
    // Contacto
    "Email_Principal": "reservas@hotelcasablanca.com",
    "Email_Facturacion": "admin@hotelcasablanca.com",
    "Telefono": "+57-8-512-3456",
    "WhatsApp": "+57-300-123-4567",
    
    // Ubicación
    "Direccion": "Av. Colombia #5-67",
    "Ciudad": "San Andrés",
    "Departamento": "San Andrés y Providencia",
    "Pais": "Colombia",
    
    // Representante Legal
    "Nombre_Contacto": "Juan Pérez",
    "Cargo_Contacto": "Gerente General",
    "Email_Contacto": "jperez@hotelcasablanca.com",
    
    // Financiero
    "Banco": "Bancolombia",
    "Tipo_Cuenta": "Ahorros",
    "Numero_Cuenta": "12345678901",
    "Comision_Estandar": 15,  // Porcentaje
    
    // Certificaciones
    "Certificaciones": ["RNT-12345", "ISO-9001"],
    "Licencia_Turismo": "RNT-12345-2025",
    
    // Acceso al Sistema
    "Usuario_Panel": "hotel.casablanca",
    "Email_Login": "panel@hotelcasablanca.com",
    "Ultimo_Acceso": "2026-01-29T08:00:00.000Z",
    
    // Servicios del Proveedor
    "Servicios": ["recSRV001", "recSRV002"],  // Links
    
    // Estado
    "Estado": "Activo",  // Activo | Inactivo | Suspendido
    "Verificado": true,
    "Fecha_Verificacion": "2025-12-15",
    
    // Métricas
    "Cotizaciones_Recibidas": 127,
    "Cotizaciones_Aprobadas": 98,
    "Tasa_Aprobacion": 77.2,
    "Rating_Promedio": 4.8,
    
    // Timestamps
    "Creado": "2025-11-01T00:00:00.000Z",
    "Modificado": "2026-01-29T00:00:00.000Z"
  }
}
```

**Tabla 4: Disponibilidad**
```javascript
{
  fields: {
    // Relaciones
    "Servicio": ["recSRV001"],  // Link
    "Proveedor": ["recPROV001"],  // Link
    
    // Fecha
    "Fecha": "2026-02-15",
    "Anio": 2026,
    "Mes": 2,
    "Dia": 15,
    
    // Disponibilidad
    "Estado": "Disponible",  // Disponible | Reservado | Bloqueado
    "Unidades_Disponibles": 3,
    "Unidades_Totales": 5,
    
    // Pricing dinámico
    "Precio_Dia": 275,  // Puede variar del precio base
    "Es_Temporada_Alta": false,
    "Es_Fin_Semana": true,
    
    // Restricciones
    "Minimo_Noches": 2,
    "Maximo_Noches": null,
    
    // Notas
    "Notas": "Día festivo local - precio especial",
    
    // Timestamps
    "Creado": "2026-01-01T00:00:00.000Z",
    "Modificado": "2026-01-20T00:00:00.000Z"
  }
}
```

**Tabla 5: Usuarios**
```javascript
{
  fields: {
    // Identificación
    "ID_Usuario": "USR-001",
    "Email": "admin@guiasai.com",
    "Nombre_Completo": "María González",
    
    // Rol
    "Rol": "Administrador",  // Administrador | Proveedor | Agencia
    "Proveedor_Asociado": ["recPROV001"],  // Link si es proveedor
    
    // Acceso
    "Password_Hash": "...",  // Hasheado con bcrypt
    "Ultimo_Login": "2026-01-29T09:00:00.000Z",
    "Login_Count": 234,
    
    // Permisos
    "Puede_Aprobar_Cotizaciones": true,
    "Puede_Gestionar_Proveedores": true,
    "Puede_Ver_Analytics": true,
    
    // Estado
    "Activo": true,
    "Email_Verificado": true,
    
    // Timestamps
    "Creado": "2025-10-01T00:00:00.000Z",
    "Modificado": "2026-01-29T09:00:00.000Z"
  }
}
```

---

## 3. API ENDPOINTS

### 🔌 RESTful API Structure

**Base URL:** `https://api.guiasai.com/v1`

#### **Authentication**

```javascript
// POST /auth/login
{
  email: "proveedor@example.com",
  password: "securePassword123"
}
// Response:
{
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  user: {
    id: "USR-001",
    email: "proveedor@example.com",
    role: "Proveedor",
    provider: "Hotel Casablanca"
  }
}

// POST /auth/logout
// Headers: Authorization: Bearer {token}

// POST /auth/refresh
// Headers: Authorization: Bearer {refreshToken}
```

#### **Cotizaciones (Quotes)**

```javascript
// GET /quotes
// Obtener todas las cotizaciones (filtrado por rol)
// Query params: status, provider, dateFrom, dateTo, limit, offset
{
  quotes: [...],
  total: 127,
  page: 1,
  totalPages: 13
}

// GET /quotes/:id
// Obtener cotización específica
{
  id: "COT-1247",
  service: {...},
  agency: {...},
  status: "Pendiente",
  ...
}

// POST /quotes
// Crear nueva cotización (desde frontend público)
{
  serviceId: "SRV-HOTEL-001",
  agency: {
    name: "TravelPro Agency",
    email: "contact@travelpro.com",
    phone: "+1-305-555-0123"
  },
  dates: {
    checkin: "2026-02-15",
    checkout: "2026-02-22"
  },
  guests: {
    adults: 4,
    children: 2,
    childrenAges: [8, 10]
  },
  notes: "Cliente celebra aniversario..."
}

// PATCH /quotes/:id/approve
// Aprobar cotización (solo proveedor/admin)
// Headers: Authorization: Bearer {token}
{
  notes: "Aprobado. Incluimos upgrade gratuito a suite superior"
}

// PATCH /quotes/:id/reject
// Rechazar cotización
{
  reason: "No disponibilidad para las fechas solicitadas"
}

// GET /quotes/stats
// Estadísticas de cotizaciones
{
  pending: 12,
  approved: 47,
  rejected: 8,
  conversionRate: 68,
  totalValue: 28500
}
```

#### **Servicios (Services)**

```javascript
// GET /services
// Listar servicios (público o por proveedor)
// Query params: type, provider, available, featured

// GET /services/:id
// Detalle de servicio

// POST /services
// Crear nuevo servicio (solo proveedor/admin)
// Headers: Authorization: Bearer {token}

// PATCH /services/:id
// Actualizar servicio

// DELETE /services/:id
// Desactivar servicio
```

#### **Disponibilidad (Availability)**

```javascript
// GET /availability
// Obtener disponibilidad
// Query params: serviceId, dateFrom, dateTo

// POST /availability/bulk
// Actualizar disponibilidad en bloque
{
  serviceId: "SRV-HOTEL-001",
  dates: [
    { date: "2026-02-15", available: 3, price: 275 },
    { date: "2026-02-16", available: 3, price: 275 },
    ...
  ]
}

// PATCH /availability/block
// Bloquear fechas específicas
{
  serviceId: "SRV-HOTEL-001",
  dateFrom: "2026-03-10",
  dateTo: "2026-03-17",
  reason: "Mantenimiento programado"
}
```

#### **Proveedores (Providers)**

```javascript
// GET /providers
// Listar proveedores (solo admin)

// GET /providers/:id
// Detalle de proveedor

// POST /providers
// Crear proveedor (solo admin)

// PATCH /providers/:id
// Actualizar proveedor

// GET /providers/:id/stats
// Estadísticas del proveedor
{
  quotesReceived: 127,
  quotesApproved: 98,
  approvalRate: 77.2,
  totalRevenue: 45600,
  averageRating: 4.8
}
```

---

## 4. INTEGRACIÓN CON AIRTABLE API

### 🔗 Configuración de Conexión

```javascript
// config/airtable.js
const Airtable = require('airtable');

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY
}).base(process.env.AIRTABLE_BASE_ID);

module.exports = {
  quotes: base('CotizacionesGG'),
  services: base('Servicios'),
  providers: base('Proveedores'),
  availability: base('Disponibilidad'),
  users: base('Usuarios')
};
```

### 📝 Ejemplos de Operaciones

#### **Crear Cotización**

```javascript
// services/quoteService.js
const { quotes } = require('../config/airtable');

async function createQuote(quoteData) {
  try {
    const record = await quotes.create({
      'ID_Cotizacion': generateQuoteId(),
      'Fecha_Solicitud': new Date().toISOString(),
      'Servicio': [quoteData.serviceId],
      'Nombre_Servicio': quoteData.serviceName,
      'Agencia': quoteData.agency.name,
      'Email_Agencia': quoteData.agency.email,
      'Telefono_Agencia': quoteData.agency.phone,
      'Fecha_Checkin': quoteData.dates.checkin,
      'Fecha_Checkout': quoteData.dates.checkout,
      'Num_Noches': calculateNights(quoteData.dates),
      'Num_Adultos': quoteData.guests.adults,
      'Num_Ninos': quoteData.guests.children || 0,
      'Estado': 'Pendiente',
      'Precio_Total': quoteData.totalPrice,
      'Moneda': 'USD'
    });
    
    return {
      id: record.id,
      ...record.fields
    };
  } catch (error) {
    console.error('Error creating quote:', error);
    throw error;
  }
}

function generateQuoteId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `COT-${timestamp}-${random}`;
}

function calculateNights(dates) {
  const checkin = new Date(dates.checkin);
  const checkout = new Date(dates.checkout);
  const diffTime = Math.abs(checkout - checkin);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

module.exports = { createQuote };
```

#### **Obtener Cotizaciones Pendientes**

```javascript
async function getPendingQuotes(providerId = null) {
  try {
    let filterFormula = "{Estado} = 'Pendiente'";
    
    if (providerId) {
      filterFormula += ` AND FIND('${providerId}', {Proveedor})`;
    }
    
    const records = await quotes.select({
      filterByFormula: filterFormula,
      sort: [{ field: 'Fecha_Solicitud', direction: 'desc' }],
      maxRecords: 100
    }).all();
    
    return records.map(record => ({
      id: record.id,
      ...record.fields
    }));
  } catch (error) {
    console.error('Error fetching pending quotes:', error);
    throw error;
  }
}
```

#### **Aprobar Cotización**

```javascript
async function approveQuote(recordId, approverData) {
  try {
    const record = await quotes.update(recordId, {
      'Estado': 'Aprobada',
      'Fecha_Aprobacion': new Date().toISOString(),
      'Aprobado_Por': approverData.name,
      'Notas_Proveedor': approverData.notes || null
    });
    
    // Enviar email de notificación a la agencia
    await sendApprovalEmail(record.fields);
    
    return {
      id: record.id,
      ...record.fields
    };
  } catch (error) {
    console.error('Error approving quote:', error);
    throw error;
  }
}
```

#### **Actualizar Disponibilidad**

```javascript
const { availability } = require('../config/airtable');

async function updateAvailability(serviceId, dateUpdates) {
  try {
    const updates = dateUpdates.map(update => ({
      fields: {
        'Servicio': [serviceId],
        'Fecha': update.date,
        'Estado': update.available > 0 ? 'Disponible' : 'Agotado',
        'Unidades_Disponibles': update.available,
        'Precio_Dia': update.price || null
      }
    }));
    
    // Airtable permite hasta 10 registros por batch
    const batches = chunkArray(updates, 10);
    
    for (const batch of batches) {
      await availability.create(batch);
    }
    
    return { success: true, updated: updates.length };
  } catch (error) {
    console.error('Error updating availability:', error);
    throw error;
  }
}

function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
```

---

## 5. FLUJOS DE TRABAJO

### 📋 Flujo: Cotización Completa

```
1. AGENCIA solicita cotización (Frontend Público)
   ↓
2. Sistema crea registro en Airtable.CotizacionesGG
   Estado: "Pendiente"
   ↓
3. Sistema envía notificación a PROVEEDOR
   Email + Notificación en Panel
   ↓
4. PROVEEDOR revisa en su Dashboard
   Panel de Administración → Cotizaciones Pendientes
   ↓
5. PROVEEDOR decide:
   
   A) APROBAR:
      - Actualiza estado a "Aprobada"
      - Puede agregar notas/condiciones
      - Sistema envía confirmación a AGENCIA
      - Se crea registro en Reservas (si confirma agencia)
   
   B) RECHAZAR:
      - Actualiza estado a "Rechazada"
      - Debe incluir motivo
      - Sistema notifica a AGENCIA
   
   C) SOLICITAR MÁS INFO:
      - Actualiza estado a "Información Solicitada"
      - Agrega comentarios/preguntas
      - Sistema notifica a AGENCIA
   ↓
6. Si APROBADA → AGENCIA recibe confirmación
   Puede proceder a reserva formal
   ↓
7. ADMIN GuiaSAI puede supervisar todo el proceso
   Dashboard con analytics y métricas
```

### 🗓️ Flujo: Gestión de Disponibilidad

```
1. PROVEEDOR accede a Calendario
   Panel → Disponibilidad
   ↓
2. Visualiza mes completo con estados:
   - Verde: Disponible
   - Gris: Reservado
   - Rojo: Bloqueado
   ↓
3. PROVEEDOR puede:
   
   A) BLOQUEAR fechas (mantenimiento, eventos privados)
   B) ACTUALIZAR precios (temporada alta, ofertas)
   C) MODIFICAR inventario disponible
   ↓
4. Cambios se guardan en Airtable.Disponibilidad
   ↓
5. Frontend Público refleja disponibilidad actualizada
   en tiempo real (o con cache de 5-10 minutos)
```

---

## 6. SEGURIDAD Y AUTENTICACIÓN

### 🔐 JWT Authentication

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'No tienes permiso para esta acción' 
      });
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRoles };
```

### 🛡️ Protección de Rutas

```javascript
// routes/quotes.js
const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Ruta pública - crear cotización
router.post('/quotes', createQuote);

// Rutas protegidas - solo proveedores y admins
router.get('/quotes', 
  authenticateToken, 
  authorizeRoles('Proveedor', 'Administrador'),
  getQuotes
);

router.patch('/quotes/:id/approve',
  authenticateToken,
  authorizeRoles('Proveedor', 'Administrador'),
  approveQuote
);

// Ruta exclusiva admins
router.get('/quotes/all',
  authenticateToken,
  authorizeRoles('Administrador'),
  getAllQuotes
);

module.exports = router;
```

### 🔑 Variables de Entorno

```bash
# .env
NODE_ENV=production
PORT=3000

# Airtable
AIRTABLE_API_KEY=keyXXXXXXXXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRES_IN=30d

# Email (SendGrid o similar)
EMAIL_SERVICE=sendgrid
EMAIL_API_KEY=SG.XXXXXXXXXXXXXXXX
EMAIL_FROM=noreply@guiasai.com

# URLs
FRONTEND_URL=https://guiasai.com
DASHBOARD_URL=https://panel.guiasai.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 7. GUÍA DE IMPLEMENTACIÓN

### 📦 Stack Tecnológico Recomendado

**Backend:**
- Node.js 18+ (LTS)
- Express.js 4.x
- Airtable.js (SDK oficial)
- JWT para autenticación
- Nodemailer o SendGrid (emails)
- Express-validator (validación)

**Frontend Dashboard:**
- React 18+
- TypeScript
- TanStack Query (React Query) para fetching
- Zustand o Redux Toolkit (state)
- React Router v6
- Axios

**DevOps:**
- Vercel o Railway (hosting backend)
- Vercel (hosting frontend)
- GitHub Actions (CI/CD)

### 🚀 Pasos de Implementación

#### **FASE 1: Setup Inicial (Semana 1)**

```bash
# 1. Crear proyecto Node.js
mkdir guiasai-backend
cd guiasai-backend
npm init -y

# 2. Instalar dependencias
npm install express airtable dotenv jsonwebtoken bcrypt cors
npm install nodemon --save-dev

# 3. Estructura de carpetas
mkdir -p src/{config,controllers,middleware,routes,services,utils}
touch src/index.js .env
```

**Estructura de archivos:**
```
guiasai-backend/
├── src/
│   ├── config/
│   │   ├── airtable.js
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── quoteController.js
│   │   └── serviceController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── validation.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── quotes.js
│   │   └── services.js
│   ├── services/
│   │   ├── quoteService.js
│   │   ├── serviceService.js
│   │   └── emailService.js
│   ├── utils/
│   │   └── helpers.js
│   └── index.js
├── .env
├── .gitignore
└── package.json
```

#### **FASE 2: Configurar Airtable (Semana 1-2)**

1. **Crear Base en Airtable:**
   - Ir a airtable.com
   - Crear base "GuiaSAI_Business"
   - Crear tablas según estructura documentada

2. **Obtener API Key:**
   - Account → API
   - Copiar Personal Access Token

3. **Configurar conexión:**
```javascript
// src/config/airtable.js
const Airtable = require('airtable');

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY
}).base(process.env.AIRTABLE_BASE_ID);

module.exports = {
  quotes: base('CotizacionesGG'),
  services: base('Servicios'),
  providers: base('Proveedores'),
  availability: base('Disponibilidad'),
  users: base('Usuarios')
};
```

#### **FASE 3: API Básica (Semana 2-3)**

```javascript
// src/index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const quoteRoutes = require('./routes/quotes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/quotes', quoteRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
```

#### **FASE 4: Dashboard Frontend (Semana 3-5)**

```bash
# Crear proyecto React
npx create-react-app guiasai-dashboard --template typescript
cd guiasai-dashboard

# Instalar dependencias
npm install @tanstack/react-query axios react-router-dom zustand
npm install recharts date-fns
```

**Estructura React:**
```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── Layout.tsx
│   ├── quotes/
│   │   ├── QuotesList.tsx
│   │   ├── QuoteCard.tsx
│   │   └── QuoteActions.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Table.tsx
│       └── Modal.tsx
├── pages/
│   ├── Dashboard.tsx
│   ├── Quotes.tsx
│   └── Availability.tsx
├── services/
│   └── api.ts
├── store/
│   └── authStore.ts
├── types/
│   └── index.ts
├── App.tsx
└── index.tsx
```

#### **FASE 5: Integración Email (Semana 4)**

```javascript
// src/services/emailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  service: 'sendgrid',
  auth: {
    user: 'apikey',
    pass: process.env.EMAIL_API_KEY
  }
});

async function sendQuoteNotification(quote, provider) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: provider.email,
    subject: `Nueva Cotización #${quote.ID_Cotizacion}`,
    html: `
      <h2>Nueva Solicitud de Cotización</h2>
      <p>Servicio: ${quote.Nombre_Servicio}</p>
      <p>Agencia: ${quote.Agencia}</p>
      <p>Fechas: ${quote.Fecha_Checkin} al ${quote.Fecha_Checkout}</p>
      <p>Valor: $${quote.Precio_Total} ${quote.Moneda}</p>
      <a href="${process.env.DASHBOARD_URL}/quotes/${quote.ID_Cotizacion}">
        Ver Detalle
      </a>
    `
  };
  
  return transporter.sendMail(mailOptions);
}

module.exports = { sendQuoteNotification };
```

#### **FASE 6: Testing y Deploy (Semana 5-6)**

**Testing:**
```bash
npm install jest supertest --save-dev
```

```javascript
// __tests__/quotes.test.js
const request = require('supertest');
const app = require('../src/index');

describe('Quotes API', () => {
  it('should create a new quote', async () => {
    const res = await request(app)
      .post('/api/v1/quotes')
      .send({
        serviceId: 'SRV-HOTEL-001',
        agency: {
          name: 'Test Agency',
          email: 'test@example.com'
        },
        // ... más datos
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
  });
});
```

**Deploy en Vercel:**
```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

---

## 📊 MÉTRICAS Y MONITOREO

### KPIs a Trackear:

1. **Cotizaciones:**
   - Tasa de conversión (aprobadas/totales)
   - Tiempo promedio de respuesta
   - Valor promedio de cotización

2. **Proveedores:**
   - Tasa de aprobación por proveedor
   - Tiempo promedio de respuesta
   - Revenue generado

3. **Sistema:**
   - Uptime
   - Latencia de API
   - Errores de Airtable

### Herramientas Recomendadas:
- **Sentry** - Error tracking
- **Mixpanel/Amplitude** - Analytics
- **Uptime Robot** - Monitoring

---

## 🎯 CHECKLIST FINAL

### Backend:
- [ ] API endpoints implementados
- [ ] Autenticación JWT funcionando
- [ ] Integración Airtable completa
- [ ] Email notifications configuradas
- [ ] Rate limiting implementado
- [ ] Error handling robusto
- [ ] Tests unitarios >80% coverage

### Dashboard:
- [ ] Login funcional
- [ ] Lista de cotizaciones con filtros
- [ ] Aprobar/rechazar cotizaciones
- [ ] Calendario de disponibilidad
- [ ] Gestión de servicios
- [ ] Dashboard con métricas
- [ ] Responsive design

### Airtable:
- [ ] Todas las tablas creadas
- [ ] Relaciones configuradas
- [ ] Views útiles creadas
- [ ] Automations básicas (opcional)

### Seguridad:
- [ ] HTTPS en producción
- [ ] Secrets en variables de entorno
- [ ] CORS configurado correctamente
- [ ] Input validation en todos los endpoints
- [ ] Rate limiting activo

---

**Versión:** 1.0  
**Última actualización:** Enero 2026  
**Estado:** Ready for Implementation 🚀
