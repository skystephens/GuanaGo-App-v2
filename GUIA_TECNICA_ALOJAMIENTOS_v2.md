# 🔧 GUÍA TÉCNICA: Sistema de Alojamientos v2.0
## Integración de Airtable + Caché Offline + Cotización Automática

---

## 📋 ÍNDICE
1. [Estructura de Datos](#estructura-de-datos)
2. [Campos Airtable](#campos-airtable)
3. [Servicios Implementados](#servicios-implementados)
4. [Flujo de Datos](#flujo-de-datos)
5. [Testing Local](#testing-local)
6. [Deployment](#deployment)

---

## 🏗️ Estructura de Datos

### 1. Interface Hotel (types.ts)
```typescript
export interface Hotel extends Tour {
  // Campos base
  address: string;
  amenities: string[];
  maxGuests: number;
  
  // 🆕 Precios por cantidad
  pricePerNight: Record<number, number>;  // {1: 150000, 2: 200000, ...}
  
  // 🆕 Tipo de alojamiento
  accommodationType: 'Hotel' | 'Aparta Hotel' | 'Apartamentos' | 'Casa' | 
                   'Habitacion' | 'Hostal' | 'Posada Nativa' | 'Hotel boutique';
  
  // 🆕 Política de bebés
  allowBabies: boolean;
  babyPolicy: string;
  
  // 🆕 Detalles de camas
  singleBeds: number;
  doubleBeds: number;
  hasKitchen: boolean;
  includesBreakfast: boolean;
  minNights: number;
  
  // 🆕 Multi-moneda
  currencyPrice: string; // 'COP' | 'USD'
  
  // 🆕 Contacto
  phoneContact: string;
  emailContact: string;
}
```

---

## 📊 Campos Airtable

### TABLA: ServiciosTuristicos_SAI

#### Campos Existentes (No modificar)
| Campo | Tipo | Ejemplo |
|-------|------|---------|
| Servicio | Text | "Hotel Sunrise Beach" |
| Tipo de Servicio | Select | "Alojamiento" |
| Descripcion | Long Text | "Hermoso hotel frente al mar..." |
| Precio | Number | 180000 |
| Ubicacion | Select | "San Andrés" |
| Imagenurl | Attachment | [imagen] |
| Publicado | Checkbox | ✓ |
| Rating | Number | 4.5 |
| Reviews | Number | 42 |

#### 🆕 Campos NUEVOS A AGREGAR

1. **Tipo de Alojamiento**
```
Nombre Airtable: Tipo de Alojamiento
Tipo: Single Select
Opciones:
  - Hotel
  - Aparta Hotel
  - Apartamentos
  - Casa
  - Habitacion
  - Hostal
  - Posada Nativa
  - Hotel boutique
```

2. **Precios por Cantidad de Huéspedes**
```
Nombre Airtable: Precio 1 Huesped
Tipo: Number
Ejemplo: 150000

Nombre Airtable: Precio 2 Huespedes
Tipo: Number
Ejemplo: 200000

Nombre Airtable: Precio 3 Huespedes
Tipo: Number
Ejemplo: 250000

Nombre Airtable: Precio 4+ Huespedes
Tipo: Number
Ejemplo: 300000
```

3. **Política de Bebés**
```
Nombre Airtable: Politica Bebes
Tipo: Long Text
Ejemplo: "Menores de 4 años no cuentan como huésped"
```

4. **Acepta Bebés**
```
Nombre Airtable: Acepta Bebes
Tipo: Checkbox
```

5. **Detalles de Camas**
```
Nombre Airtable: Camas Sencillas
Tipo: Number

Nombre Airtable: Camas Dobles
Tipo: Number
```

6. **Servicios**
```
Nombre Airtable: Tiene Cocina
Tipo: Checkbox

Nombre Airtable: Incluye Desayuno
Tipo: Checkbox
```

7. **Restricciones**
```
Nombre Airtable: Minimo Noches
Tipo: Number
Default: 1

Nombre Airtable: Capacidad Maxima
Tipo: Number
```

8. **Multi-moneda**
```
Nombre Airtable: Moneda Precios
Tipo: Single Select
Opciones: COP, USD
```

9. **Contacto**
```
Nombre Airtable: Telefono Contacto
Tipo: Text
Ejemplo: +57 8 512 1234

Nombre Airtable: Email Contacto
Tipo: Email
Ejemplo: info@hotel.com
```

---

## 💾 Servicios Implementados

### 1. hotelCacheService.ts (NUEVO)
**Ubicación**: `services/hotelCacheService.ts`

**Propósito**: 
- Caché local con fallback offline
- Sincronización automática
- ETAG para validación

**Métodos principales**:
```typescript
// Obtener hoteles (con estrategia Stale-While-Revalidate)
await hotelCacheService.getHotels(forceRefresh?: boolean)
// Retorna: { data, source, isFresh, metadata }

// Sincronizar en background
await hotelCacheService.syncInBackground()

// Limpiar caché
hotelCacheService.clearCache()

// Obtener estadísticas
hotelCacheService.getStats()

// Forzar refresh
await hotelCacheService.forceRefresh()
```

**Características**:
✅ Caché en LocalStorage
✅ Fallback a datos de ejemplo si API falla
✅ Auto-sync cuando regresa conexión
✅ Detecta conexión offline/online
✅ ETAG para validación condicional

### 2. airtableService.ts (ACTUALIZADO)
**Cambios**:
- Agrega mapeo de nuevos campos
- Crea `pricePerNight` automáticamente desde Airtable
- Soporta múltiples campos de precio

**Mapeo de campos**:
```typescript
// En función getServices():
accommodationType: f['Tipo de Alojamiento'] || '',
pricePerNight: {
  1: parseInt(f['Precio 1 Huesped'] || f['Precio'] || 0),
  2: parseInt(f['Precio 2 Huespedes'] || 0),
  3: parseInt(f['Precio 3 Huespedes'] || 0),
  4: parseInt(f['Precio 4+ Huespedes'] || 0),
},
allowBabies: f['Acepta Bebes'] === true,
babyPolicy: f['Politica Bebes'] || '',
// ... más campos
```

### 3. HotelList.tsx (ACTUALIZADO)
**Cambios**:
- Usa `hotelCacheService` en lugar de `cachedApi`
- Nuevo filtro por `Tipo de Alojamiento`
- Mejor logging para debugging

**Nuevas features**:
- Dropdown de tipos de alojamiento
- Filtro por capacidad
- Filtro por cocina
- Soporte offline transparente

### 4. Detail.tsx (ACTUALIZADO)
**Cambios**:
- Muestra `Tipo de Alojamiento` con badge
- Muestra `Política de Bebés`
- Selector de bebés (si `allowBabies = true`)
- Información de edades

**Cálculo de precio correcto**:
```typescript
// ✅ CORRECTO (Opción A implementada)
totalPrice = pricePerNight[quantity] * nights

// ✅ CORRECTO (Opción B alternativa)
// Si pricePerNight es array simple:
totalPrice = pricePerNight[quantity - 1] * nights
```

---

## 🔄 Flujo de Datos

### Cuando el usuario abre la app:

```
1. App inicia
   ↓
2. HotelList.tsx carga
   ↓
3. Llama hotelCacheService.getHotels()
   ↓
4. ¿Hay caché local fresco? 
   SÍ → Devuelve caché local (instantáneo)
   NO ↓
5. ¿Hay conexión a internet?
   SÍ → Fetch de Airtable en background
   NO → Devuelve caché viejo o fallback
   ↓
6. Actualiza LocalStorage
   ↓
7. Se muestra en pantalla
```

### Flujo de cotización (Detail.tsx):

```
Usuario selecciona alojamiento
   ↓
Selecciona cantidad de huéspedes (ej: 2)
   ↓
Selecciona número de noches (ej: 3)
   ↓
CÁLCULO: pricePerNight[2] * 3 = total
   ↓
Se muestra desglose:
   - Precio/noche para 2 huéspedes: $200,000
   - Número de noches: 3
   - Subtotal (antes de impuestos): $600,000
   ↓
(Opcional) Agregar bebés (no afecta precio base)
   ↓
"Agregar al carrito" con información completa
```

---

## 🧪 Testing Local

### 1. Datos de Ejemplo (Fallback)

Si Airtable falla, la app usa estos datos automáticamente:

```typescript
// En hotelCacheService.ts
const FALLBACK_HOTELS = [
  {
    id: 'fallback_hotel_1',
    title: 'Hotel Sunrise Beach',
    accommodationType: 'Hotel',
    allowBabies: true,
    babyPolicy: 'Bebés menores de 4 años no cuentan como huésped',
    // ...
  },
  // Posada Nativa, Casa, etc.
]
```

### 2. Verificar Caché Localmente

```javascript
// En consola del navegador:

// Ver estadísticas del caché
JSON.parse(localStorage.getItem('guanago_hotels_metadata'))

// Ver datos en caché
JSON.parse(localStorage.getItem('guanago_hotels_cache_v2'))

// Limpiar caché
localStorage.removeItem('guanago_hotels_cache_v2')
localStorage.removeItem('guanago_hotels_metadata')
```

### 3. Simular Modo Offline

1. Abrir DevTools (F12)
2. Ir a "Application" → "Service Workers"
3. Marcar "Offline"
4. La app debe funcionar normalmente con datos en caché

### 4. Verificar Cálculos

```
Escenario: Hotel con precios escalonados
- 1 persona: $150,000/noche
- 2 personas: $200,000/noche
- 3 personas: $250,000/noche

Prueba:
- Seleccionar 2 huéspedes + 3 noches
- Debe mostrar: $200,000 × 3 = $600,000 ✓

- Cambiar a 3 huéspedes
- Debe actualizar a: $250,000 × 3 = $750,000 ✓
```

---

## 🚀 Deployment

### Paso 1: Preparar Airtable
1. Abrir base `GuanaGO-App-v2`
2. Tabla `ServiciosTuristicos_SAI`
3. Agregar todos los campos nuevos (ver sección "Campos Airtable")
4. Ingresar datos de al menos 3 alojamientos de prueba

### Paso 2: Verificar Variables de Entorno
```bash
# .env o .env.local debe tener:
VITE_AIRTABLE_API_KEY=your_key_here
VITE_AIRTABLE_BASE_ID=your_base_id_here
```

### Paso 3: Build y Test
```bash
# Terminal 1: Backend
cd GuanaGo-App-Enero-main
npm run dev:server

# Terminal 2: Frontend
npm run dev

# Visitar http://localhost:3000
```

### Paso 4: Probar Flujos Completos

**Flujo A: Búsqueda**
1. Ir a Home → "Alojamientos"
2. Filtrar por tipo (ej: "Posada Nativa")
3. Verificar que solo muestra ese tipo
4. Seleccionar uno → Ir a detalles

**Flujo B: Detalles y Cotización**
1. Seleccionar cantidad de huéspedes
2. Cambiar cantidad de noches
3. Verificar que el precio se actualiza
4. Agregar bebés (si aplica)
5. Ver precio total correcto

**Flujo C: Offline**
1. Desconectar internet (DevTools)
2. Recargar página
3. Debe mostrar datos del caché
4. Puede navegar, buscar, etc.
5. Al reconectar, auto-sync en background

### Paso 5: Deploy a Producción
```bash
# Build
npm run build

# Deploy (según tu hosting)
# Ej: Vercel, Netlify, etc.
```

---

## 📱 API Reference

### hotelCacheService.getHotels()

```typescript
const result = await hotelCacheService.getHotels(forceRefresh);

// result estructura:
{
  data: Tour[],           // Array de hoteles
  source: 'api' | 'local' | 'fallback',
  isFresh: boolean,       // ¿Está actualizado?
  metadata: {
    lastSync: number,     // Timestamp último sync
    apiStatus: 'online' | 'offline' | 'stale',
    totalRecords: number,
    version: string,
    syncError?: string    // Si hay error
  }
}
```

### Usar en componentes

```typescript
// En HotelList.tsx:
import { hotelCacheService } from '../services/hotelCacheService';

// Cargar datos
const result = await hotelCacheService.getHotels();

// Datos siempre disponibles
const hotels = result.data;

// Saber si está actualizado
if (result.isFresh) {
  console.log('Datos frescos de la API');
} else {
  console.log('Datos en caché, últimos de:', result.metadata.lastSync);
}
```

---

## 🔍 Debugging

### Logs importantes

```
✅ Using fresh local cache
📦 Using stale local cache
❌ Using fallback data
✅ Updated cache from API
⚠️ API Error, falling back
📡 Connection restored - syncing hotels...
📶 Connection lost - using offline cache
🔄 Starting background hotel sync
```

### Ver logs en consola

```javascript
// Filtrar por "Hotel" o "🏨"
console.clear()
// Ahora abre HotelList y verás los logs

// Para ver metadata
hotelCacheService.getStats()
```

---

## 🎯 Checklist Final

- [ ] Todos los campos Airtable creados
- [ ] Datos de ejemplo ingresados en Airtable
- [ ] Variables de entorno configuradas
- [ ] `hotelCacheService.ts` funciona offline
- [ ] `HotelList.tsx` muestra filtro de tipos
- [ ] `Detail.tsx` calcula precios correctamente
- [ ] Bebés soportados (si aplicable)
- [ ] Caché se sincroniza en background
- [ ] Modo offline funciona
- [ ] Tests en localhost completos
- [ ] Documentación actualizada

---

## 📞 Troubleshooting

### "No aparecen alojamientos"
1. Verificar que `Tipo de Servicio = "Alojamiento"` en Airtable
2. Verificar que `Publicado = ✓` en Airtable
3. Limpiar caché: `localStorage.clear()`
4. Recargar página

### "Los precios no se calculan bien"
1. Verificar que `Precio 1 Huesped`, `Precio 2 Huespedes` existan
2. Si no existen, usa `Precio` como fallback
3. Ver cálculo en consola: `pricePerNight[quantity] * nights`

### "Offline no funciona"
1. Abrir DevTools → Application
2. Marcar "Offline"
3. Si aún no funciona, verificar `hotelCacheService.getStats()`
4. Si caché vacío, cargar en línea primero

### "Error de CORS"
1. Verificar API Key válida
2. Verificar Base ID correcto
3. Verificar URL está whitelisted en Airtable

---

**Última actualización**: 17 Enero 2026
**Versión**: 2.0
**Mantenedor**: GuanaGO Dev Team
