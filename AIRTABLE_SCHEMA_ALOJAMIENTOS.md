# 📋 Esquema de Airtable: ServiciosTuristicos_SAI
## Campos Requeridos para Alojamientos (Hoteles, Posadas, Casas, etc.)

### Última actualización: 17 Enero 2026
### Versión: 2.0

---

## 📊 TABLA: ServiciosTuristicos_SAI

Esta tabla centraliza TODOS los servicios: Tours, Alojamientos y Traslados.

---

## ✅ CAMPOS EXISTENTES (Mantener)

| Campo Airtable | Tipo | Uso |
|---|---|---|
| **Servicio** | Text | Nombre del alojamiento |
| **Tipo de Servicio** | Single Select | `Alojamiento`, `Tour`, `Traslado`, `Paquete` |
| **Descripcion** | Long Text | Descripción del lugar |
| **Precio** | Number | Precio base (usar para tours/traslados) |
| **Ubicacion** | Single Select | `San Andrés`, `Providencia` |
| **Imagenurl** | Attachment | Imágenes del alojamiento |
| **Horarios de Operacion** | Text | Horarios |
| **Capacidad** | Number | Máx huéspedes |
| **Rating** | Number | Calificación (4.5) |
| **Reviews** | Number | Cantidad reseñas |
| **Publicado** | Checkbox | Visible en la app |

---

## 🆕 CAMPOS NUEVOS A AGREGAR (Para Alojamientos)

### 1. **Tipo de Alojamiento** (CRÍTICO)
- **Campo Airtable**: `Tipo de Alojamiento`
- **Tipo**: Single Select
- **Opciones**:
  - Hotel
  - Aparta Hotel
  - Apartamentos
  - Casa
  - Habitacion
  - Hostal
  - Posada Nativa
  - Hotel boutique
- **Mostrado en**: Filtro de búsqueda, detalles del alojamiento
- **Usado en**: `Detail.tsx`, `HotelList.tsx`

### 2. **Precios por Cantidad de Huéspedes** (CRÍTICO - Para cálculo correcto)
Esto reemplaza el campo "Precio" para alojamientos. El sistema busca el precio según cantidad de personas.

**Opción A (Recomendada): Campos dinámicos separados**
```
- Precio 1 Huesped: Number (ej: 150000 COP/noche)
- Precio 2 Huespedes: Number (ej: 200000 COP/noche)
- Precio 3 Huespedes: Number (ej: 250000 COP/noche)
- Precio 4+ Huespedes: Number (ej: 300000 COP/noche)
```

**Opción B: JSON en un campo**
```
- Precios por Pax: Long Text (JSON)
Ejemplo: {"1": 150000, "2": 200000, "3": 250000, "4": 300000}
```

**Recomendación**: Usar **Opción A** (más fácil de usar en Airtable UI)

### 3. **Política de Bebés** (IMPORTANTE)
- **Campo Airtable**: `Politica Bebes`
- **Tipo**: Single Select or Long Text
- **Ejemplos de valores**:
  - "Menores de 4 años no cuentan como huésped"
  - "Máximo 1 bebé por habitación"
  - "Bebés gratis hasta 3 años"
  - "No aceptamos bebés"
- **Mostrado en**: Sección de detalles, selector de bebés

### 4. **Permite Bebés** (Booleano)
- **Campo Airtable**: `Acepta Bebes`
- **Tipo**: Checkbox
- **Valor**: True/False
- **Mostrado en**: Para decidir si mostrar selector de bebés
- **Usado en**: `Detail.tsx`

### 5. **Capacidad por Habitación/Unidad** (Para validación)
- **Campo Airtable**: `Capacidad Maxima`
- **Tipo**: Number
- **Ejemplo**: 4, 6, 8 personas
- **Usado en**: Filtro de capacidad, validación al agregar al carrito

### 6. **Cantidad de Camas Sencillas**
- **Campo Airtable**: `Camas Sencillas`
- **Tipo**: Number
- **Ejemplo**: 1, 2, 3
- **Mostrado en**: Filtro de búsqueda

### 7. **Cantidad de Camas Dobles**
- **Campo Airtable**: `Camas Dobles`
- **Tipo**: Number
- **Ejemplo**: 1, 2
- **Mostrado en**: Filtro de búsqueda

### 8. **Tiene Cocina**
- **Campo Airtable**: `Tiene Cocina`
- **Tipo**: Checkbox
- **Valor**: True/False
- **Mostrado en**: Filtro "Cocina"

### 9. **Incluye Desayuno** (OPCIONAL pero recomendado)
- **Campo Airtable**: `Incluye Desayuno`
- **Tipo**: Checkbox
- **Valor**: True/False

### 10. **Mínimo de Noches** (Para restricciones)
- **Campo Airtable**: `Minimo Noches`
- **Tipo**: Number
- **Ejemplo**: 1, 2, 3 (por defecto 1)
- **Validación**: Mostrar aviso si usuario selecciona menos noches

### 11. **Moneda por Defecto** (Para multi-moneda)
- **Campo Airtable**: `Moneda Precios`
- **Tipo**: Single Select
- **Opciones**: `COP`, `USD`
- **Ejemplo**: Si es "USD", multiplicar por TRM

### 12. **Contacto/Teléfono del Alojamiento**
- **Campo Airtable**: `Telefono Contacto`
- **Tipo**: Text
- **Ejemplo**: "+57 8 512 1234"

### 13. **Email del Alojamiento**
- **Campo Airtable**: `Email Contacto`
- **Tipo**: Email
- **Ejemplo**: "info@hotel.com"

---

## 🔄 MAPEO EN EL CÓDIGO (airtableService.ts)

```typescript
// En la función getServices(), agregar:
accommodationType: f['Tipo de Alojamiento'] || '',
pricePerNight: {
  1: parseInt(f['Precio 1 Huesped'] || f['Precio'] || 0),
  2: parseInt(f['Precio 2 Huespedes'] || 0),
  3: parseInt(f['Precio 3 Huespedes'] || 0),
  4: parseInt(f['Precio 4+ Huespedes'] || 0)
},
babyPolicy: f['Politica Bebes'] || '',
allowBabies: f['Acepta Bebes'] === true,
capacity: parseInt(f['Capacidad Maxima'] || f['Capacidad'] || 10),
singleBeds: parseInt(f['Camas Sencillas'] || 0),
doubleBeds: parseInt(f['Camas Dobles'] || 0),
hasKitchen: f['Tiene Cocina'] === true,
includesBreakfast: f['Incluye Desayuno'] === true,
minNights: parseInt(f['Minimo Noches'] || 1),
currencyPrice: f['Moneda Precios'] || 'COP',
phoneContact: f['Telefono Contacto'] || '',
emailContact: f['Email Contacto'] || ''
```

---

## 📱 ESTRUCTURA EN TYPES.TS

```typescript
export interface Hotel extends Tour {
  address: string;
  amenities: string[];
  pricePerNight: Record<number, number>;  // {1: 150000, 2: 200000, ...}
  maxGuests: number;
  accommodationType?: 'Hotel' | 'Aparta Hotel' | 'Apartamentos' | 'Casa' | 'Habitacion' | 'Hostal' | 'Posada Nativa' | 'Hotel boutique';
  allowBabies?: boolean;
  babyPolicy?: string;
  capacity?: number;
  singleBeds?: number;
  doubleBeds?: number;
  hasKitchen?: boolean;
  includesBreakfast?: boolean;
  minNights?: number;
  currencyPrice?: string;
  phoneContact?: string;
  emailContact?: string;
}
```

---

## 💾 SISTEMA DE CACHÉ Y BACKUP

### Ubicación: `services/hotelCacheService.ts` (NUEVO)

```typescript
// Guardará automáticamente en LocalStorage:
// - Tabla completa de alojamientos
// - Metadata (versión, último update)
// - ETAG para validación offline

// Flujo:
1. App abre → Cargar caché local (instantáneo)
2. Si hay conexión → Sincronizar con Airtable en background
3. Si sin conexión → Usar caché local sin errores
4. Cuando regresa la conexión → Actualizar automáticamente
```

---

## 🔍 VALIDACIONES NECESARIAS

### En HotelList.tsx (Búsqueda):
- ✅ Filtrar por `Tipo de Alojamiento`
- ✅ Filtrar por capacidad >= huéspedes solicitados
- ✅ Mostrar aviso si `Minimo Noches` > noches seleccionadas
- ✅ Filtrar por `Tiene Cocina` si se selecciona

### En Detail.tsx (Detalles):
- ✅ Mostrar `Tipo de Alojamiento` con badge
- ✅ Mostrar `Politica Bebes` si existe
- ✅ Mostrar/ocultar selector de bebés según `Acepta Bebes`
- ✅ Calcular precio: `pricePerNight[cantidad] * noches`
- ✅ Validar mínimo de noches

### En Checkout.tsx:
- ✅ Mostrar desglose: precio noche × cantidad × noches = total
- ✅ Mostrar contacto del alojamiento
- ✅ Opción de enviar consulta via WhatsApp

---

## ⚠️ CASOS ESPECIALES

### Habitación vs Habitaciones Múltiples
Si es una `Habitacion` individual:
- Máx 2-4 personas
- Los precios varían por cantidad
- Ejemplo: 1 persona: $100k, 2 personas: $140k

### Posada Nativa
- Típicamente familiar
- Precios pueden incluir desayuno raizal
- Mayor flexibilidad en bebés
- Mostrar "Experiencia Raizal" badge

### Hotel Boutique
- Premium pricing
- Menos capacidad
- Servicios especiales
- Mostrar en destacado

---

## 🚀 IMPLEMENTACIÓN PASO A PASO

### Paso 1: Crear campos en Airtable UI
- Abrir tabla `ServiciosTuristicos_SAI`
- Agregar todos los campos marcados como 🆕
- Ingresa datos de ejemplo para testeo

### Paso 2: Actualizar airtableService.ts
- Mapear nuevos campos en función `getServices()`
- Agregar tipos TypeScript

### Paso 3: Crear hotelCacheService.ts
- Sistema de backup automático
- Sincronización offline

### Paso 4: Testear en localhost
- Verificar búsquedas con filtros
- Verificar cálculo de precios
- Verificar caché offline

---

## 📊 VISTA PREVIA: Cómo se vería en Airtable

```
| Servicio | Tipo Servicio | Tipo Alojamiento | Precio 1 | Precio 2 | Precio 3 | Politica Bebes | Acepta Bebes |
|----------|---|---|---|---|---|---|---|
| Hotel Sunrise | Alojamiento | Hotel | 180000 | 220000 | 280000 | Menores 4 años gratis | ✓ |
| Casa Típica | Alojamiento | Casa | 150000 | 180000 | 220000 | Máx 1 bebé | ✓ |
| Posada Nativa | Alojamiento | Posada Nativa | 120000 | 150000 | 180000 | Familia completa OK | ✓ |
```

---

## 🔐 NOTAS DE SEGURIDAD

- **NO almacenar API Key en el código** → Usar variables de entorno
- **ETAG** para validación condicional reduce bandwido
- **Caché local** encriptado (localStorage con prefijo)
- **Validar precios** en backend antes de procesar pago

---

## 📞 SOPORTE

¿Dudas sobre algún campo? Revisar:
1. `types.ts` - Estructura del Hotel
2. `airtableService.ts` - Mapeo de campos
3. `Detail.tsx` - Cómo se muestran los datos
