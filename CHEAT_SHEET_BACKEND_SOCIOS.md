# ⚡ Backend Socios - Cheat Sheet Rápido

> Referencia rápida para desarrolladores  
> Enero 2026

---

## 🚀 Inicio en 5 minutos

```bash
# 1. Clonar repo
git clone https://github.com/skystephens/GuanaGO-App-v2.git
cd GuanaGO-App-Enero-main

# 2. Setup backend
mkdir backend/partners
cd backend/partners
npm init -y
npm install express dotenv jsonwebtoken bcrypt airtable axios qrcode nodemailer cors helmet

# 3. Crear estructura
mkdir -p {routes,controllers,services,middleware,utils}
touch server.js .env {routes,controllers,services,middleware,utils}/*.js

# 4. Copiar código (ver CODIGO_BASE_BACKEND_SOCIOS.md)

# 5. Configurar .env
cp .env.example .env
# Editar con tus credenciales

# 6. Correr
npm run dev
```

---

## 📋 Rutas API Principales

```javascript
// AUTENTICACIÓN
POST   /api/v1/partners/auth/register
POST   /api/v1/partners/auth/login

// PERFIL (requiere JWT)
GET    /api/v1/partners/dashboard
GET    /api/v1/partners/profile
PATCH  /api/v1/partners/profile
GET    /api/v1/partners/qr-code

// PRODUCTOS (requiere JWT)
GET    /api/v1/partners/products
POST   /api/v1/partners/products
GET    /api/v1/partners/products/:id
PATCH  /api/v1/partners/products/:id
DELETE /api/v1/partners/products/:id

// VENTAS & PAGOS (requiere JWT)
GET    /api/v1/partners/sales?month=01&year=2026
GET    /api/v1/partners/payouts

// WEBHOOKS (Make.com)
POST   /api/v1/partners/webhooks/sync-callback
POST   /api/v1/partners/webhooks/make-error
```

---

## 🔐 Request Headers

```javascript
// Con autenticación
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Content-Type
Content-Type: application/json

// Ejemplo completo
fetch('https://api.guanago.travel/api/v1/partners/dashboard', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  }
})
```

---

## 📊 Estructura Airtable (4 Tablas)

### 1️⃣ Partners_Aliados
```
id | email | passwordHash | businessName | status | qrCode | commissionRate
```

### 2️⃣ PartnerProducts
```
id | partnerId | name | price | status | guiasaiId | guiasaiStatus
```

### 3️⃣ PartnerSales
```
id | partnerId | productId | originalAmount | commissionAmount | paymentStatus
```

### 4️⃣ PartnerPayouts
```
id | partnerId | period | totalCommissions | status | transferenceReference
```

---

## 💻 Código Mínimo Funcional

### 1. Server.js
```javascript
const express = require('express');
const app = express();

app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ ok: true }));

// Routes
app.use('/api/v1/partners/auth', require('./routes/auth'));
app.use('/api/v1/partners', require('./routes/partners'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Server en puerto ${PORT}`));

module.exports = app;
```

### 2. .env
```env
PARTNERS_PORT=3001
AIRTABLE_API_KEY=xxx
AIRTABLE_BASE_ID=xxx
JWT_SECRET=tu_secreto
MAKE_WEBHOOK_URL=https://hook.make.com/xxx
```

### 3. Auth Middleware
```javascript
const JWTService = require('../services/jwtService');

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Sin token' });
    
    req.partner = JWTService.verifyToken(token);
    next();
  } catch (err) {
    res.status(401).json({ error: 'No autorizado' });
  }
};
```

### 4. Login Básico
```javascript
const bcrypt = require('bcrypt');
const JWTService = require('../services/jwtService');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Buscar en Airtable
  const records = await base(TABLE).select({ 
    filterByFormula: `{email} = '${email}'` 
  }).firstPage();
  
  if (!records.length) return res.status(401).json({ error: 'Inválido' });
  
  const partner = records[0].fields;
  const valid = await bcrypt.compare(password, partner.passwordHash);
  
  if (!valid) return res.status(401).json({ error: 'Inválido' });
  
  const token = JWTService.generateToken(partner);
  res.json({ token, partner });
});
```

---

## 🧪 Testing Rápido

```bash
# Instalar
npm install --save-dev jest supertest

# Test register
curl -X POST http://localhost:3001/api/v1/partners/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@restaurant.com",
    "password": "SecurePass123!",
    "businessName": "Test Restaurant",
    "businessType": "restaurant",
    "phone": "+57 312 1234567",
    "latitude": 12.5849,
    "longitude": -81.7338,
    "address": "Test Address"
  }'

# Test login
curl -X POST http://localhost:3001/api/v1/partners/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@restaurant.com",
    "password": "SecurePass123!"
  }'

# Test dashboard (con token)
curl -X GET http://localhost:3001/api/v1/partners/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🔄 Variables Clave

### JWT
```javascript
// Generar
const token = jwt.sign(
  { id: 'par_123', email: 'test@email.com' },
  process.env.JWT_SECRET,
  { expiresIn: '30d' }
);

// Verificar
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

### Hashing Contraseña
```javascript
// Hash
const hash = await bcrypt.hash('password', 10);

// Verificar
const valid = await bcrypt.compare('password', hash);
```

### Airtable Query
```javascript
// Crear
await base(TABLE).create({ field: 'value' });

// Leer
const records = await base(TABLE)
  .select({ filterByFormula: `{field} = 'value'` })
  .firstPage();

// Actualizar
await base(TABLE).update(recordId, { field: 'newValue' });

// Borrar
await base(TABLE).destroy(recordId);
```

---

## 🐛 Debugging Rápido

```bash
# Ver logs en tiempo real
npm run dev

# Test específico
npm test -- --testNamePattern="register"

# Debug con node inspector
node --inspect server.js
# Luego: chrome://inspect

# Probar Make.com webhook
curl -X POST https://hook.make.com/xxxxx \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Ver variables de entorno
node -e "console.log(process.env)"
```

---

## 📱 Frontend - Integración Rápida

```javascript
// Login
const res = await fetch('https://api.guanago.travel/api/v1/partners/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const { token } = await res.json();
localStorage.setItem('partnerToken', token);

// Dashboard
const dashboard = await fetch('https://api.guanago.travel/api/v1/partners/dashboard', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const stats = await dashboard.json();

// Crear producto
const newProduct = await fetch('https://api.guanago.travel/api/v1/partners/products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'Tour Snorkel',
    price: 150000,
    description: '...',
    type: 'tour'
  })
});
```

---

## ⚙️ Environment Variables Rápidos

```env
# Development
PARTNERS_PORT=3001
NODE_ENV=development

# Production
PARTNERS_PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://socios.guanago.travel

# Database
AIRTABLE_API_KEY=patXXXXXX
AIRTABLE_BASE_ID=appXXXXXX

# Auth
JWT_SECRET=your_secret_key_at_least_32_chars_long
JWT_EXPIRATION=30d

# Make.com
MAKE_WEBHOOK_URL=https://hook.make.com/xxxxxxxx

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=socios@guanago.travel
SMTP_PASS=app_password

# AWS S3
AWS_S3_BUCKET=guanago-partners
AWS_S3_REGION=us-east-1
```

---

## 📦 Dependencies Esenciales

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "dotenv": "^16.3.1",
    "jsonwebtoken": "^9.1.2",
    "bcrypt": "^5.1.1",
    "airtable": "^0.12.2",
    "axios": "^1.6.0",
    "qrcode": "^1.5.3",
    "nodemailer": "^6.9.7",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "joi": "^17.11.0",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "jest": "^29.7.0",
    "supertest": "^6.3.3"
  }
}
```

---

## 🎯 Checklist Diario

- [ ] ¿Backend corre sin errores? `npm run dev`
- [ ] ¿JWT funciona? `curl /api/v1/partners/dashboard`
- [ ] ¿Airtable conecta? `console.log(records.length)`
- [ ] ¿Webhook gatilla? Check Make.com logs
- [ ] ¿Tests pasan? `npm test`
- [ ] ¿Logs limpios? No warnings en console

---

## 🚨 Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `Cannot find module` | Falta npm install | `npm install` |
| `ENOENT .env` | Falta archivo .env | `cp .env.example .env` |
| `Unauthorized` | Token inválido/expirado | Regenérate el token |
| `CORS error` | URL no en whitelist | Agregar a CORS_ORIGIN |
| `Airtable 404` | Base ID incorrecto | Verificar AIRTABLE_BASE_ID |
| `JWT secret missing` | JWT_SECRET vacío | Editar .env |

---

## 📚 Documentación Completa

- **BACKEND_SOCIOS_ARQUITECTURA.md** → Visión general
- **IMPLEMENTACION_BACKEND_SOCIOS.md** → Paso a paso
- **CODIGO_BASE_BACKEND_SOCIOS.md** → Código real
- **INTEGRACION_GUIASAI_MAKECOM.md** → Make.com + GuiaSAI
- **RESUMEN_EJECUTIVO_BACKEND_SOCIOS.md** → Visión ejecutiva

---

## 🏃 Quick Start (Copy-Paste)

```bash
# 1
git clone https://github.com/skystephens/GuanaGO-App-v2.git
cd GuanaGO-App-Enero-main/backend/partners

# 2
npm init -y && npm install express dotenv jsonwebtoken bcrypt airtable axios qrcode nodemailer cors helmet joi uuid

# 3
echo "PARTNERS_PORT=3001
AIRTABLE_API_KEY=xxx
AIRTABLE_BASE_ID=xxx
JWT_SECRET=supersecretkey
MAKE_WEBHOOK_URL=https://hook.make.com/xxx" > .env

# 4
mkdir -p {routes,controllers,services,middleware,utils}

# 5
# Copiar código de CODIGO_BASE_BACKEND_SOCIOS.md

# 6
npm run dev
```

---

## 🎬 Siguientes Pasos

1. ✅ Leer este cheat sheet
2. ⬜ Leer BACKEND_SOCIOS_ARQUITECTURA.md (20 min)
3. ⬜ Leer IMPLEMENTACION_BACKEND_SOCIOS.md (30 min)
4. ⬜ Copiar código de CODIGO_BASE_BACKEND_SOCIOS.md
5. ⬜ Crear Airtable (30 min)
6. ⬜ `npm run dev` (start coding!)
7. ⬜ Setup Make.com (1 hora)
8. ⬜ Deploy (30 min)

---

**¡A programar! 🚀**
