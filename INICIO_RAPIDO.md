# ⚡ IMPLEMENTACIÓN RÁPIDA (5 minutos)

## Lo que necesitas saber AHORA

### 1️⃣ En Airtable (ServisiosTuristicos_SAI)

Agrega estos campos (actualizados con boutique y amenities):

```
Nombre del Campo                 | Tipo              | Ejemplo
────────────────────────────────|───────────────────|──────────────────
Tipo de Alojamiento              | Single Select     | Hotel
Precio 1 Huesped                 | Number            | 150000
Precio 2 Huespedes               | Number            | 200000
Precio 3 Huespedes               | Number            | 250000
Precio 4+ Huespedes              | Number            | 300000
Politica Bebes                   | Long Text         | Menores 4 años gratis
Acepta Bebes                     | Checkbox          | ✓
Camas Sencillas                  | Number            | 1
Camas Dobles                     | Number            | 2
Cama Queen                       | Number            | 1
Cama King                        | Number            | 1
Tiene Cocina                     | Checkbox          | ✓
Incluye Desayuno                 | Checkbox          | ✓
Acceso a Piscina                 | Checkbox          | ✓
Acceso a Jacuzzi                 | Checkbox          | ✓
Acceso a Bar                     | Checkbox          | ✓
Minimo Noches                    | Number            | 1
Capacidad Maxima                 | Number            | 4
Plan de Alimentación             | Long Text         | PE | Solo Alojamiento
Moneda Precios                   | Single Select     | COP
RNT                              | Text              | 12345678
Telefono Contacto                | Text              | +57 8 512 1234
Email Contacto                   | Email             | info@hotel.com
```

### 2️⃣ El Código

✅ **LISTO - Ya está implementado**

Archivos modificados:
- ✅ `services/hotelCacheService.ts` (NUEVO)
- ✅ `services/airtableService.ts` (ACTUALIZADO)
- ✅ `pages/HotelList.tsx` (ACTUALIZADO)
- ✅ `pages/Detail.tsx` (ACTUALIZADO)
- ✅ `types.ts` (ACTUALIZADO)

### 3️⃣ Documentación

4 documentos creados:

1. **RESUMEN_EJECUTIVO_ALOJAMIENTOS_v2.md** ← LEER PRIMERO
   - Qué se hizo y por qué
   - Ventajas del sistema
   - Próximos pasos

2. **AIRTABLE_SCHEMA_ALOJAMIENTOS.md**
   - Exactamente qué campos crear
   - Cómo mapean en el código

3. **GUIA_TECNICA_ALOJAMIENTOS_v2.md**
   - Cómo funciona técnicamente
   - Troubleshooting

4. **MAPEO_AIRTABLE_CODIGO.md**
   - Referencia visual
   - Ejemplo completo

---

## 🚀 Para empezar HOY

### Paso 1: Agregar campos en Airtable (15 min)
```
1. Abrir: https://airtable.com → Base GuanaGO → ServiciosTuristicos_SAI
2. Click [+] para agregar campo
3. Ingresa nombre, tipo, opciones (si aplica)
4. Repetir 15 veces
```

### Paso 2: Ingresa datos de prueba (15 min)
```
Crea al menos 3 registros con:
- Hotel, Posada Nativa, Casa
- Precios para 1, 2, 3, 4+ personas
- Tipo de Alojamiento
- Política de bebés
```

### Paso 3: Test en localhost (30 min)
```bash
# Terminal 1
npm run dev:server

# Terminal 2  
npm run dev

# Abrir: http://localhost:3000
# → Home → Alojamientos
# → Seleccionar uno
# → Verificar precio correcto
```

### Paso 4: Deploy (si todo funciona)
```bash
npm run build
# Deploy a tu servidor
```

---

## ✨ Qué verás

### Antes (Viejo)
```
HOME
├─ Tours
├─ ❌ Hoteles ← Nombre genérico
├─ Traslados
└─ ...

DETAIL
├─ Precio base (sin escala)
├─ Selector huéspedes
└─ (sin info de bebés)
```

### Después (Nuevo) ✅
```
HOME
├─ Tours
├─ ✅ Alojamientos ← Nombre mejorado
├─ Traslados
└─ ...

HOTELLIST
├─ Filtro: Tipo de Alojamiento ✨
│  ├─ Hotel
│  ├─ Posada Nativa
│  └─ Casa
└─ Buscar

DETAIL
├─ 🏨 Tipo: Hotel (badge ámbar)
├─ 👶 Política: Menores 4 años... (info azul)
├─ Selector huéspedes
├─ Selector noches
├─ Selector bebés ✨ (azul)
├─ ℹ️ Edades 4+ adulto, bebés 0-3
└─ Precio correcto: $200k × 3 noches = $600k ✨
```

---

## 🎯 El Núcleo: Cálculo de Precio

```
ANTES (❌ INCORRECTO)
─────────────────────
Precio/noche: $200,000
Noches: 3
Total: $200,000 × 3 = $600,000 ✓ (por casualidad)

PERO si era para 2 personas:
Huéspedes: 2
Noches: 3
Total: $200,000 × 2 × 3 = $1,200,000 ✗ (MAL)

DESPUÉS (✅ CORRECTO)
────────────────────
Para 1 persona: $150,000/noche
Para 2 personas: $200,000/noche ← Precio DISTINTO
Para 3 personas: $250,000/noche ← Precio DISTINTO

Selecciono: 2 personas × 3 noches
Total: $200,000 × 3 = $600,000 ✓ (CORRECTO)

Cambio a: 3 personas × 3 noches
Total: $250,000 × 3 = $750,000 ✓ (CORRECTO)
```

---

## 💾 Caché Offline

```
CONEXIÓN    → QUÉ SUCEDE
────────────────────────────────
Primera vez | Descarga de Airtable
           | Guarda en LocalStorage
           | Muestra datos

Online      | Usa datos del caché
            | Sincroniza en background
            | (Usuario no espera)

Desconecta  | Sigue usando caché local
            | App funciona 100% normal
            | No hay errores

Reconecta   | Auto-sync en background
            | Actualiza datos
            | Todo invisible para usuario
```

---

## 📋 Checklist Mínimo

- [ ] Airtable: 15 campos agregados
- [ ] Airtable: 3+ alojamientos con datos
- [ ] Localhost: Carga sin errores
- [ ] Localhost: Filtro de tipo funciona
- [ ] Localhost: Precio se calcula correctamente
- [ ] Localhost: Funciona offline (DevTools)
- [ ] ✅ Listo para Deploy

---

## 🆘 Si algo falla

### "No aparecen alojamientos"
```javascript
// En consola:
hotelCacheService.getStats()
// Si vacío → Airtable sin datos o API falla
```

### "Precios mal"
```javascript
// En consola:
JSON.parse(localStorage.getItem('guanago_hotels_cache_v2'))
.data[0].pricePerNight
// Si no está → Campos no en Airtable
```

### "Offline no funciona"
```javascript
// En consola:
localStorage.getItem('guanago_hotels_cache_v2')
// Si null → Cargar en línea primero
```

---

## 📞 Documentos para Consultar

| Necesito... | Ver documento |
|-------------|---------------|
| Entender qué se hizo | RESUMEN_EJECUTIVO_ALOJAMIENTOS_v2.md |
| Qué campos crear | AIRTABLE_SCHEMA_ALOJAMIENTOS.md |
| Cómo funciona técnicamente | GUIA_TECNICA_ALOJAMIENTOS_v2.md |
| Referencia visual de mapeo | MAPEO_AIRTABLE_CODIGO.md |
| Pasos exactos a seguir | CHECKLIST_IMPLEMENTACION.md |

---

## ⏰ Tiempo Estimado

```
Airtable (agregar campos):      15 minutos
Airtable (datos de prueba):     15 minutos
Testing en localhost:           30 minutos
Deploy a producción:            15 minutos
                               ───────────
TOTAL:                          ~75 minutos
```

---

## 🎉 Resultado Final

✅ Sistema flexible para todos tus alojamientos  
✅ Cotización automática y correcta  
✅ Funciona offline sin internet  
✅ Sincronización automática en background  
✅ Soporte para bebés y políticas especiales  
✅ Escalable para futuros cambios  

**Status: LISTO PARA IMPLEMENTAR** 🚀

---

**Última actualización**: 17 Enero 2026 | **Versión**: 2.0
