# 🗺️ MAPEO AIRTABLE → CÓDIGO
## Referencia rápida de cómo se mapean los campos

---

## 📋 TABLA AIRTABLE: ServiciosTuristicos_SAI

```
AIRTABLE FIELD                 → CODE FIELD              → TIPO    → MOSTRADO EN
─────────────────────────────────────────────────────────────────────────────────

// Campos existentes (sin cambios)
Servicio                       → title                  → string  → Detail header
Descripcion                    → description            → string  → Detail body
Precio                         → price, fallback        → number  → Checkout
Imagenurl                      → image, gallery         → url[]   → Detail, cards
Ubicacion                      → location               → string  → Filter
Publicado                      → active                 → bool    → Filtrado
Rating                         → rating                 → number  → Star review
Reviews                        → reviews                → number  → Review count

// 🆕 NUEVOS CAMPOS PARA ALOJAMIENTOS
Tipo de Alojamiento            → accommodationType      → string  → Detail badge (ámbar)
                                                                      HotelList filter
                               
Politica Bebes                 → babyPolicy             → string  → Detail info box (azul)
                                                                      Información importante
                               
Acepta Bebes                   → allowBabies            → bool    → Mostrar/ocultar
                                                                      selector de bebés
                               
Precio 1 Huesped               → pricePerNight[1]       → number  → Cálculo precio
Precio 2 Huespedes             → pricePerNight[2]       → number  → Cálculo precio
Precio 3 Huespedes             → pricePerNight[3]       → number  → Cálculo precio
Precio 4+ Huespedes            → pricePerNight[4]       → number  → Cálculo precio
                                                                      (fallback para 5+)
                               
Camas Sencillas                → singleBeds             → number  → Filter search
Camas Dobles                   → doubleBeds             → number  → Filter search
                               
Tiene Cocina                   → hasKitchen             → bool    → Filter search
                                                                      Detail amenities
                               
Incluye Desayuno               → includesBreakfast      → bool    → Detail amenities
                                                                      Detail info box
                               
Minimo Noches                  → minNights              → number  → Validación (alert)
                                                                      "Mínimo X noches"
                               
Capacidad Maxima               → maxGuests              → number  → Validación
                                                                      Filter by capacity
                               
Moneda Precios                 → currencyPrice          → string  → Checkout
                                                                      (COP vs USD)
                               
Telefono Contacto              → phoneContact           → string  → Checkout
                                                                      WhatsApp link
                               
Email Contacto                 → emailContact           → string  → Checkout
                                                                      Contact section
```

---

## 🔍 FLUJO DE UN PRECIO

### En Airtable:
```
ServiciosTuristicos_SAI
├── Servicio: "Hotel Sunrise"
├── Tipo de Servicio: "Alojamiento"
├── Tipo de Alojamiento: "Hotel"
├── Precio 1 Huesped: 150000
├── Precio 2 Huespedes: 200000
├── Precio 3 Huespedes: 250000
└── Precio 4+ Huespedes: 300000
```

### En airtableService.ts:
```typescript
pricePerNight: {
  1: 150000,
  2: 200000,
  3: 250000,
  4: 300000
}
```

### En types.ts (Hotel interface):
```typescript
interface Hotel {
  pricePerNight: Record<number, number>  // {1: 150000, 2: 200000, ...}
}
```

### En Detail.tsx (Componente):
```typescript
// Usuario selecciona 2 huéspedes, 3 noches
const totalPrice = pricePerNight[2] * 3  // 200000 * 3 = 600000
```

### En el carrito:
```
Mostrar:
- Hotel Sunrise (2 huéspedes)
- $200,000 × 3 noches = $600,000
```

---

## 📱 INTERFAZ USUARIO

### HotelList (Búsqueda)
```
┌─────────────────────────────┐
│ Alojamientos                │
├─────────────────────────────┤
│ 🔍 BUSCAR ALOJAMIENTO       │
│                             │
│ Entrada: [__________]       │
│ Salida:  [__________]       │
│                             │
│ Huéspedes: [1____]          │
│ Noches: [1____]             │
│                             │
│ Camas sencillas: [0____]    │
│ Camas dobles: [1____]       │
│                             │
│ Cocina: [Sin preferencia ▼] │
│                             │
│ 🆕 Tipo de Alojamiento:     │  ← NUEVO FILTRO
│    [Todos los tipos ▼]      │
│    ├─ Hotel                 │
│    ├─ Posada Nativa         │
│    ├─ Casa                  │
│    └─ ...                   │
│                             │
│ [BUSCAR ALOJAMIENTOS]       │
└─────────────────────────────┘

Resultado: Muestra 3 hoteles
```

### Detail.tsx (Detalles)
```
┌─────────────────────────────────────┐
│ [← Home]   Hotel Sunrise     [↗]   │
├─────────────────────────────────────┤
│ [Imagen grande del hotel]           │
│                                     │
│ ⭐ 4.5 (42 reviews)                │
│                                     │
│ LA EXPERIENCIA                      │
│                                     │
│ 🏨 Tipo: [Hotel] ← NUEVO BADGE     │
│                  (color ámbar)      │
│                                     │
│ 👶 Política: Menores de 4 años      │ ← NUEVO INFO
│    no cuentan como huésped          │
│                                     │
│ Descripción del hotel...            │
│                                     │
│ 📞 +57 8 512 1234                  │
│ 📧 info@hotel.com                   │
│                                     │
├─────────────────────────────────────┤
│ FLOTANTE INFERIOR:                  │
│                                     │
│ [−] 1 [+]        [−] 1 [+]         │
│ Huéspedes         Noches            │
│                   [−] 0 [+]         │ ← NUEVO
│                   Bebés (azul)      │
│                                     │
│ ℹ️ Edades 4+ adulto, bebés 0-3     │ ← NUEVO INFO
│                                     │
│ [AGREGAR AL CARRITO]                │
│ Precio: $600,000                    │
└─────────────────────────────────────┘
```

---

## 💾 ALMACENAMIENTO

### LocalStorage (JSON)
```javascript
// Clave 1: Datos de hoteles (caché)
localStorage.getItem('guanago_hotels_cache_v2')
{
  "data": [
    {
      "id": "rec123...",
      "title": "Hotel Sunrise",
      "accommodationType": "Hotel",
      "allowBabies": true,
      "pricePerNight": {
        "1": 150000,
        "2": 200000,
        "3": 250000,
        "4": 300000
      },
      "babyPolicy": "Menores de 4 años no cuentan como huésped",
      ...
    }
  ],
  "timestamp": 1705507200000,
  "version": "2.0.0",
  "source": "api"
}

// Clave 2: Metadata (estado del caché)
localStorage.getItem('guanago_hotels_metadata')
{
  "lastSync": 1705507200000,
  "lastUpdate": 1705507200000,
  "totalRecords": 12,
  "version": "2.0.0",
  "apiStatus": "online",
  "syncError": null
}
```

---

## 🔄 SINCRONIZACIÓN AIRTABLE ↔️ APP

### 1. Lectura desde Airtable (airtableService.ts)
```typescript
async function getServices(category?: string) {
  const records = await fetchTable(TABLES.SERVICIOS);
  
  return records.map(record => {
    const f = record.fields;  // ← Accede a los campos de Airtable
    
    return {
      // Mapeo de campos
      title: f['Servicio'],                         // ← Lee de Airtable
      accommodationType: f['Tipo de Alojamiento'],  // ← 🆕 NUEVO
      
      pricePerNight: {
        1: parseInt(f['Precio 1 Huesped'] || 0),   // ← 🆕 NUEVO
        2: parseInt(f['Precio 2 Huespedes'] || 0), // ← 🆕 NUEVO
        3: parseInt(f['Precio 3 Huespedes'] || 0), // ← 🆕 NUEVO
        4: parseInt(f['Precio 4+ Huespedes'] || 0) // ← 🆕 NUEVO
      },
      
      allowBabies: f['Acepta Bebes'] === true,     // ← 🆕 NUEVO
      babyPolicy: f['Politica Bebes'] || '',       // ← 🆕 NUEVO
      
      // ... más campos
    };
  });
}
```

### 2. Caché en LocalStorage (hotelCacheService.ts)
```typescript
// Guardar después de leer
const cacheEntry: HotelCacheEntry = {
  data: apiData,  // ← Los hoteles del paso 1
  timestamp: Date.now(),
  version: CACHE_VERSION,
  source: 'api'
};
localStorage.setItem(CACHE_KEY, JSON.stringify(cacheEntry));
```

### 3. Usar en componentes (HotelList.tsx)
```typescript
const result = await hotelCacheService.getHotels();
const hotels = result.data;  // ← Ya está mapeado y en caché

// Filtrar por tipo
const filtered = hotels.filter(h => 
  h.accommodationType === selectedType
);
```

---

## 🎯 CAMPOS POR FUNCIONALIDAD

### Búsqueda
```
✓ Tipo de Alojamiento    (filtro)
✓ Camas Sencillas        (filtro)
✓ Camas Dobles           (filtro)
✓ Tiene Cocina           (filtro)
✓ Capacidad Maxima       (validación)
✓ Minimo Noches          (validación)
```

### Cotización
```
✓ Precio 1 Huesped       (cálculo)
✓ Precio 2 Huespedes     (cálculo)
✓ Precio 3 Huespedes     (cálculo)
✓ Precio 4+ Huespedes    (cálculo)
✓ Moneda Precios         (formato)
```

### Detalles
```
✓ Tipo de Alojamiento    (mostrar badge)
✓ Incluye Desayuno       (mostrar amenity)
✓ Tiene Cocina           (mostrar amenity)
✓ Politica Bebes         (mostrar info)
✓ Acepta Bebes           (mostrar selector)
```

### Contacto
```
✓ Telefono Contacto      (WhatsApp link)
✓ Email Contacto         (contact form)
```

---

## 📊 EJEMPLO COMPLETO

### En Airtable:
```
Servicio:                Posada Bella
Tipo de Servicio:        Alojamiento
Tipo de Alojamiento:     Posada Nativa
Precio 1 Huesped:        100000
Precio 2 Huespedes:      130000
Precio 3 Huespedes:      160000
Precio 4+ Huespedes:     190000
Camas Sencillas:         1
Camas Dobles:            1
Tiene Cocina:            ✓
Incluye Desayuno:        ✓
Minimo Noches:           1
Capacidad Maxima:        4
Politica Bebes:          Máximo 1 bebé por unidad
Acepta Bebes:            ✓
Moneda Precios:          COP
Telefono Contacto:       +57 8 512 5678
Email Contacto:          info@posada.com
```

### En código (después de mapeo):
```typescript
{
  id: "rec...",
  title: "Posada Bella",
  category: "hotel",
  accommodationType: "Posada Nativa",
  pricePerNight: {
    1: 100000,
    2: 130000,
    3: 160000,
    4: 190000
  },
  singleBeds: 1,
  doubleBeds: 1,
  hasKitchen: true,
  includesBreakfast: true,
  minNights: 1,
  maxGuests: 4,
  babyPolicy: "Máximo 1 bebé por unidad",
  allowBabies: true,
  currencyPrice: "COP",
  phoneContact: "+57 8 512 5678",
  emailContact: "info@posada.com"
}
```

### En UI (HotelList):
```
🏠 Posada Bella
Posada Nativa | 4 huéspedes máx
Desde: $100,000/noche
⭐ 4.3 (28 reviews)
[Ver detalles]
```

### En UI (Detail):
```
Posada Bella

[Imagen]

⭐ 4.3 (28 reviews)

LA EXPERIENCIA

🏨 Tipo: Posada Nativa
👶 Política: Máximo 1 bebé por unidad

Descripción: Experiencia auténtica raizal...

SERVICIOS
☕ Incluye desayuno
🍳 Tiene cocina

CONTACTO
📞 +57 8 512 5678
📧 info@posada.com

─────────────────────
[−] 1 [+]  [−] 1 [+]  [−] 0 [+]
Huéspedes  Noches     Bebés

ℹ️ Edades 4+ adulto, bebés 0-3

Precio: $100,000 × 2 huéspedes × 1 noche = $100,000

[AGREGAR AL CARRITO]
```

---

## ✅ VERIFICACIÓN

Para verificar que el mapeo funciona correctamente:

```javascript
// En consola del navegador:

// 1. Ver si hotelCacheService funciona
hotelCacheService.getStats()

// 2. Ver datos en caché
const cache = JSON.parse(localStorage.getItem('guanago_hotels_cache_v2'))
console.log(cache.data[0].accommodationType)  // Debería mostrar "Hotel", "Posada", etc.

// 3. Ver si precio está correctamente mapeado
console.log(cache.data[0].pricePerNight)  // {1: X, 2: Y, 3: Z, 4: W}

// 4. Ver si bebés están en el objeto
console.log(cache.data[0].allowBabies)    // true/false
console.log(cache.data[0].babyPolicy)     // texto de política
```

---

**Última actualización**: 17 Enero 2026  
**Versión**: 2.0  
**Propósito**: Referencia rápida de mapeo Airtable → Código
