# 🚀 Guía de Implementación - Backend Socios

> Paso a paso para construir el backend de aliados locales  
> Fecha: Enero 23, 2026

---

## 📋 Índice

1. [Setup Inicial](#setup-inicial)
2. [Estructura Airtable](#estructura-airtable)
3. [Backend Express](#backend-express)
4. [Autenticación](#autenticación)
5. [Endpoints Principales](#endpoints-principales)
6. [Integración Make.com](#integración-makecom)
7. [Testing](#testing)

---

## Setup Inicial

### Paso 1: Crear Rama del Proyecto

```bash
# En tu terminal
cd "c:\Users\skysk\OneDrive\Documentos\GuanaGO 2026\GuanaGo-App-Enero-main"

# Crear rama para backend socios
git checkout -b feature/backend-socios

# Crear carpeta para backend de socios
mkdir backend/partners
cd backend/partners
```

### Paso 2: Estructura de Carpetas

```bash
# Crear estructura
mkdir -p {routes,controllers,services,middleware,utils,models,tests}

# Crear archivos principales
touch server.js .env index.js package.json
touch routes/auth.js routes/partners.js routes/products.js routes/sales.js routes/payouts.js
touch controllers/authController.js controllers/partnersController.js controllers/productsController.js
touch services/partnerService.js services/airtablePartnerService.js services/jwtService.js
touch middleware/auth.js middleware/errorHandler.js
touch utils/validators.js utils/helpers.js
```

### Paso 3: Instalar Dependencias

```bash
# Si no tienes un package.json específico para partners
npm init -y

# Instalar dependencias principales
npm install \
  express \
  dotenv \
  jsonwebtoken \
  bcrypt \
  airtable \
  axios \
  qrcode \
  nodemailer \
  cors \
  helmet \
  express-rate-limit \
  joi \
  uuid

# Dev dependencies
npm install --save-dev \
  nodemon \
  jest \
  supertest
```

---

## Estructura Airtable

### Paso 1: Crear Tablas en Airtable

Accede a https://airtable.com y crea las siguientes tablas en tu base GuanaGO:

#### Tabla 1: **Partners_Aliados**

| Campo | Tipo | Configuración |
|-------|------|---------------|
| `id` | Autonúmero | PK |
| `email` | Correo | Único |
| `businessName` | Texto | Requerido |
| `businessType` | Selección | restaurant / hotel / commerce / service / operator |
| `nit` | Texto | Único |
| `phone` | Teléfono | - |
| `address` | Texto largo | - |
| `city` | Texto | - |
| `latitude` | Número | - |
| `longitude` | Número | - |
| `logo` | Archivo | - |
| `description` | Texto largo | - |
| `hours` | Texto | JSON formato |
| `status` | Selección | pending / approved / rejected / suspended |
| `commissionRate` | Número (%) | Default: 10 |
| `bank` | Texto | - |
| `accountNumber` | Texto | - |
| `accountHolder` | Texto | - |
| `qrCode` | Texto | Unique, Auto-generated |
| `passwordHash` | Texto (cifrado) | No visible |
| `lastLogin` | Fecha/Hora | - |
| `approvedBy` | Texto | Admin email |
| `approvedAt` | Fecha | - |
| `createdAt` | Fecha | - |
| `updatedAt` | Fecha | - |

#### Tabla 2: **PartnerProducts**

| Campo | Tipo | Configuración |
|-------|------|---------------|
| `id` | Autonúmero | PK |
| `partnerId` | Texto (FK) | Link a Partners_Aliados |
| `name` | Texto | Requerido |
| `type` | Selección | tour / alojamiento / servicio / producto / otro |
| `description` | Texto largo | - |
| `price` | Número (COP) | - |
| `category` | Selección | Valores según tipo |
| `images` | Archivo (múltiple) | - |
| `status` | Selección | active / inactive / pending / published |
| `stock` | Número | - |
| `views` | Número | Rollup COUNT |
| `conversions` | Número | Rollup COUNT |
| `commissionGenerated` | Número (COP) | Rollup SUM |
| `guiasaiId` | Texto | Link a GuiaSAI B2B |
| `guiasaiStatus` | Selección | synced / pending / error |
| `createdAt` | Fecha | - |
| `updatedAt` | Fecha | - |

#### Tabla 3: **PartnerSales**

| Campo | Tipo | Configuración |
|-------|------|---------------|
| `id` | Autonúmero | PK |
| `partnerId` | Texto (FK) | - |
| `productId` | Texto (FK) | - |
| `clientName` | Texto | - |
| `clientEmail` | Correo | - |
| `originalAmount` | Número (COP) | - |
| `commissionPercent` | Número (%) | - |
| `commissionAmount` | Número (COP) | Formula: originalAmount * commissionPercent / 100 |
| `paymentStatus` | Selección | pending / confirmed / rejected / refunded |
| `orderReference` | Texto | Make.com ref |
| `saleDate` | Fecha | - |
| `paymentDate` | Fecha | - |
| `notes` | Texto largo | - |

#### Tabla 4: **PartnerPayouts**

| Campo | Tipo | Configuración |
|-------|------|---------------|
| `id` | Autonúmero | PK |
| `partnerId` | Texto (FK) | - |
| `period` | Texto | "2026-01", "2026-02", etc |
| `startDate` | Fecha | - |
| `endDate` | Fecha | - |
| `totalCommissions` | Número (COP) | Rollup SUM from PartnerSales |
| `totalPaid` | Número (COP) | - |
| `pendingAmount` | Número (COP) | Formula: totalCommissions - totalPaid |
| `paymentMethod` | Selección | transferencia / billetera / otro |
| `status` | Selección | pending / processed / failed |
| `processedAt` | Fecha/Hora | - |
| `transferenceReference` | Texto | - |
| `receipt` | Archivo | - |

### Paso 2: Crear Vistas Airtable

#### Vista: Partners - Pendientes Aprobación
```
Filter: status = "pending"
Sort: createdAt DESC
```

#### Vista: Partners - Activos
```
Filter: status = "approved"
Sort: businessName ASC
```

#### Vista: Products - Por Partner
```
Grouping: partnerId
Sort: status DESC, updatedAt DESC
```

#### Vista: Sales - Últimas Transacciones
```
Filter: saleDate >= last 30 days
Sort: saleDate DESC
Limit: 100
```

---

## Backend Express

### Paso 1: Server Básico

**Archivo: `backend/partners/server.js`**

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Middleware de seguridad
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // límite de 100 req por ventana
});
app.use(limiter);

// Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Routes
app.use('/api/v1/partners/auth', require('./routes/auth'));
app.use('/api/v1/partners', require('./routes/partners'));
app.use('/api/v1/partners/products', require('./routes/products'));
app.use('/api/v1/partners/sales', require('./routes/sales'));
app.use('/api/v1/partners/payouts', require('./routes/payouts'));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor'
  });
});

const PORT = process.env.PARTNERS_PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Partners Backend corriendo en puerto ${PORT}`);
});

module.exports = app;
```

### Paso 2: .env Configuración

**Archivo: `backend/partners/.env`**

```env
# Server
PARTNERS_PORT=3001
NODE_ENV=development

# Airtable
AIRTABLE_API_KEY=your_api_key_here
AIRTABLE_BASE_ID=your_base_id_here
AIRTABLE_TABLE_PARTNERS=Partners_Aliados
AIRTABLE_TABLE_PRODUCTS=PartnerProducts
AIRTABLE_TABLE_SALES=PartnerSales
AIRTABLE_TABLE_PAYOUTS=PartnerPayouts

# JWT
JWT_SECRET=your_super_secret_key_change_this_in_production
JWT_EXPIRATION=30d

# Make.com Webhooks
MAKE_WEBHOOK_PRODUCTS=https://hook.make.com/xxxxx
MAKE_WEBHOOK_SALES=https://hook.make.com/xxxxx
MAKE_GUIASAI_SYNC=https://hook.make.com/xxxxx

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@guanago.travel
SMTP_PASS=app_password_here
SMTP_FROM=GuanaGO Socios <noreply@guanago.travel>

# CORS
CORS_ORIGIN=http://localhost:3000,https://guanago.travel,https://portal-socios.guanago.travel

# AWS S3 (para imágenes)
AWS_S3_BUCKET=guanago-partners
AWS_S3_REGION=us-east-1
AWS_S3_ACCESS_KEY=xxxxx
AWS_S3_SECRET_KEY=xxxxx

# Stripe (pagos)
STRIPE_API_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

---

## Autenticación

### Paso 1: JWT Service

**Archivo: `backend/partners/services/jwtService.js`**

```javascript
const jwt = require('jsonwebtoken');

class JWTService {
  static generateToken(partner) {
    return jwt.sign(
      {
        id: partner.id,
        email: partner.email,
        businessName: partner.businessName,
        role: 'partner'
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '30d' }
    );
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      throw new Error('Token inválido o expirado');
    }
  }

  static decodeToken(token) {
    return jwt.decode(token);
  }
}

module.exports = JWTService;
```

### Paso 2: Auth Middleware

**Archivo: `backend/partners/middleware/auth.js`**

```javascript
const JWTService = require('../services/jwtService');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const decoded = JWTService.verifyToken(token);
    req.partner = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'No autorizado: ' + err.message });
  }
};

module.exports = authMiddleware;
```

### Paso 3: Auth Routes

**Archivo: `backend/partners/routes/auth.js`**

```javascript
const express = require('express');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const Airtable = require('airtable');
const JWTService = require('../services/jwtService');
const Joi = require('joi');

const router = express.Router();

// Airtable connection
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

// Validators
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  businessName: Joi.string().required(),
  businessType: Joi.string().valid('restaurant', 'hotel', 'commerce', 'service', 'operator').required(),
  phone: Joi.string().required(),
  latitude: Joi.number().required(),
  longitude: Joi.number().required(),
  address: Joi.string().required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// POST /register
router.post('/register', async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Verificar si email ya existe
    const existing = await base(process.env.AIRTABLE_TABLE_PARTNERS)
      .select({ filterByFormula: `{email} = '${value.email}'` })
      .firstPage();

    if (existing.length > 0) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(value.password, 10);

    // Crear registro en Airtable
    const partnerId = `par_${uuidv4().substring(0, 8)}`;
    const qrCode = `${partnerId}-qr-${Date.now()}`;

    const newPartner = await base(process.env.AIRTABLE_TABLE_PARTNERS).create({
      id: partnerId,
      email: value.email,
      passwordHash,
      businessName: value.businessName,
      businessType: value.businessType,
      phone: value.phone,
      latitude: value.latitude,
      longitude: value.longitude,
      address: value.address,
      status: 'pending',
      commissionRate: 10,
      qrCode,
      createdAt: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      message: 'Registro exitoso. Por favor verifica tu email.',
      partnerId: partnerId
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /login
router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Buscar partner
    const records = await base(process.env.AIRTABLE_TABLE_PARTNERS)
      .select({ filterByFormula: `{email} = '${value.email}'` })
      .firstPage();

    if (records.length === 0) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    const partner = records[0].fields;

    // Verificar contraseña
    const isValid = await bcrypt.compare(value.password, partner.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    // Verificar status
    if (partner.status !== 'approved') {
      return res.status(403).json({ 
        error: `Tu cuenta está ${partner.status}. Por favor espera aprobación.` 
      });
    }

    // Generar token
    const token = JWTService.generateToken({
      id: partner.id,
      email: partner.email,
      businessName: partner.businessName
    });

    // Actualizar lastLogin
    await base(process.env.AIRTABLE_TABLE_PARTNERS).update(records[0].id, {
      lastLogin: new Date().toISOString()
    });

    res.json({
      success: true,
      token,
      partner: {
        id: partner.id,
        email: partner.email,
        businessName: partner.businessName,
        businessType: partner.businessType,
        status: partner.status
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

---

## Endpoints Principales

### Paso 1: Partners Routes

**Archivo: `backend/partners/routes/partners.js`**

```javascript
const express = require('express');
const Airtable = require('airtable');
const authMiddleware = require('../middleware/auth');
const QRCode = require('qrcode');

const router = express.Router();
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

// GET /dashboard
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const partnerId = req.partner.id;

    // Obtener datos del partner
    const partners = await base(process.env.AIRTABLE_TABLE_PARTNERS)
      .select({ filterByFormula: `{id} = '${partnerId}'` })
      .firstPage();

    if (partners.length === 0) {
      return res.status(404).json({ error: 'Partner no encontrado' });
    }

    const partner = partners[0].fields;

    // Obtener sales del mes
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const sales = await base(process.env.AIRTABLE_TABLE_SALES)
      .select({
        filterByFormula: `AND({partnerId} = '${partnerId}', {saleDate} >= '${firstDay}', {saleDate} <= '${lastDay}')`
      })
      .all();

    const totalSales = sales.reduce((sum, s) => sum + (s.fields.originalAmount || 0), 0);
    const totalCommission = sales.reduce((sum, s) => sum + (s.fields.commissionAmount || 0), 0);

    // Obtener productos
    const products = await base(process.env.AIRTABLE_TABLE_PRODUCTS)
      .select({ filterByFormula: `{partnerId} = '${partnerId}'` })
      .all();

    res.json({
      partnerId,
      businessName: partner.businessName,
      totalSales,
      totalCommission,
      pendingPayout: partner.pendingAmount || 0,
      activeProducts: products.filter(p => p.fields.status === 'active').length,
      qrScans: Math.floor(Math.random() * 200), // Placeholder
      conversionRate: sales.length > 0 ? ((sales.length / 145) * 100).toFixed(1) : 0,
      lastUpdated: new Date().toISOString()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const records = await base(process.env.AIRTABLE_TABLE_PARTNERS)
      .select({ filterByFormula: `{id} = '${req.partner.id}'` })
      .firstPage();

    if (records.length === 0) {
      return res.status(404).json({ error: 'Partner no encontrado' });
    }

    const partner = records[0].fields;
    res.json({
      id: partner.id,
      email: partner.email,
      businessName: partner.businessName,
      businessType: partner.businessType,
      nit: partner.nit,
      phone: partner.phone,
      location: {
        address: partner.address,
        city: partner.city,
        latitude: partner.latitude,
        longitude: partner.longitude
      },
      logo: partner.logo?.[0]?.url,
      status: partner.status,
      commissionRate: partner.commissionRate,
      bankAccount: {
        bank: partner.bank,
        accountNumber: partner.accountNumber,
        accountHolder: partner.accountHolder
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /profile
router.patch('/profile', authMiddleware, async (req, res) => {
  try {
    const { phone, bankAccount } = req.body;

    const records = await base(process.env.AIRTABLE_TABLE_PARTNERS)
      .select({ filterByFormula: `{id} = '${req.partner.id}'` })
      .firstPage();

    if (records.length === 0) {
      return res.status(404).json({ error: 'Partner no encontrado' });
    }

    const updates = {};
    if (phone) updates.phone = phone;
    if (bankAccount) {
      updates.bank = bankAccount.bank;
      updates.accountNumber = bankAccount.accountNumber;
      updates.accountHolder = bankAccount.accountHolder;
    }
    updates.updatedAt = new Date().toISOString();

    await base(process.env.AIRTABLE_TABLE_PARTNERS).update(records[0].id, updates);

    res.json({ success: true, message: 'Perfil actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /qr-code
router.get('/qr-code', authMiddleware, async (req, res) => {
  try {
    const records = await base(process.env.AIRTABLE_TABLE_PARTNERS)
      .select({ filterByFormula: `{id} = '${req.partner.id}'` })
      .firstPage();

    if (records.length === 0) {
      return res.status(404).json({ error: 'Partner no encontrado' });
    }

    const partner = records[0].fields;
    const qrUrl = `https://guanago.travel/p/${partner.id}`;

    // Generar QR
    const qrCode = await QRCode.toDataURL(qrUrl);

    res.json({
      qrCode,
      partnerId: partner.id,
      qrUrl,
      scans: {
        total: 145,
        thisMonth: 42,
        lastScan: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

---

## Integración Make.com

### Paso 1: Webhook de Productos

Cuando un partner agrega/edita un producto en el panel, se gatilla automáticamente a Make.com:

**Make.com Scenario:**

```
Trigger: HTTP webhook (POST)
├─ URL: https://hook.make.com/xxxxxx/products
├─ Method: POST
├─ Expected body: {
│   "partnerId": "par_xxx",
│   "productId": "prod_xxx",
│   "name": "...",
│   "type": "tour",
│   "price": 80000,
│   "description": "...",
│   "images": [...]
│ }
│
Action 1: Format data
├─ Enrich with partner info
├─ Add timestamp
└─ Generate SKU

Action 2: Call GuiaSAI B2B API
├─ POST /api/products
├─ Map fields
└─ Create/update product

Action 3: Update Airtable
├─ Set guiasaiId
├─ Set guiasaiStatus = 'synced'
└─ Update timestamp

Action 4: Send notification
└─ Email to partner: "Producto publicado en GuiaSAI"
```

---

## Testing

### Paso 1: Test Básicos

**Archivo: `backend/partners/tests/auth.test.js`**

```javascript
const request = require('supertest');
const app = require('../server');

describe('Auth Endpoints', () => {
  test('POST /api/v1/partners/auth/register - debe registrar nuevo partner', async () => {
    const res = await request(app)
      .post('/api/v1/partners/auth/register')
      .send({
        email: 'test@restaurant.com',
        password: 'SecurePass123!',
        businessName: 'Test Restaurant',
        businessType: 'restaurant',
        phone: '+57 312 1234567',
        latitude: 12.5849,
        longitude: -81.7338,
        address: 'Test Address'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });

  test('POST /api/v1/partners/auth/login - debe autenticar partner', async () => {
    // Primero registrar
    await request(app).post('/api/v1/partners/auth/register').send({...});

    // Luego login
    const res = await request(app)
      .post('/api/v1/partners/auth/login')
      .send({
        email: 'test@restaurant.com',
        password: 'SecurePass123!'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });
});
```

---

## 🎯 Checklist de Implementación

### Fase 1: Setup (Semana 1-2)
- [ ] Crear estructura de carpetas
- [ ] Instalar dependencias
- [ ] Configurar Airtable (crear tablas)
- [ ] Setup .env
- [ ] Server Express básico

### Fase 2: Auth (Semana 2-3)
- [ ] JWT Service
- [ ] Auth Middleware
- [ ] Routes: Register, Login
- [ ] Validación con Joi
- [ ] Hash de contraseñas

### Fase 3: Endpoints (Semana 3-4)
- [ ] Dashboard endpoint
- [ ] Profile CRUD
- [ ] Products CRUD
- [ ] Sales listado
- [ ] Payouts listado
- [ ] QR generator

### Fase 4: Integraciones (Semana 4-5)
- [ ] Make.com webhooks
- [ ] GuiaSAI B2B sync
- [ ] Email notifications
- [ ] Error handling robusto
- [ ] Logging

### Fase 5: Testing (Semana 5)
- [ ] Unit tests
- [ ] Integration tests
- [ ] End-to-end tests
- [ ] Performance tests

---

## 📞 Endpoints Resumen Rápido

```bash
# Auth
POST   /api/v1/partners/auth/register
POST   /api/v1/partners/auth/login

# Partners
GET    /api/v1/partners/dashboard
GET    /api/v1/partners/profile
PATCH  /api/v1/partners/profile
GET    /api/v1/partners/qr-code

# Products
GET    /api/v1/partners/products
POST   /api/v1/partners/products
GET    /api/v1/partners/products/:id
PATCH  /api/v1/partners/products/:id
DELETE /api/v1/partners/products/:id

# Sales
GET    /api/v1/partners/sales?month=01&year=2026

# Payouts
GET    /api/v1/partners/payouts
```

---

## 🚀 Comandos Útiles

```bash
# Desarrollo
npm run dev

# Testing
npm test

# Linting
npm run lint

# Build
npm run build

# Deploy
npm start
```

---

Continuaremos en el siguiente documento con la **integración con GuiaSAI B2B** y el **frontend del panel**.
