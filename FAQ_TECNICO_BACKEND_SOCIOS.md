# ❓ Preguntas & Respuestas Técnicas - Backend Socios

> FAQ técnico para resolver dudas comunes durante la implementación  
> Enero 2026

---

## 🔐 AUTENTICACIÓN

### P: ¿Por qué JWT en lugar de sesiones?
**R:** JWT es mejor para APIs móviles, escalabilidad sin estado, y mejor para microservicios. Con sesiones necesitarías Redis/base de datos para mantener estado.

```javascript
// JWT: Stateless (mejor para escalar)
Authorization: Bearer eyJhbGci...

// Sessions: Stateful (requiere db)
Cookie: session_id=xyz
```

---

### P: ¿Cuánto dura el JWT? ¿Puedo cambiarlo?
**R:** Por defecto 30 días (en .env: `JWT_EXPIRATION=30d`). Puedes cambiar:
- **Corto (7d):** Más seguro pero usuario debe login más seguido
- **Largo (90d):** Más cómodo pero menos seguro
- **Recomendado:** 30 días (balance)

```env
# En .env
JWT_EXPIRATION=30d      # Cambiar aquí
```

---

### P: ¿Qué pasa si el JWT expira?
**R:** Dos opciones:

**Opción 1: Refresh Token** (Recomendado)
```javascript
POST /api/v1/partners/auth/refresh
{
  "refreshToken": "long_lived_token"
}
// Response: nuevo JWT válido 30 días
```

**Opción 2: Re-login**
```javascript
// Si JWT expira, usuario vuelve a login
// Mejor UX en web, OK en mobile
```

---

### P: ¿Cómo protejo contraseña en Airtable?
**R:** Nunca guardes contraseña plana. Usa bcrypt:

```javascript
// CORRECTO
const hash = await bcrypt.hash(password, 10);
await db.Partners.create({ email, passwordHash: hash });

// INCORRECTO ❌
await db.Partners.create({ email, password: password });
```

---

## 📊 AIRTABLE

### P: ¿Por qué 4 tablas y no todo en una?
**R:** Normalización de datos = mejor performance y mantenibilidad:

| Tabla | Razón |
|-------|-------|
| Partners_Aliados | Datos de usuarios (1 por aliado) |
| PartnerProducts | 1 aliado = muchos productos |
| PartnerSales | 1 producto = muchas ventas |
| PartnerPayouts | Pagos mensuales agregados |

Si todo estuviera en una tabla: duplicación, queries lentas, mantenimiento difícil.

---

### P: ¿Cómo manejo relaciones entre tablas?
**R:** En Airtable usas campos de link o almacenas IDs:

```javascript
// PartnerProducts record:
{
  "id": "prod_abc123",
  "partnerId": "par_001",  // ← Link a Partners_Aliados
  "name": "Tour Snorkel"
}

// Query por partner:
const products = await base(PRODUCTS_TABLE)
  .select({ filterByFormula: `{partnerId} = 'par_001'` })
  .all();
```

---

### P: ¿Airtable tiene límites?
**R:** Sí, importantes:

| Límite | Airtable Free | Airtable Pro |
|--------|---------------|-------------|
| Rows | 1,200 | Unlimited |
| API calls | 4 req/seg | 5 req/seg |
| Archivos | 1 GB | 20 GB |
| Costo | $0 | $20 usuario/mes |

**Para 500+ socios:** Necesitarás Pro o migrar a SQL en Fase 2.

---

### P: ¿Cómo backup datos en Airtable?
**R:** Airtable tiene backups automáticos. Para exportar:

```bash
# Exportar manualmente
1. Abrir tabla
2. Share → Export
3. Descargar CSV

# O automatizar con Make.com
# Cada día → Google Drive
```

---

## 🔌 MAKE.COM

### P: ¿Qué es Make.com exactamente?
**R:** Es una plataforma de automatización (integración de servicios sin código). Tu Backend dispara webhooks → Make.com procesa → Actualiza GuiaSAI.

```
Backend guarda producto
   ↓ Webhook
Make.com
   ↓ Procesa
GuiaSAI B2B recibe
```

---

### P: ¿Cuánto cuesta Make.com?
**R:** 
- **Free:** 1,000 operaciones/mes ($0)
- **Basic:** 10,000 operaciones/mes ($9.99)
- **Pro:** 100,000 operaciones/mes ($99)

**Estimado para socios:** ~500 productos × 2 syncs = 1,000 ops/mes = **FREE Plan suficiente**

---

### P: ¿Qué si Make.com falla?
**R:** Implementa retry automático:

```javascript
// backend/services/retryService.js
class RetryService {
  static async retryProductSync(productId, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        // Reintent webhook
        await axios.post(MAKE_WEBHOOK_URL, product);
        return { success: true };
      } catch (err) {
        if (i === maxRetries - 1) throw err;
        await sleep(5000); // Esperar 5s antes de reintentar
      }
    }
  }
}
```

---

### P: ¿Cómo logueo los webhooks de Make.com?
**R:** Crea un endpoint para que Make.com loguee:

```javascript
router.post('/webhooks/log', (req, res) => {
  const logEntry = {
    timestamp: new Date(),
    scenario: req.body.scenario,
    status: req.body.status,
    data: req.body
  };

  // Guardar en Google Sheets o archivo
  fs.appendFileSync('webhook-logs.json', JSON.stringify(logEntry) + '\n');

  res.json({ ok: true });
});
```

---

## 🛒 PRODUCTOS & COMISIONES

### P: ¿Cómo calculo comisiones automáticamente?
**R:** En Airtable usa fórmulas:

```
// PartnerSales table:
// Campo: commissionAmount
FORMULA: {originalAmount} * {commissionPercent} / 100

// Ejemplo:
// originalAmount = 150,000
// commissionPercent = 10
// Result = 150,000 * 10 / 100 = 15,000
```

---

### P: ¿Puedo tener diferentes comisiones por tipo de producto?
**R:** Sí, agrega lógica en backend:

```javascript
const commissionRates = {
  'tour': 10,          // 10%
  'alojamiento': 8,    // 8%
  'servicio': 5,       // 5%
  'otro': 7            // 7%
};

// Al guardar venta:
const rate = commissionRates[product.type];
const commission = amount * (rate / 100);
```

---

### P: ¿Cómo evito fraude en ventas?
**R:** Valida cada venta:

```javascript
// 1. Verificar que producto existe
const product = await airtable.get(productId);
if (!product) throw new Error('Producto no existe');

// 2. Verificar cantidad disponible
if (product.stock < quantity) throw new Error('Stock insuficiente');

// 3. Verificar precio no cambió más de X%
const priceDiff = Math.abs(requestedPrice - product.price) / product.price;
if (priceDiff > 0.2) throw new Error('Precio cambió demasiado');

// 4. Verificar aliado está aprobado
const partner = await airtable.get(product.partnerId);
if (partner.status !== 'approved') throw new Error('Aliado no activo');

// 5. Registrar venta
await createSale(productId, quantity, amount);
```

---

## 💳 PAGOS & TRANSFERENCIAS

### P: ¿Cómo proceso pagos a aliados?
**R:** Dos opciones:

**Opción 1: Manual (Recomendado inicio)**
```
Admin dashboard → Payouts → Confirmar
↓
Manual transfer (Bancolombia, PSE, etc)
↓
Upload comprobante
↓
Email al aliado con confirmación
```

**Opción 2: Automático (Fase 2)**
```
Integrar Stripe o API bancaria
↓
Procesar automáticamente
↓
Notificar a aliado
```

---

### P: ¿Cuándo pago a los aliados?
**R:** Sugerencia:
- **Mes 1-3:** Manual, acumulado (primer pago mes 2)
- **Mes 4+:** Automático, mensual (entre 1-5 del mes siguiente)

```javascript
// Agregación mensual
const currentMonth = new Date().getMonth() + 1;
const currentYear = new Date().getFullYear();

// Si es 1º del mes
if (new Date().getDate() === 1) {
  // Procesar pagos del mes anterior
  const lastMonth = currentMonth - 1;
  const payouts = await getPayoutsPending(lastMonth, currentYear);
  // Procesar cada payout
}
```

---

### P: ¿Necesito PCI compliance?
**R:** Depende:
- **Stripe/PSE:** Te maneja seguridad → No necesitas PCI
- **Transferencia bancaria:** Solo datos bancarios → Básico
- **Billetera propia:** Sí necesitas → Implementa en Fase 2

**Recomendación:** Usa Stripe o PSE para pagos.

---

## 🎨 FRONTEND

### P: ¿Puedo reutilizar UnifiedPanel del panel admin?
**R:** Sí pero con cambios:

```typescript
// ANTES (Panel Admin)
<UnifiedPanel 
  sections={[
    'dashboard', 'usuarios', 'finanzas', 'servicios'
  ]}
  isAdmin={true}
/>

// DESPUÉS (Panel Socios)
<UnifiedPanel 
  sections={[
    'dashboard', 'productos', 'ventas', 'pagos', 'qr', 'config'
  ]}
  isAdmin={false}
  partnerId={partnerId}
/>
```

---

### P: ¿Cómo manejo token en React?
**R:** Con Context + localStorage:

```typescript
// context/PartnerAuthContext.tsx
const PartnerAuthContext = createContext();

export const PartnerAuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => 
    localStorage.getItem('partnerToken')
  );

  const login = async (email, password) => {
    const res = await fetch('/api/v1/partners/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    const { token } = await res.json();
    setToken(token);
    localStorage.setItem('partnerToken', token);
  };

  return (
    <PartnerAuthContext.Provider value={{ token, login }}>
      {children}
    </PartnerAuthContext.Provider>
  );
};

// En componentes
const { token } = useContext(PartnerAuthContext);
const headers = { 'Authorization': `Bearer ${token}` };
```

---

### P: ¿Cómo valido que usuario tiene permiso?
**R:** En el backend con middleware:

```javascript
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Sin token' });
  
  const decoded = jwt.verify(token, JWT_SECRET);
  req.partnerId = decoded.id;
  next();
};

// Luego en ruta:
router.get('/dashboard', authMiddleware, async (req, res) => {
  // Solo accede si token es válido
  // req.partnerId ya está disponible
});
```

---

## 🧪 TESTING

### P: ¿Cómo testo el backend?
**R:** Con Jest + Supertest:

```javascript
const request = require('supertest');
const app = require('../server');

describe('Auth', () => {
  test('POST /login debe retornar token', async () => {
    const res = await request(app)
      .post('/api/v1/partners/auth/login')
      .send({ email: 'test@email.com', password: 'Pass123!' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });
});

// Correr: npm test
```

---

### P: ¿Qué debería testear?
**R:** Prioridad:

1. **Critical** (Testa primero)
   - Login/Logout
   - Crear producto
   - Registrar venta
   - Calcular comisión

2. **High** (Segundo)
   - Permisos (no puedo ver datos de otro aliado)
   - Validaciones (precio negativo, nombre vacío)
   - Errores (partner no existe, etc)

3. **Medium**
   - Emails enviados
   - Webhooks gatillados
   - QR generado

4. **Low**
   - UI cosmética
   - Renders opcionales

---

### P: ¿Cómo testo integraciones Make.com?
**R:** Mock el webhook:

```javascript
// tests/makeIntegration.test.js
test('Webhook de Make.com actualiza producto', async () => {
  // Simular webhook
  const webhook = {
    productId: 'prod_123',
    guiasaiId: 'gsa_456',
    status: 'success'
  };

  const res = await request(app)
    .post('/api/v1/partners/webhooks/sync-callback')
    .send(webhook);

  expect(res.status).toBe(200);
  
  // Verificar que se actualizó en Airtable
  const product = await getProduct('prod_123');
  expect(product.guiasaiStatus).toBe('synced');
});
```

---

## 🚀 DEPLOYMENT

### P: ¿Dónde depliega el backend?
**R:** Opciones:

| Opción | Precio | Facilidad | Recomendación |
|--------|--------|-----------|---------------|
| **Render** | $7/mes | ⭐⭐⭐⭐⭐ | ✅ MEJOR |
| **Heroku** | $7/mes | ⭐⭐⭐⭐⭐ | ✅ Bueno |
| **AWS** | Variable | ⭐⭐ | Complejo |
| **DigitalOcean** | $5/mes | ⭐⭐⭐ | OK |

**Recomendación:** Render (lo usas ya en guanago.travel)

---

### P: ¿Cómo depliega a Render?
**R:** 

1. Crear `render.yaml` en raíz:
```yaml
services:
  - type: web
    name: guanago-partners
    env: node
    buildCommand: npm ci
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
```

2. Conectar GitHub
3. Push a rama main
4. Render deplega automáticamente

---

### P: ¿Necesito CI/CD?
**R:** No para Fase 1, pero en Fase 2:

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm test
      
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - run: git push origin main:deploy
      # Render auto-deploya
```

---

## 🐛 DEBUGGING

### P: ¿Cómo debugueo sin ver logs?
**R:** Usa Winston logger:

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Usar en código
logger.info('Partner registered', { email, partnerId });
logger.error('Failed to sync', { productId, error });
```

---

### P: ¿Cómo veo qué hace Make.com?
**R:** Setup logging en Make.com:

1. En scenario, agregar acción: **Email → Send an email**
2. O guardar en **Google Sheets** cada ejecución
3. O crear endpoint en backend para logs

```javascript
router.post('/admin/webhook-logs', (req, res) => {
  const logs = fs.readFileSync('webhook-logs.json', 'utf8')
    .split('\n')
    .filter(l => l)
    .map(l => JSON.parse(l))
    .slice(-100); // Últimos 100
    
  res.json(logs);
});
```

---

### P: ¿Cómo sé si JWT está funcionando?
**R:** Test rápido:

```bash
# 1. Obtener token
TOKEN=$(curl -X POST http://localhost:3001/api/v1/partners/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@email.com","password":"Pass123!"}' | jq -r '.token')

# 2. Usar token
curl -X GET http://localhost:3001/api/v1/partners/dashboard \
  -H "Authorization: Bearer $TOKEN"

# Si retorna datos = ✅ funciona
# Si retorna 401 = ❌ error
```

---

## 🎯 PERFORMANCE

### P: ¿Cómo optimizo queries a Airtable?
**R:**

1. **Usa filtros en la query:**
```javascript
// ❌ LENTO - traer todo y filtrar
const all = await base(TABLE).all();
const filtered = all.filter(r => r.fields.partnerId === id);

// ✅ RÁPIDO - filtrar en Airtable
const filtered = await base(TABLE)
  .select({ filterByFormula: `{partnerId} = '${id}'` })
  .all();
```

2. **Cache resultados:**
```javascript
const cache = new Map();

async function getPartner(id) {
  if (cache.has(id)) return cache.get(id);
  
  const partner = await airtable.getPartnerById(id);
  cache.set(id, partner);
  
  // Limpiar cache cada 5 minutos
  setTimeout(() => cache.delete(id), 5 * 60 * 1000);
  
  return partner;
}
```

3. **Batch requests:**
```javascript
// ❌ LENTO - 100 requests
products.forEach(p => await getProduct(p.id));

// ✅ RÁPIDO - 1 request
const productIds = products.map(p => p.id);
const productsData = await getProductsBatch(productIds);
```

---

### P: ¿Rate limiting es necesario?
**R:** Sí, para prevenir abuse:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // 100 requests por ventana
});

app.use('/api/v1/partners', limiter);
```

---

## ❓ EXTRAS

### P: ¿Cómo manejo múltiples idiomas?
**R:** Para MVP (fase 1) solo español. Fase 2:

```javascript
const i18n = require('i18n');

i18n.configure({
  locales: ['es', 'en', 'fr'],
  directory: './locales',
  defaultLocale: 'es'
});

// /locales/es.json
{ "AUTH.EMAIL_REQUIRED": "Email es requerido" }

// En código
res.json({ error: i18n.__('AUTH.EMAIL_REQUIRED') });
```

---

### P: ¿Cómo manejo zona horaria?
**R:** Guarda todo en UTC, convierte al frontend:

```javascript
// Backend - UTC
createdAt: new Date().toISOString()

// Frontend - Convertir a zona horaria local
const date = new Date('2026-01-23T10:30:00Z');
date.toLocaleString('es-CO', { timeZone: 'America/Bogota' });
```

---

### P: ¿Necesito documentación API automática?
**R:** Sí, usa Swagger:

```javascript
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Luego: http://localhost:3001/api-docs
```

---

### P: ¿Qué monitoreo necesito?
**R:** Setup básico:

```
1. Uptime monitoring (Pingdom)
2. Error tracking (Sentry)
3. Performance (New Relic)
4. Logs (Loggly)
5. Alertas (PagerDuty)
```

**Para MVP:** Básico con logs locales. Escala en Fase 2.

---

Esta FAQ cubre 90% de las preguntas que tendrás durante desarrollo.  
**¿Más dudas?** Revisa los documentos principales o pregunta en el equipo.

🚀 **¡A programar!**
