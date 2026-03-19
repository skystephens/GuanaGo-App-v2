# 🔗 Integración GuiaSAI B2B + Make.com - Backend Socios

> Cómo conectar el panel de socios con GuiaSAI B2B para nutrir automáticamente el portafolio  
> Fecha: Enero 23, 2026

---

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Flujo de Datos](#flujo-de-datos)
3. [Configuración Make.com](#configuración-makecom)
4. [Webhooks](#webhooks)
5. [Mappeo de Campos](#mappeo-de-campos)
6. [Casos de Uso](#casos-de-uso)
7. [Monitoreo & Debugging](#monitoreo--debugging)

---

## Visión General

```
┌──────────────────────────────────────────────────────────────────┐
│                     FLUJO COMPLETO                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PASO 1: Aliado crea producto en Panel Socios                   │
│          ├─ Nombre, descripción, precio                         │
│          ├─ Imágenes                                            │
│          └─ Categoría (tour/alojamiento/servicio)               │
│                    │                                             │
│                    ▼                                             │
│  PASO 2: Backend guarda en Airtable (PartnerProducts)          │
│          ├─ Genera Product ID único                            │
│          ├─ Status = "pending"                                 │
│          └─ Webhook gatillado                                  │
│                    │                                             │
│                    ▼                                             │
│  PASO 3: Make.com recibe webhook                               │
│          ├─ Enriquece datos                                    │
│          ├─ Valida información                                 │
│          ├─ Genera SKU único                                   │
│          └─ Mapea a formato GuiaSAI                            │
│                    │                                             │
│                    ▼                                             │
│  PASO 4: Make.com actualiza GuiaSAI B2B API                    │
│          ├─ POST /products (crear)                            │
│          ├─ PATCH /products/:id (actualizar)                  │
│          └─ Genera landing page                                │
│                    │                                             │
│                    ▼                                             │
│  PASO 5: Make.com confirma en Backend Socios                   │
│          ├─ Actualiza guiasaiId                                │
│          ├─ Status = "published"                               │
│          └─ Envía email al aliado                              │
│                    │                                             │
│                    ▼                                             │
│  PASO 6: Aliado ve el producto publicado en Panel              │
│          └─ Link a GuiaSAI B2B                                 │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Flujo de Datos

### 1. Creación de Producto

```javascript
// POST /api/v1/partners/products
// Request from Frontend
{
  "name": "Tour Snorkel Completo",
  "type": "tour",
  "description": "Experiencia de 3 horas incluye snorkel, comida, traslados",
  "price": 150000,
  "category": "acuático",
  "stock": 20,
  "images": [
    "https://s3.amazonaws.com/guanago/img1.jpg",
    "https://s3.amazonaws.com/guanago/img2.jpg"
  ]
}

// Backend Response
{
  "success": true,
  "product": {
    "id": "prod_abc123xyz",
    "partnerId": "par_001",
    "name": "Tour Snorkel Completo",
    "status": "pending",
    "guiasaiStatus": "pending_sync",
    "createdAt": "2026-01-23T10:30:00Z"
  }
}
```

### 2. Webhook a Make.com

```json
{
  "event": "product.created",
  "timestamp": "2026-01-23T10:30:00Z",
  "product": {
    "id": "prod_abc123xyz",
    "partnerId": "par_001",
    "partnerName": "Restaurant El Mangle",
    "partnerEmail": "contacto@elmangle.com",
    "name": "Tour Snorkel Completo",
    "type": "tour",
    "description": "Experiencia de 3 horas...",
    "price": 150000,
    "category": "acuático",
    "images": ["url1", "url2"],
    "location": {
      "latitude": 12.5849,
      "longitude": -81.7338,
      "businessName": "Restaurant El Mangle"
    }
  }
}
```

### 3. Make.com Procesa

```
Make Scenario: "GuanaGO Socios → GuiaSAI B2B Sync"

┌─ Trigger: HTTP webhook (listen on port)
│  └─ URL: https://hook.make.com/xxxxxxxx
│
├─ Filter: Check product data
│  ├─ name != empty
│  ├─ price > 0
│  └─ images.length > 0
│
├─ Action 1: Enrich product data
│  ├─ Add partner details
│  ├─ Add GPS location
│  ├─ Add timestamps
│  └─ Generate SKU: "GUANA-<type>-<id>"
│
├─ Action 2: Call GuiaSAI API
│  ├─ POST https://guiasai.com/api/v1/products
│  ├─ Headers: Authorization Bearer <token>
│  └─ Response: guiasai_id, landing_url
│
├─ Action 3: Update Airtable (PartnerProducts)
│  ├─ Record ID: product.airtableId
│  ├─ Updates:
│  │  ├─ guiasaiId
│  │  ├─ guiasaiStatus = "synced"
│  │  ├─ guiasaiUrl
│  │  └─ syncedAt
│  └─ Record: Updated
│
├─ Action 4: HTTP response to Backend
│  ├─ POST https://backend.guanago.travel/api/v1/partners/sync-callback
│  └─ Payload: { productId, guiasaiId, status: "success" }
│
└─ Action 5: Send email notification
   ├─ To: partner.email
   ├─ Subject: "✅ Producto publicado en GuiaSAI"
   └─ Link to GuiaSAI
```

---

## Configuración Make.com

### Paso 1: Crear Webhook

1. En Make.com, crear **New Scenario**
2. Seleccionar trigger: **HTTP → Webhooks → Watch custom event**
3. Nombre: `guanago_products_webhook`
4. Copiar URL: `https://hook.make.com/xxxxxxxx`

### Paso 2: Configurar Variables de Entorno

```env
# Agregar a backend/.env
MAKE_WEBHOOK_URL=https://hook.make.com/xxxxxxxx
MAKE_GUIASAI_API_KEY=your_guiasai_api_key
GUIASAI_API_BASE_URL=https://guiasai.com/api/v1

# Webhook de retorno (para confirmación)
WEBHOOK_RETURN_URL=https://backend.guanago.travel/api/v1/partners/webhooks/sync-callback
```

### Paso 3: Setup Google Sheets (opcional, para logging)

En Make.com, agregar acción de Google Sheets para loguear cada producto sincronizado:

```
Columns:
- Timestamp
- Partner Email
- Product Name
- Status (success/failed)
- GuiaSAI ID
- Error Message (si aplica)
```

---

## Webhooks

### Webhook 1: POST /api/v1/partners/products/webhook-create

**Gatillador:** Cuando se crea un producto en Airtable

```javascript
// backend/partners/routes/webhooks.js

const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/product-create', async (req, res) => {
  try {
    const { productId, partnerId, name, price, images } = req.body;

    // Validar datos
    if (!productId || !name || !price) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    // Preparar payload para Make.com
    const payload = {
      event: 'product.created',
      timestamp: new Date().toISOString(),
      product: req.body
    };

    // Enviar a Make.com
    const response = await axios.post(
      process.env.MAKE_WEBHOOK_URL,
      payload,
      { timeout: 10000 }
    );

    res.json({
      success: true,
      makeRequestId: response.data.requestId
    });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: err.message });
  }
});
```

### Webhook 2: POST /api/v1/partners/webhooks/sync-callback

**Gatillador:** Make.com confirma sincronización con GuiaSAI

```javascript
router.post('/sync-callback', async (req, res) => {
  try {
    const { productId, guiasaiId, status, guiasaiUrl, error } = req.body;

    // Obtener producto en Airtable
    const products = await airtableService.getProductById(productId);

    if (!products) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Actualizar estado
    const updates = {
      guiasaiId: guiasaiId,
      guiasaiUrl: guiasaiUrl,
      guiasaiStatus: status === 'success' ? 'synced' : 'error',
      syncedAt: new Date().toISOString()
    };

    if (status === 'error') {
      updates.syncErrorMessage = error;
    }

    // Si fue exitoso, cambiar status del producto
    if (status === 'success') {
      updates.status = 'published';
    }

    await airtableService.updateProduct(productId, updates);

    // Enviar email al partner (opcional)
    if (status === 'success') {
      const emailService = require('../services/emailService');
      // await emailService.sendProductPublishedEmail(...)
    }

    res.json({
      success: true,
      message: 'Sincronización confirmada'
    });
  } catch (err) {
    console.error('Sync callback error:', err);
    res.status(500).json({ error: err.message });
  }
});
```

### Webhook 3: POST /api/v1/partners/webhooks/make-error

**Gatillador:** Make.com reporta error

```javascript
router.post('/make-error', async (req, res) => {
  try {
    const { productId, errorCode, errorMessage, makeRequestId } = req.body;

    console.error(`Make.com Error - Product ${productId}: ${errorMessage}`);

    // Loguear en Google Sheets para debugging
    // Enviar alert a admin
    // Actualizar status en Airtable

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

---

## Mappeo de Campos

### De Panel Socios → Airtable

| Frontend | Backend | Airtable |
|----------|---------|----------|
| name | name | name |
| description | description | description |
| price (COP) | price | price |
| category | category | category |
| images | images[] | images (archivo) |
| stock | stock | stock |
| - | partnerId | partnerId |
| - | id (generado) | id |
| - | createdAt | createdAt |

### De Airtable → Make.com

| Airtable | Make.com | GuiaSAI |
|----------|----------|---------|
| name | productName | name |
| description | description | description |
| price | price | priceInCOP |
| category | category | productCategory |
| images | imageUrls[] | images |
| partnerId | partnerName | provider |
| location (GPS) | coordinates | location |
| - | sku (generado) | sku |
| - | timestamp | publishedAt |

### De Make.com → GuiaSAI B2B

```javascript
// Transformación en Make.com
{
  // GuiaSAI esperaría estos campos
  "name": "Tour Snorkel",
  "description": "Snorkel de 3 horas",
  "type": "tour",
  "category": "acuático",
  "price": 150000,
  "currency": "COP",
  "provider": "Restaurant El Mangle",
  "providerEmail": "contacto@elmangle.com",
  "location": {
    "lat": 12.5849,
    "lon": -81.7338,
    "name": "San Andrés"
  },
  "images": [
    "https://s3.amazonaws.com/img1.jpg",
    "https://s3.amazonaws.com/img2.jpg"
  ],
  "sku": "GUANA-tour-prod_abc123",
  "duration": "3 horas",
  "capacity": 8,
  "tags": ["snorkel", "acuático", "tour"]
}
```

---

## Casos de Uso

### Caso 1: Crear Nuevo Producto

```sequence
Partner → Panel: Click "Agregar Producto"
Panel → Backend: POST /products
Backend → Airtable: Crear PartnerProduct (status=pending)
Backend → Make.com: Webhook POST
Make.com → GuiaSAI: POST /products
GuiaSAI → Make.com: Response {guiasaiId}
Make.com → Backend: POST /webhooks/sync-callback
Backend → Airtable: Update status=published + guiasaiId
Backend → Email: "Producto publicado"
Email → Partner: Notificación + link
```

### Caso 2: Editar Producto Existente

```sequence
Partner → Panel: Click "Editar"
Panel → Backend: PATCH /products/:id
Backend → Airtable: Update PartnerProduct
Backend → Airtable: Check si ya está en GuiaSAI
If (guiasaiId exists):
  Backend → Make.com: Webhook PATCH
  Make.com → GuiaSAI: PATCH /products/:guiasaiId
  GuiaSAI → Make.com: OK
  Make.com → Backend: Sync callback
  Backend → Partner: "Cambios sincronizados"
Else:
  Backend → Make.com: Webhook POST (nuevo)
```

### Caso 3: Validación de Datos

```javascript
// En Make.com, agregar filtro
if (product.name === '' || product.name.length < 3) {
  throw new Error('Nombre muy corto');
}

if (product.price <= 0) {
  throw new Error('Precio debe ser mayor a 0');
}

if (!product.images || product.images.length === 0) {
  throw new Error('Mínimo 1 imagen requerida');
}

if (product.description.length < 20) {
  throw new Error('Descripción muy corta');
}
```

---

## Monitoreo & Debugging

### 1. Logs en Backend

**Archivo: `backend/partners/utils/logger.js`**

```javascript
const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };

    // Console
    console.log(`[${timestamp}] [${level}] ${message}`, data);

    // File
    const logFile = path.join(
      this.logDir,
      `${level.toLowerCase()}-${new Date().toISOString().split('T')[0]}.log`
    );

    fs.appendFileSync(
      logFile,
      JSON.stringify(logEntry) + '\n'
    );
  }

  info(message, data) {
    this.log('INFO', message, data);
  }

  error(message, data) {
    this.log('ERROR', message, data);
  }

  webhook(message, payload) {
    this.log('WEBHOOK', message, { payload });
  }

  sync(message, productId, status) {
    this.log('SYNC', message, { productId, status });
  }
}

module.exports = new Logger();
```

### 2. Endpoint de Debug

```javascript
// GET /api/v1/partners/admin/webhook-logs
router.get('/admin/webhook-logs', async (req, res) => {
  try {
    const logFile = path.join(__dirname, '../../logs/webhook.log');
    const logs = fs
      .readFileSync(logFile, 'utf8')
      .split('\n')
      .filter(l => l)
      .map(l => JSON.parse(l))
      .reverse()
      .slice(0, 100); // Últimas 100

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

### 3. Make.com - Test Webhook

```bash
# Desde terminal, probar webhook
curl -X POST https://hook.make.com/xxxxxxxx \
  -H "Content-Type: application/json" \
  -d '{
    "event": "product.created",
    "productId": "test_123",
    "name": "Test Product",
    "price": 50000
  }'
```

### 4. Dashboard de Monitoreo

```html
<!-- dashboard/webhook-monitor.html -->
<div class="webhook-monitor">
  <h2>Monitor de Sincronización</h2>
  
  <table>
    <thead>
      <tr>
        <th>Producto</th>
        <th>Partner</th>
        <th>Status</th>
        <th>GuiaSAI ID</th>
        <th>Fecha</th>
        <th>Acciones</th>
      </tr>
    </thead>
    <tbody id="logs"></tbody>
  </table>
</div>

<script>
fetch('/api/v1/partners/admin/webhook-logs')
  .then(r => r.json())
  .then(logs => {
    const tbody = document.getElementById('logs');
    logs.forEach(log => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${log.data.product?.name}</td>
        <td>${log.data.product?.partnerName}</td>
        <td><span class="badge ${log.data.status}">${log.data.status}</span></td>
        <td>${log.data.guiasaiId || '-'}</td>
        <td>${new Date(log.timestamp).toLocaleString()}</td>
        <td><button onclick="retrySync('${log.data.productId}')">Reintentar</button></td>
      `;
      tbody.appendChild(tr);
    });
  });
</script>
```

---

## 🔄 Retry Logic (En caso de fallo)

```javascript
// backend/partners/services/retryService.js

class RetryService {
  static async retryProductSync(productId, maxRetries = 3) {
    let retries = 0;

    while (retries < maxRetries) {
      try {
        const product = await airtableService.getProductById(productId);

        // Reenviar a Make.com
        await axios.post(process.env.MAKE_WEBHOOK_URL, {
          event: 'product.retry',
          product
        });

        logger.sync('Reintento exitoso', productId, 'success');
        return { success: true };

      } catch (err) {
        retries++;
        logger.error(`Reintento ${retries} fallido`, { productId, error: err.message });

        // Esperar 5 segundos antes de reintentar
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    logger.error('Falló después de ' + maxRetries + ' intentos', { productId });
    throw new Error('Máximo de reintentos alcanzado');
  }
}
```

---

## ✅ Checklist de Integración

### Configuración Make.com
- [ ] Crear webhook HTTP
- [ ] Copiar URL del webhook
- [ ] Setup acceso GuiaSAI API (token)
- [ ] Setup acceso Airtable (token)
- [ ] Test webhook manualmente

### Backend
- [ ] Instalar axios
- [ ] Crear endpoints `/webhooks/*`
- [ ] Implementar logger
- [ ] Setup retry logic
- [ ] Agregar manejo de errores

### Airtable
- [ ] Crear campos guiasaiId, guiasaiStatus, syncedAt
- [ ] Setup vistas de "Pendientes Sincronización"
- [ ] Setup automaciones (opcional)

### Testing
- [ ] Test crear producto
- [ ] Test webhook gatillado
- [ ] Test Make.com procesa
- [ ] Test GuiaSAI recibe datos
- [ ] Test callback confirma
- [ ] Test email enviado

### Documentación
- [ ] Documentar flujos en Notion
- [ ] Guía troubleshooting para partner
- [ ] Guía admin para monitoreo

---

## 🚀 Deployment

```bash
# 1. Actualizar .env
MAKE_WEBHOOK_URL=https://hook.make.com/production
GUIASAI_API_BASE_URL=https://guiasai.com/api/v1

# 2. Verificar logs
pm2 logs guanago-partners-backend

# 3. Monitorear webhooks
curl https://backend.guanago.travel/api/v1/partners/admin/webhook-logs

# 4. Setup alertas (opcional)
# Configurar Sentry o similar para errores
```

---

**Próximo paso:** Comenzar con setup Make.com y testing del primer webhook 🚀
