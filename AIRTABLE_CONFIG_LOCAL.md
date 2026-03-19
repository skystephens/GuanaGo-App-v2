# 📊 Configuración de Airtable para Desarrollo Local

## 📋 Índice

1. [Estructura de Bases](#estructura-de-bases)
2. [Tablas Requeridas](#tablas-requeridas)
3. [Campos Detallados](#campos-detallados)
4. [Relaciones entre Tablas](#relaciones-entre-tablas)
5. [Fórmulas y Campos Calculados](#fórmulas-y-campos-calculados)
6. [Configuración de Vistas](#configuración-de-vistas)
7. [Importar Datos de Prueba](#importar-datos-de-prueba)
8. [API Integration](#api-integration)

---

## 🏗️ Estructura de Bases

### Base Actual (Desarrollo)
- **Base ID:** `appiReH55Qhrbv4Lk`
- **API Key:** `patDWx13o3qtNjLqv.37cd343946b889d2044f1f5fa9039c06931d38a192f794c115f0efd21cca1658`

### Tablas Principales
1. **Partners_Aliados** - Información de socios/aliados
2. **PartnerProducts** - Catálogo de productos/servicios
3. **PartnerSales** - Registro de ventas
4. **PartnerPayouts** - Pagos a socios

---

## 📑 Tablas Requeridas

### 1. Partners_Aliados (Socios)

**Campos:**

| Campo | Tipo | Descripción | Requerido |
|-------|------|-------------|-----------|
| `id` | Primary Key | Identificador único (autogenerado) | ✅ |
| `Business_Name` | Single line text | Nombre comercial | ✅ |
| `Contact_Name` | Single line text | Nombre del contacto | ✅ |
| `Email` | Email | Correo electrónico | ✅ |
| `Phone` | Phone number | Teléfono | ✅ |
| `Password_Hash` | Single line text | Hash bcrypt de contraseña | ✅ |
| `Category` | Single select | Alojamiento/Restaurante/Tour/etc | ✅ |
| `Commission_Rate` | Percent | Tasa de comisión (10-25%) | ✅ |
| `Status` | Single select | active/pending/suspended | ✅ |
| `Description` | Long text | Descripción del negocio | ❌ |
| `Address` | Single line text | Dirección | ❌ |
| `City` | Single line text | Ciudad | ❌ |
| `Latitude` | Number | Coordenada GPS | ❌ |
| `Longitude` | Number | Coordenada GPS | ❌ |
| `Website` | URL | Sitio web | ❌ |
| `Logo` | Attachment | Logo del negocio | ❌ |
| `Total_Sales` | Count | Total de ventas (fórmula) | ✅ |
| `Total_Revenue` | Rollup | Ingresos totales | ✅ |
| `Avg_Rating` | Average | Calificación promedio | ✅ |
| `Notifications_JSON` | Single line text | Preferencias JSON | ❌ |
| `Bank_Name` | Single line text | Nombre del banco | ❌ |
| `Account_Number` | Single line text (encriptado) | Número de cuenta | ❌ |
| `Account_Type` | Single select | Ahorros/Corriente | ❌ |
| `Account_Holder` | Single line text | Titular de cuenta | ❌ |
| `Created_At` | Created time | Fecha de creación | ✅ |
| `Updated_At` | Last modified time | Última actualización | ✅ |

---

### 2. PartnerProducts (Productos/Servicios)

**Campos:**

| Campo | Tipo | Descripción | Requerido |
|-------|------|-------------|-----------|
| `id` | Primary Key | Identificador único | ✅ |
| `Partner_ID` | Single line text | FK → Partners_Aliados | ✅ |
| `Product_Name` | Single line text | Nombre del producto | ✅ |
| `Description` | Long text | Descripción detallada | ✅ |
| `Category` | Single select | Tours/Alojamiento/Alimentos | ✅ |
| `Price` | Currency | Precio base | ✅ |
| `Currency` | Single select | COP/USD | ✅ |
| `Status` | Single select | active/paused/pending/rejected | ✅ |
| `Is_Visible` | Checkbox | Visible en catálogo | ✅ |
| `Stock` | Number | Inventario (si aplica) | ❌ |
| `Duration` | Single line text | Duración (ej: "2 horas") | ❌ |
| `Capacity` | Number | Capacidad máxima | ❌ |
| `Amenities` | Multiple select | Lista de amenidades | ❌ |
| `Images` | Attachment | Galería de imágenes | ❌ |
| `Images_URLs` | Single line text | URLs JSON de imágenes | ❌ |
| `Thumbnail` | Single line text | URL de miniatura | ❌ |
| `Rating` | Rating | Calificación 1-5 | ✅ |
| `Review_Count` | Count | Total de reseñas | ✅ |
| `Views_Count` | Number | Vistas del producto | ✅ |
| `Conversion_Rate` | Percent | Tasa de conversión (fórmula) | ✅ |
| `Location_Address` | Single line text | Ubicación | ❌ |
| `Location_Latitude` | Number | Coordenada GPS | ❌ |
| `Location_Longitude` | Number | Coordenada GPS | ❌ |
| `SEO_Title` | Single line text | Meta title | ❌ |
| `SEO_Description` | Single line text | Meta description | ❌ |
| `Tags` | Multiple select | Tags para búsqueda | ❌ |
| `Total_Sales` | Count | Total de ventas | ✅ |
| `Total_Revenue` | Rollup | Ingresos totales (fórmula) | ✅ |
| `Created_At` | Created time | Fecha de creación | ✅ |
| `Updated_At` | Last modified time | Última actualización | ✅ |

---

### 3. PartnerSales (Ventas)

**Campos:**

| Campo | Tipo | Descripción | Requerido |
|-------|------|-------------|-----------|
| `id` | Primary Key | Identificador único | ✅ |
| `Partner_ID` | Single line text | FK → Partners_Aliados | ✅ |
| `Product_ID` | Single line text | FK → PartnerProducts | ✅ |
| `Customer_Name` | Single line text | Nombre del cliente | ✅ |
| `Customer_Email` | Email | Email del cliente | ✅ |
| `Customer_Phone` | Phone number | Teléfono del cliente | ❌ |
| `Sale_Amount` | Currency | Monto de la venta | ✅ |
| `Currency` | Single select | COP/USD | ✅ |
| `Commission_Amount` | Currency | Comisión del socio (fórmula) | ✅ |
| `Commission_Rate` | Percent | % de comisión aplicada | ✅ |
| `Status` | Single select | completed/pending/cancelled/refunded | ✅ |
| `Payment_Method` | Single select | credit_card/paypal/bank_transfer | ✅ |
| `Transaction_ID` | Single line text | ID de transacción | ❌ |
| `Booking_Date` | Date | Fecha del viaje/servicio | ✅ |
| `Sale_Date` | Created time | Fecha de venta | ✅ |
| `Completion_Date` | Date | Fecha de finalización | ❌ |
| `Quantity` | Number | Cantidad de items | ✅ |
| `Notes` | Long text | Notas adicionales | ❌ |
| `Payout_ID` | Single line text | FK → PartnerPayouts | ❌ |
| `Refund_Amount` | Currency | Monto reembolsado (si aplica) | ❌ |
| `Refund_Reason` | Single line text | Razón del reembolso | ❌ |
| `Created_At` | Created time | Fecha de creación | ✅ |
| `Updated_At` | Last modified time | Última actualización | ✅ |

---

### 4. PartnerPayouts (Pagos)

**Campos:**

| Campo | Tipo | Descripción | Requerido |
|-------|------|-------------|-----------|
| `id` | Primary Key | Identificador único | ✅ |
| `Partner_ID` | Single line text | FK → Partners_Aliados | ✅ |
| `Payout_Amount` | Currency | Monto del pago | ✅ |
| `Currency` | Single select | COP/USD | ✅ |
| `Status` | Single select | pending/processing/completed/failed | ✅ |
| `Payout_Date` | Date | Fecha de pago | ✅ |
| `Expected_Date` | Date | Fecha esperada de llegada | ❌ |
| `Completion_Date` | Date | Fecha de confirmación | ❌ |
| `Bank_Name` | Single line text | Banco destino | ✅ |
| `Account_Last_4` | Single line text | Últimos 4 dígitos de cuenta | ✅ |
| `Transaction_Reference` | Single line text | Referencia bancaria | ❌ |
| `Fee_Amount` | Currency | Comisión de plataforma | ✅ |
| `Net_Amount` | Currency | Monto neto (fórmula) | ✅ |
| `Period_Start` | Date | Inicio del período | ✅ |
| `Period_End` | Date | Fin del período | ✅ |
| `Notes` | Long text | Notas | ❌ |
| `Failed_Reason` | Single line text | Razón de fallo (si aplica) | ❌ |
| `Created_At` | Created time | Fecha de creación | ✅ |
| `Updated_At` | Last modified time | Última actualización | ✅ |

---

## 🔗 Relaciones entre Tablas

```
Partners_Aliados (1)
    ├─ PartnerProducts (Many)
    │   └─ PartnerSales (Many)
    │       └─ PartnerPayouts (1)
    │
    └─ PartnerPayouts (Many)

Relaciones:
- Partners_Aliados.id → PartnerProducts.Partner_ID
- Partners_Aliados.id → PartnerSales.Partner_ID
- PartnerProducts.id → PartnerSales.Product_ID
- Partners_Aliados.id → PartnerPayouts.Partner_ID
- PartnerSales.id → PartnerPayouts (indirecta)
```

---

## 🧮 Fórmulas y Campos Calculados

### En PartnerProducts

**Conversion_Rate (Percent):**
```
{Total_Sales} / {Views_Count} * 100
```

**Total_Revenue (Rollup):**
```
SUM(values)  // De PartnerSales.Commission_Amount
```

---

### En PartnerSales

**Commission_Amount (Currency):**
```
{Sale_Amount} * {Commission_Rate} / 100
```

---

### En PartnerPayouts

**Net_Amount (Currency):**
```
{Payout_Amount} - {Fee_Amount}
```

---

## 👁️ Configuración de Vistas

### Vista: Dashboard Stats
**Tabla:** Partners_Aliados
**Campos Visibles:**
- Business_Name
- Status
- Total_Sales
- Total_Revenue
- Avg_Rating
- Commission_Rate

**Filtros:**
- Status ≠ "suspended"

**Ordenamiento:**
- Total_Revenue DESC

---

### Vista: Active Products
**Tabla:** PartnerProducts
**Campos Visibles:**
- Product_Name
- Status
- Price
- Views_Count
- Rating
- Total_Sales

**Filtros:**
- Status = "active"
- Is_Visible = true

**Ordenamiento:**
- Total_Sales DESC

---

### Vista: Recent Sales
**Tabla:** PartnerSales
**Campos Visibles:**
- Customer_Name
- Product_Name
- Sale_Amount
- Commission_Amount
- Status
- Sale_Date

**Filtros:**
- Sale_Date >= TODAY() - 30 days

**Ordenamiento:**
- Sale_Date DESC

---

### Vista: Pending Payouts
**Tabla:** PartnerPayouts
**Campos Visibles:**
- Partner_ID
- Payout_Amount
- Status
- Payout_Date

**Filtros:**
- Status = "pending"

**Ordenamiento:**
- Payout_Date ASC

---

## 📥 Importar Datos de Prueba

### Opción 1: Importar desde CSV

1. Ve a tu Base en Airtable
2. Haz clic en el botón "+" para agregar tabla
3. Selecciona "Import CSV"
4. Descarga los archivos CSV de prueba desde `docs/sample-data/`

**Archivos disponibles:**
- `partners-sample.csv` - 5 socios de prueba
- `products-sample.csv` - 20 productos
- `sales-sample.csv` - 50 ventas recientes
- `payouts-sample.csv` - 10 pagos

---

### Opción 2: Crear Registros Manualmente

#### Crear un Socio Nuevo:

1. Ve a tabla **Partners_Aliados**
2. Haz clic en "+"
3. Completa:
   - Business_Name: "Hotel Paraíso"
   - Contact_Name: "Juan Pérez"
   - Email: "juan@hotelparadiso.com"
   - Phone: "+573001234567"
   - Category: "Alojamiento"
   - Commission_Rate: 12%
   - Status: "active"
4. Guarda

#### Crear un Producto:

1. Ve a tabla **PartnerProducts**
2. Haz clic en "+"
3. Completa:
   - Partner_ID: (selecciona el socio)
   - Product_Name: "Habitación Suite Deluxe"
   - Category: "Alojamiento"
   - Price: 200000
   - Currency: "COP"
   - Status: "active"
   - Is_Visible: ✓
4. Guarda

---

## 🔗 API Integration

### Conectar desde Backend

```javascript
// backend/services/airtableHelper.js

const Airtable = require('airtable');

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY
}).base(process.env.AIRTABLE_BASE_ID);

// Obtener socios
async function getPartners(status = 'active') {
  return await base('Partners_Aliados')
    .select({
      filterByFormula: `{Status} = '${status}'`,
      maxRecords: 100,
      sort: [{ field: 'Total_Revenue', direction: 'desc' }]
    })
    .all();
}

// Crear venta
async function createSale(data) {
  return await base('PartnerSales').create([
    {
      fields: {
        Partner_ID: data.partnerId,
        Product_ID: data.productId,
        Customer_Name: data.customerName,
        Customer_Email: data.customerEmail,
        Sale_Amount: data.amount,
        Currency: 'COP',
        Status: 'completed',
        Booking_Date: data.bookingDate,
        Quantity: 1
      }
    }
  ]);
}

module.exports = {
  getPartners,
  createSale,
  // ... más métodos
};
```

---

### Conectar desde Frontend

```typescript
// frontend/services/partnerService.ts

import axios from 'axios';

const AIRTABLE_API = 'https://api.airtable.com/v0';
const BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID;
const API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY;

async function getPartnerStats(partnerId: string) {
  const response = await axios.get(
    `${AIRTABLE_API}/${BASE_ID}/Partners_Aliados`,
    {
      headers: {
        Authorization: `Bearer ${API_KEY}`
      },
      params: {
        filterByFormula: `{id} = '${partnerId}'`,
        fields: ['Business_Name', 'Total_Sales', 'Total_Revenue', 'Avg_Rating']
      }
    }
  );
  return response.data.records[0];
}

export { getPartnerStats };
```

---

## 🔐 Seguridad

### Protege tus Credenciales

✅ **Nunca compartas:**
- AIRTABLE_API_KEY
- AIRTABLE_BASE_ID
- JWT_SECRET

✅ **Usa variables de entorno:**
- Crea `.env.local` (gitignored)
- Usa `process.env` en backend
- Usa `import.meta.env` en frontend (solo para claves públicas)

✅ **Rol-based Access:**
```javascript
// Backend middleware
function requirePartnerAccess(req, res, next) {
  if (req.user.role !== 'Partner') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (req.user.partnerId !== req.params.partnerId) {
    return res.status(403).json({ error: 'Cannot access other partners data' });
  }
  next();
}
```

---

## ✅ Checklist de Setup

- [ ] Base de Airtable creada
- [ ] Todas 4 tablas creadas
- [ ] Campos configurados correctamente
- [ ] Relaciones establecidas
- [ ] Fórmulas y campos calculados agregados
- [ ] Vistas creadas
- [ ] Datos de prueba importados
- [ ] API Key generada y guardada en `.env.local`
- [ ] Backend puede conectar a Airtable
- [ ] Frontend puede leer datos

---

## 📞 Problemas Comunes

**Error: "Authentication error"**
- Verifica que AIRTABLE_API_KEY sea válido
- Obtén nuevo token en https://airtable.com/account/tokens

**Error: "Base not found"**
- Verifica AIRTABLE_BASE_ID (debe estar en formato `app...`)
- Obtén de la URL: https://airtable.com/app[BASE_ID]

**Campos no aparecen**
- Revisa que los nombres de campos coincidan exactamente
- Verifica los tipos de datos (Single line text vs Email, etc)

---

## 📚 Referencias

- [Airtable API Documentation](https://airtable.com/api)
- [Airtable JavaScript SDK](https://www.npmjs.com/package/airtable)
- [Field Types Guide](https://support.airtable.com/hc/en-us/articles/203255215-Field-types)
- [Fórmulas Reference](https://support.airtable.com/hc/en-us/articles/203255215-Field-types)

---

**Última actualización:** 23 Enero 2026  
**Versión:** 1.0
