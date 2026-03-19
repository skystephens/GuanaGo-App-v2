# 🎯 Guía Completa: Dashboard de Socios GuanaGO

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Componentes Creados](#componentes-creados)
3. [Arquitectura y Flujo de Datos](#arquitectura-y-flujo-de-datos)
4. [Guía de Integración](#guía-de-integración)
5. [Configuración del Backend](#configuración-del-backend)
6. [Casos de Uso](#casos-de-uso)
7. [Personalización](#personalización)
8. [Troubleshooting](#troubleshooting)

---

## 📖 Descripción General

El **Dashboard de Socios** es un sistema completo para que los aliados locales (restaurantes, alojamientos, tours, etc.) gestionen su negocio en la plataforma GuanaGO. Incluye:

✅ **Dashboard Principal** con métricas en tiempo real  
✅ **Gestión de Productos** (crear, editar, pausar, eliminar)  
✅ **Seguimiento de Ventas** y comisiones  
✅ **Panel de Configuración** completo  
✅ **Sistema de Notificaciones** configurable  
✅ **Integración con Airtable** y Make.com  

---

## 🧩 Componentes Creados

### 1. **PartnerDashboard.tsx** (`/pages/PartnerDashboard.tsx`)

**Descripción:** Dashboard principal con métricas y estadísticas del socio.

**Características:**
- 📊 4 tarjetas de estadísticas principales (ingresos, productos, ventas, pagos)
- 📈 Cambios porcentuales con indicadores visuales (TrendingUp/Down)
- ⭐ Calificación promedio y total de reseñas
- 📅 Ventas recientes con estado (completado/pendiente/cancelado)
- 🏆 Top 5 productos con mejor desempeño
- 🔄 Selector de período (semana/mes/año)
- ⚡ Acciones rápidas (crear producto, ver catálogo, reservas, reportes)

**Props:**
```typescript
interface PartnerDashboardProps {
  partnerId: string;
  onBack: () => void;
}
```

**Uso:**
```tsx
import PartnerDashboard from './pages/PartnerDashboard';

<PartnerDashboard 
  partnerId="rec123abc" 
  onBack={() => navigate('/panel')}
/>
```

---

### 2. **PartnerSettings.tsx** (`/pages/PartnerSettings.tsx`)

**Descripción:** Panel de configuración completo con 4 pestañas.

**Pestañas:**

1. **Perfil** 👤
   - Información personal (nombre, email, teléfono)
   - Estadísticas del socio (calificación, ventas totales, estado)
   - Fecha de registro

2. **Negocio** 🏢
   - Nombre del negocio
   - Categoría (Alojamiento, Restaurante, Tour, etc.)
   - Descripción
   - Dirección y ciudad
   - Sitio web

3. **Pagos** 💳
   - Información bancaria (banco, tipo de cuenta, número)
   - Titular de la cuenta
   - Tasa de comisión actual
   - Porcentaje de ganancia por venta

4. **Notificaciones** 🔔
   - Email: Ventas, pagos, reseñas
   - Push: Ventas, pagos, reseñas
   - Toggle switches interactivos

**Props:**
```typescript
interface PartnerSettingsProps {
  partnerId: string;
  onBack: () => void;
}
```

**Uso:**
```tsx
import PartnerSettings from './pages/PartnerSettings';

<PartnerSettings 
  partnerId="rec123abc" 
  onBack={() => navigate('/dashboard')}
/>
```

---

### 3. **partnerService.ts** (`/services/partnerService.ts`)

**Descripción:** Servicio completo para comunicación con la API del backend.

**Métodos Principales:**

#### Autenticación
```typescript
await partnerService.login(email, password)
await partnerService.register(data)
await partnerService.logout()
```

#### Dashboard
```typescript
await partnerService.getDashboardStats(partnerId, period)
await partnerService.getRecentSales(partnerId, limit)
await partnerService.getTopProducts(partnerId, limit)
```

#### Productos
```typescript
await partnerService.getProducts(partnerId, filters)
await partnerService.getProduct(partnerId, productId)
await partnerService.createProduct(partnerId, data)
await partnerService.updateProduct(partnerId, productId, data)
await partnerService.deleteProduct(partnerId, productId)
await partnerService.toggleProductStatus(partnerId, productId)
```

#### Ventas y Pagos
```typescript
await partnerService.getSales(partnerId, filters)
await partnerService.getPayouts(partnerId)
await partnerService.requestPayout(partnerId, amount)
```

#### Perfil
```typescript
await partnerService.getProfile(partnerId)
await partnerService.updateProfile(partnerId, data)
```

#### Utilidades
```typescript
await partnerService.uploadImage(file)
await partnerService.getAnalytics(partnerId, period)
await partnerService.getReviews(partnerId)
await partnerService.respondToReview(partnerId, reviewId, response)
```

---

## 🏗️ Arquitectura y Flujo de Datos

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + TS)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │  Dashboard     │  │   Settings     │  │  Product Mgmt    │  │
│  │  Component     │  │   Component    │  │  (próximamente)  │  │
│  └────────┬───────┘  └────────┬───────┘  └─────────┬────────┘  │
│           │                   │                     │           │
│           └───────────────────┴─────────────────────┘           │
│                               │                                 │
│                    ┌──────────▼──────────┐                      │
│                    │  partnerService.ts  │                      │
│                    │  (API Client)       │                      │
│                    └──────────┬──────────┘                      │
│                               │                                 │
└───────────────────────────────┼─────────────────────────────────┘
                                │ HTTP/HTTPS
                                │ JWT Auth
┌───────────────────────────────▼─────────────────────────────────┐
│                      BACKEND (Node.js + Express)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │  Routes    │─▶│ Controllers  │─▶│  Services / Helpers     │ │
│  └────────────┘  └──────────────┘  └─────────┬───────────────┘ │
│                                               │                 │
│  ┌────────────────────────────────────────────▼───────────────┐ │
│  │               JWT Middleware                                │ │
│  │               Rate Limiting                                 │ │
│  │               Error Handling                                │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
┌───────────────▼──────────┐  ┌───────────────▼────────────┐
│   AIRTABLE DATABASE      │  │   MAKE.COM AUTOMATION      │
├──────────────────────────┤  ├────────────────────────────┤
│ • Partners_Aliados       │  │ • Product Sync             │
│ • PartnerProducts        │  │ • Sales Tracking           │
│ • PartnerSales           │  │ • Email Notifications      │
│ • PartnerPayouts         │  │ • GuiaSAI B2B Integration  │
└──────────────────────────┘  └────────────────────────────┘
```

---

## 🔧 Guía de Integración

### Paso 1: Instalar Dependencias

```bash
cd GuanaGo-App-Enero-main
npm install axios
```

### Paso 2: Configurar Variables de Entorno

Crea o edita `.env`:

```env
# Frontend
VITE_API_URL=http://localhost:3001/api

# Backend (en backend/.env)
AIRTABLE_API_KEY=your_airtable_api_key
AIRTABLE_BASE_ID=your_base_id
JWT_SECRET=your_super_secure_secret_key_here
JWT_EXPIRATION=30d
PORT=3001
NODE_ENV=development
```

### Paso 3: Actualizar App.tsx

```tsx
import PartnerDashboard from './pages/PartnerDashboard';
import PartnerSettings from './pages/PartnerSettings';
import { AppRoute } from './types';

// Dentro de tu enrutador:
{currentRoute === AppRoute.PARTNER_DASHBOARD && (
  <PartnerDashboard 
    partnerId={currentPartnerId} 
    onBack={() => setCurrentRoute(AppRoute.HOME)}
  />
)}

{currentRoute === AppRoute.PARTNER_SETTINGS && (
  <PartnerSettings 
    partnerId={currentPartnerId} 
    onBack={() => setCurrentRoute(AppRoute.PARTNER_DASHBOARD)}
  />
)}
```

### Paso 4: Agregar Rutas a types.ts

```typescript
export enum AppRoute {
  // ... rutas existentes
  PARTNER_DASHBOARD = 'partner-dashboard',
  PARTNER_SETTINGS = 'partner-settings',
  PARTNER_PRODUCTS = 'partner-products',
  PARTNER_SALES = 'partner-sales',
  PARTNER_PAYOUTS = 'partner-payouts',
}
```

### Paso 5: Actualizar UnifiedPanel.tsx

Agregar opciones al menú de socios:

```tsx
const partnerMenu: MenuItem[] = [
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    icon: <BarChart3 size={24} />, 
    route: AppRoute.PARTNER_DASHBOARD, 
    description: 'Resumen de tu negocio', 
    color: 'from-blue-500 to-blue-600' 
  },
  { 
    id: 'settings', 
    label: 'Configuración', 
    icon: <Settings size={24} />, 
    route: AppRoute.PARTNER_SETTINGS, 
    description: 'Perfil y preferencias', 
    color: 'from-purple-500 to-purple-600' 
  },
  // ... más opciones
];
```

---

## ⚙️ Configuración del Backend

### Estructura de Carpetas

```
backend/
├── routes/
│   └── partnerRoutes.js          # Rutas de la API
├── controllers/
│   └── partnerController.js      # Lógica de controladores
├── services/
│   └── partnerService.js         # Lógica de negocio
├── middleware/
│   ├── auth.js                   # JWT middleware
│   └── rateLimiter.js            # Rate limiting
├── utils/
│   ├── airtableHelper.js         # Helper de Airtable
│   └── emailService.js           # Servicio de email
└── config.js                     # Configuración general
```

### Ejemplo: partnerRoutes.js

```javascript
const express = require('express');
const router = express.Router();
const partnerController = require('../controllers/partnerController');
const { authenticate } = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimiter');

// Autenticación
router.post('/partners/login', rateLimiter, partnerController.login);
router.post('/partners/register', rateLimiter, partnerController.register);

// Dashboard (protegido)
router.get('/partners/:partnerId/dashboard/stats', 
  authenticate, 
  partnerController.getDashboardStats
);

router.get('/partners/:partnerId/sales/recent', 
  authenticate, 
  partnerController.getRecentSales
);

router.get('/partners/:partnerId/products/top', 
  authenticate, 
  partnerController.getTopProducts
);

// Productos
router.get('/partners/:partnerId/products', 
  authenticate, 
  partnerController.getProducts
);

router.post('/partners/:partnerId/products', 
  authenticate, 
  partnerController.createProduct
);

router.put('/partners/:partnerId/products/:productId', 
  authenticate, 
  partnerController.updateProduct
);

router.delete('/partners/:partnerId/products/:productId', 
  authenticate, 
  partnerController.deleteProduct
);

// Perfil
router.get('/partners/:partnerId', 
  authenticate, 
  partnerController.getProfile
);

router.put('/partners/:partnerId', 
  authenticate, 
  partnerController.updateProfile
);

module.exports = router;
```

### Ejemplo: partnerController.js

```javascript
const partnerService = require('../services/partnerService');

exports.getDashboardStats = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { period = 'month' } = req.query;
    
    // Verificar autorización
    if (req.user.partnerId !== partnerId) {
      return res.status(403).json({ 
        success: false, 
        message: 'No autorizado' 
      });
    }
    
    const stats = await partnerService.calculateDashboardStats(partnerId, period);
    
    res.json(stats);
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

exports.getRecentSales = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { limit = 10 } = req.query;
    
    if (req.user.partnerId !== partnerId) {
      return res.status(403).json({ 
        success: false, 
        message: 'No autorizado' 
      });
    }
    
    const sales = await partnerService.getRecentSales(partnerId, parseInt(limit));
    
    res.json(sales);
  } catch (error) {
    console.error('Error in getRecentSales:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// ... más controladores
```

---

## 💡 Casos de Uso

### 1. Socio Visualiza Dashboard

```typescript
// Usuario navega al dashboard
const Dashboard = () => {
  const partnerId = useAuth().partnerId;
  
  return (
    <PartnerDashboard 
      partnerId={partnerId}
      onBack={() => navigate('/panel')}
    />
  );
};
```

**Flujo:**
1. Usuario autenticado navega a dashboard
2. Componente carga 3 endpoints en paralelo:
   - `/partners/{id}/dashboard/stats?period=month`
   - `/partners/{id}/sales/recent?limit=10`
   - `/partners/{id}/products/top?limit=5`
3. Datos se renderizan con animaciones
4. Usuario puede cambiar período (week/month/year)

---

### 2. Socio Actualiza Perfil

```typescript
// Usuario edita configuración
const handleSave = async () => {
  await partnerService.updateProfile(partnerId, {
    contactName: 'Juan Pérez',
    phone: '+573001234567',
    businessName: 'Hotel Paraíso',
    category: 'Alojamiento',
    location: {
      address: 'Calle 5 #10-20',
      city: 'San Andrés'
    }
  });
};
```

**Flujo:**
1. Usuario hace clic en "Editar"
2. Formulario se habilita
3. Usuario modifica campos
4. Click en "Guardar"
5. PUT `/partners/{id}` con datos actualizados
6. Airtable actualiza registro
7. Notificación de éxito

---

### 3. Socio Configura Notificaciones

```typescript
// Toggle de notificaciones
const handleNotificationToggle = (key: string) => {
  const updatedNotifications = {
    ...formData.notifications,
    [key]: !formData.notifications[key]
  };
  
  await partnerService.updateProfile(partnerId, {
    notifications: updatedNotifications
  });
};
```

**Flujo:**
1. Usuario va a pestaña "Notificaciones"
2. Toggle switches para email y push
3. Cambio se guarda automáticamente
4. Backend actualiza campo `Notifications_JSON` en Airtable

---

## 🎨 Personalización

### Cambiar Colores del Dashboard

```tsx
// En PartnerDashboard.tsx, líneas 180-230
<div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl p-6">
  {/* Cambiar blue-500 por tu color preferido */}
</div>
```

### Agregar Nueva Métrica

```tsx
// 1. Actualizar interface en partnerService.ts
export interface PartnerStats {
  // ... stats existentes
  totalViews: number; // ⬅️ Nueva métrica
}

// 2. Agregar card en PartnerDashboard.tsx
<div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/30 rounded-xl p-6">
  <div className="p-3 bg-cyan-500/20 rounded-lg">
    <Eye size={24} className="text-cyan-400" />
  </div>
  <h3 className="text-gray-400 text-sm mb-1">Vistas Totales</h3>
  <p className="text-3xl font-black text-white">
    {stats?.totalViews || 0}
  </p>
</div>

// 3. Calcular en backend (partnerService.js)
const totalViews = await airtable.getRecords('PartnerProducts', {
  filterByFormula: `{Partner_ID} = '${partnerId}'`,
  fields: ['Views']
}).then(records => 
  records.reduce((sum, r) => sum + (r.fields.Views || 0), 0)
);
```

### Personalizar Período de Tiempo

```tsx
// Agregar opción "Hoy" al selector
<button
  onClick={() => setSelectedPeriod('today')}
  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
    selectedPeriod === 'today'
      ? 'bg-blue-500 text-white'
      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
  }`}
>
  Hoy
</button>

// Actualizar servicio para soportar "today"
async getDashboardStats(partnerId: string, period: 'today' | 'week' | 'month' | 'year' = 'month')
```

---

## 🐛 Troubleshooting

### Error: "No autorizado" al cargar dashboard

**Causa:** Token JWT inválido o expirado

**Solución:**
```typescript
// Verificar que el token existe
const token = localStorage.getItem('partner_token');
if (!token) {
  // Redirigir a login
  navigate('/login');
}

// Si existe pero da error, hacer logout y login nuevamente
await partnerService.logout();
navigate('/login');
```

---

### Error: "Cannot read property 'monthlyRevenue' of null"

**Causa:** `stats` es `null` antes de cargar

**Solución:**
```tsx
// Agregar validación condicional
<p className="text-3xl font-black text-white">
  {stats ? formatCurrency(stats.monthlyRevenue) : '$0'}
</p>

// O mostrar loading state
{loading && <LoadingSpinner />}
```

---

### Las ventas recientes no aparecen

**Causa:** Filtro de Airtable incorrecto o sin registros

**Solución:**
```javascript
// En backend/services/partnerService.js
const salesRecords = await airtable.select('PartnerSales', {
  filterByFormula: `AND({Partner_ID} = '${partnerId}', {Status} != 'cancelled')`,
  sort: [{ field: 'Sale_Date', direction: 'desc' }],
  maxRecords: limit
});

// Validar que hay registros
if (!salesRecords || salesRecords.length === 0) {
  return [];
}
```

---

### Imágenes no se suben correctamente

**Causa:** CORS o falta configuración de multipart/form-data

**Solución:**
```javascript
// Backend: Configurar multer
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post('/partners/upload', 
  authenticate, 
  upload.single('image'),
  partnerController.uploadImage
);

// Frontend: Usar FormData correctamente
const formData = new FormData();
formData.append('image', file);

const response = await axios.post(
  `${API_BASE_URL}/partners/upload`,
  formData,
  {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  }
);
```

---

### Rate limiting bloqueando requests

**Causa:** Demasiadas peticiones en poco tiempo

**Solución:**
```javascript
// Ajustar límites en backend/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // 200 requests (aumentado desde 100)
  message: 'Demasiadas peticiones, intenta más tarde',
});
```

---

## 📊 Métricas Clave

El dashboard calcula y muestra:

| Métrica | Descripción | Cálculo |
|---------|-------------|---------|
| **Ingresos del Mes** | Total facturado este mes | `SUM(PartnerSales.Total_Amount WHERE Month = current)` |
| **% Cambio Ingresos** | Comparación con mes anterior | `((Current - Previous) / Previous) * 100` |
| **Productos Activos** | Productos publicados y visibles | `COUNT(PartnerProducts WHERE Status = 'active')` |
| **Ventas del Mes** | Número de transacciones | `COUNT(PartnerSales WHERE Month = current)` |
| **Pago Pendiente** | Comisión acumulada sin pagar | `SUM(PartnerPayouts WHERE Status = 'pending')` |
| **Calificación** | Promedio de reseñas | `AVG(PartnerProducts.Rating)` |
| **Tasa de Conversión** | % de vistas que generan ventas | `(Sales / Views) * 100` |

---

## 🚀 Próximos Pasos

1. **Gestión de Productos:** Crear componente `PartnerProducts.tsx` para CRUD completo
2. **Calendario de Reservas:** Integrar con Airtable `Bookings`
3. **Chat en Vivo:** Soporte directo entre socio y admin
4. **Reportes PDF:** Generar reportes descargables
5. **Notificaciones Push:** Implementar Web Push API
6. **Analytics Avanzados:** Gráficos con Chart.js o Recharts

---

## 📞 Soporte

Si encuentras problemas o necesitas ayuda:

1. Revisa esta documentación
2. Consulta `BACKEND_SOCIOS_ARQUITECTURA.md`
3. Revisa `FAQ_TECNICO_BACKEND_SOCIOS.md`
4. Contacta al equipo técnico de GuanaGO

---

## ✅ Checklist de Implementación

- [ ] Instalar dependencias (`axios`)
- [ ] Configurar variables de entorno (`.env`)
- [ ] Crear tablas en Airtable (ver `BACKEND_SOCIOS_ARQUITECTURA.md`)
- [ ] Implementar backend (rutas, controllers, services)
- [ ] Configurar JWT authentication
- [ ] Agregar componentes al proyecto React
- [ ] Actualizar `App.tsx` con rutas
- [ ] Actualizar `types.ts` con enums
- [ ] Actualizar `UnifiedPanel.tsx` con menú de socios
- [ ] Probar login y dashboard
- [ ] Probar edición de perfil
- [ ] Probar configuración de notificaciones
- [ ] Validar integración con Airtable
- [ ] Configurar Make.com webhooks (opcional)
- [ ] Deploy a producción

---

## 📄 Licencia

© 2026 GuanaGO. Todos los derechos reservados.
