# ✅ CHECKLIST DE IMPLEMENTACIÓN: Alojamientos v2.0

**Fecha**: 17 Enero 2026  
**Estado**: 🔴 EN PROGRESO  
**Responsable**: Equipo GuanaGO

---

## 📋 FASE 1: Preparación Airtable (30 minutos)

### Agregar campos a Airtable
- [ ] Ir a `ServiciosTuristicos_SAI`
- [ ] Click en `+` para agregar campo
- [ ] **Tipo de Alojamiento** (Single Select)
  - [ ] Crear opciones: Hotel, Aparta Hotel, Apartamentos, Casa, Habitacion, Hostal, Posada Nativa, Hotel boutique
- [ ] **Precio 1 Huesped** (Number) - Precio/noche para 1 persona
- [ ] **Precio 2 Huespedes** (Number) - Precio/noche para 2 personas
- [ ] **Precio 3 Huespedes** (Number) - Precio/noche para 3 personas
- [ ] **Precio 4+ Huespedes** (Number) - Precio/noche para 4+ personas
- [ ] **Politica Bebes** (Long Text) - Descripcción, ej: "Menores de 4 años no cuentan"
- [ ] **Acepta Bebes** (Checkbox)
- [ ] **Camas Sencillas** (Number)
- [ ] **Camas Dobles** (Number)
- [ ] **Tiene Cocina** (Checkbox)
- [ ] **Incluye Desayuno** (Checkbox)
- [ ] **Minimo Noches** (Number) - Default 1
- [ ] **Capacidad Maxima** (Number)
- [ ] **Moneda Precios** (Single Select) - Opciones: COP, USD
- [ ] **Telefono Contacto** (Text)
- [ ] **Email Contacto** (Email)

### Ingresar datos de prueba
- [ ] Crear 3-5 registros de alojamiento con todos los campos
- [ ] Ejemplos:
  - [ ] Hotel Sunrise (Hotel) - Precios: 150k, 200k, 250k, 300k
  - [ ] Posada Bella (Posada Nativa) - Precios: 100k, 130k, 160k, 190k
  - [ ] Casa de Playa (Casa) - Precios: 120k, 150k, 180k, 220k
  - [ ] Habitación Acogedora (Habitacion) - Precios: 80k, 100k, 120k, 150k
- [ ] Marcar todos como `Publicado = ✓`
- [ ] Agregar URLs de imágenes
- [ ] Llenar descripción para cada uno

---

## 💻 FASE 2: Código (Completado ✅)

### Archivos creados/modificados
- [x] `services/hotelCacheService.ts` - NUEVO - Sistema de caché offline
- [x] `services/airtableService.ts` - ACTUALIZADO - Mapeo de campos nuevos
- [x] `types.ts` - ACTUALIZADO - Interface Hotel extendida
- [x] `pages/HotelList.tsx` - ACTUALIZADO - Filtro por tipo + caché
- [x] `pages/Detail.tsx` - ACTUALIZADO - Mostrar categoría, bebés, edades
- [x] `context/CartContext.tsx` - ACTUALIZADO - Guardar bebés
- [x] `pages/Home.tsx` - ACTUALIZADO - "Alojamientos" en lugar de "Hoteles"

### Documentación creada
- [x] `AIRTABLE_SCHEMA_ALOJAMIENTOS.md` - Esquema de campos
- [x] `GUIA_TECNICA_ALOJAMIENTOS_v2.md` - Guía técnica completa

---

## 🧪 FASE 3: Testing Local (1-2 horas)

### Setup
- [ ] Terminal 1: Iniciar backend
  ```bash
  cd GuanaGo-App-Enero-main
  npm run dev:server
  ```
- [ ] Terminal 2: Iniciar frontend
  ```bash
  npm run dev
  ```
- [ ] Abrir http://localhost:3000 en navegador

### Test 1: Cargar datos
- [ ] Verificar que carga "Alojamientos" (no "Hoteles")
- [ ] Abrir DevTools → Console
- [ ] Ver logs: "Alojamientos cargados: X registros"
- [ ] Verificar que no hay errores

### Test 2: Filtros de búsqueda
- [ ] Ir a Home → Alojamientos → Panel de búsqueda
- [ ] Seleccionar tipo "Hotel"
- [ ] Click "Buscar alojamientos"
- [ ] Verificar que solo muestra Hotels
- [ ] Seleccionar tipo "Posada Nativa"
- [ ] Verificar filtrado correcto
- [ ] Probar con "Todos los tipos"

### Test 3: Detalle y precios
- [ ] Seleccionar un alojamiento de prueba
- [ ] Verificar que muestra:
  - [ ] Tipo de alojamiento (con badge ámbar)
  - [ ] Política de bebés (si aplica)
  - [ ] Selector de huéspedes
  - [ ] Selector de noches
  - [ ] Selector de bebés (si Acepta Bebes = ✓)
- [ ] Seleccionar 2 huéspedes
- [ ] Verificar precio = Precio 2 Huespedes/noche
- [ ] Seleccionar 3 noches
- [ ] Verificar precio total = Precio 2 Huespedes × 3
- [ ] Aumentar a 3 huéspedes
- [ ] Verificar precio actualizado
- [ ] Verificar texto de edades: "Edades 4+ se cuentan como adulto"

### Test 4: Bebés
- [ ] En un alojamiento que acepta bebés
- [ ] Agregar bebés usando selector azul
- [ ] Verificar que NO multiplica el precio
- [ ] Ver que aparece en resumen: "X bebés"

### Test 5: Agregar al carrito
- [ ] Seleccionar: 2 huéspedes, 3 noches, 1 bebé
- [ ] Click "Agregar al carrito"
- [ ] Ir al carrito
- [ ] Verificar que muestra:
  - [ ] Precio correcto = Precio 2 Huespedes × 3 noches
  - [ ] 2 huéspedes
  - [ ] 1 bebé
  - [ ] 3 noches

### Test 6: Offline
- [ ] Abrir DevTools (F12)
- [ ] Network tab → Throttling → "Offline"
- [ ] Recargar página
- [ ] Verificar que muestra datos (de caché)
- [ ] Poder navegar, buscar, etc.
- [ ] Volver a "Online"
- [ ] Verificar que se sincroniza en background

### Test 7: Caché en localStorage
- [ ] Abrir Console en DevTools
- [ ] Ejecutar:
  ```javascript
  JSON.parse(localStorage.getItem('guanago_hotels_metadata'))
  ```
- [ ] Verificar que muestra metadata con:
  - [ ] `apiStatus: "online"`
  - [ ] `totalRecords: X` (número de alojamientos)
  - [ ] `lastSync: timestamp`

---

## 🔄 FASE 4: Integración con Airtable Real (1 hora)

### Verificar conexión
- [ ] En Console del navegador, verificar logs:
  - [ ] "Updated cache from API"
  - [ ] "Fetched X records from ServiciosTuristicos_SAI"
- [ ] Si hay error:
  - [ ] Verificar `.env` tiene `VITE_AIRTABLE_API_KEY` ✓
  - [ ] Verificar `.env` tiene `VITE_AIRTABLE_BASE_ID` ✓
  - [ ] Verificar API Key es válida
  - [ ] Verificar tabla `ServiciosTuristicos_SAI` existe

### Verificar sincronización
- [ ] Cambiar un alojamiento en Airtable (ej: precio)
- [ ] Esperar 30 segundos
- [ ] Recargar app
- [ ] Verificar que refleja el cambio

### Verificar modo offline → online
- [ ] Desconectar internet
- [ ] Usar app en offline
- [ ] Conectar internet
- [ ] Verificar auto-sync en background
- [ ] Ver en Console: "Connection restored - syncing"

---

## 📊 FASE 5: Validaciones Finales

### Rendimiento
- [ ] Página carga en menos de 3 segundos
- [ ] Búsqueda responde al instante (caché)
- [ ] No hay memory leaks (DevTools)

### Errores
- [ ] No hay errores rojos en Console
- [ ] No hay advertencias (warnings) importantes
- [ ] Offline no causa crashes

### Funcionalidad
- [ ] ✅ Filtro de tipo de alojamiento funciona
- [ ] ✅ Cálculo de precios correcto
- [ ] ✅ Bebés soportados
- [ ] ✅ Información de edades mostrada
- [ ] ✅ Caché offline funciona
- [ ] ✅ Sincronización automática funciona

---

## 🚀 FASE 6: Deploy (30 minutos)

### Pre-deployment
- [ ] Commit de cambios
  ```bash
  git add .
  git commit -m "feat: Alojamientos v2 con caché offline y cotización automática"
  ```
- [ ] Push a rama
  ```bash
  git push origin master
  ```

### Build
- [ ] Ejecutar build
  ```bash
  npm run build
  ```
- [ ] Verificar que no hay errores
- [ ] Verificar que la carpeta `dist/` se creó

### Deploy a producción
- [ ] Según tu plataforma (Vercel, Netlify, etc.):
  - [ ] Vercel: Auto-deploy desde git
  - [ ] Netlify: Deploy mediante CLI o drag-drop
  - [ ] Manual: Subir carpeta `dist/` a servidor

### Post-deployment
- [ ] Abrir app en producción
- [ ] Verificar que carga correctamente
- [ ] Probar búsqueda de alojamientos
- [ ] Probar agregar al carrito
- [ ] Probar en mobile

---

## 📈 FASE 7: Monitoreo (Ongoing)

### Diario
- [ ] Revisar logs de errores
- [ ] Verificar que la API de Airtable responde
- [ ] Verificar que el caché se actualiza

### Semanal
- [ ] Revisar métricas de rendimiento
- [ ] Revisar feedback de usuarios
- [ ] Verificar modo offline funciona

### Mensual
- [ ] Revisar datos de Airtable
- [ ] Actualizar precios si es necesario
- [ ] Revisar política de bebés según feedback

---

## 🐛 Troubleshooting Rápido

| Problema | Solución |
|----------|----------|
| No aparecen alojamientos | 1. Verificar Airtable tiene datos<br>2. Verificar `Tipo de Servicio = "Alojamiento"`<br>3. Limpiar caché: `localStorage.clear()`<br>4. Recargar |
| Precios incorrectos | 1. Verificar campos `Precio X Huespedes` en Airtable<br>2. Verificar cálculo: `precio × noches`<br>3. Ver en Console: `pricePerNight` |
| Offline no funciona | 1. Cargar app en línea primero<br>2. Verificar LocalStorage no vacío<br>3. Desconectar en DevTools |
| API Error | 1. Verificar `.env` variables<br>2. Verificar API Key válida<br>3. Verificar tabla existe en Airtable |

---

## ✨ Features Completadas

- ✅ Cambio de "Hoteles" a "Alojamientos"
- ✅ Filtro por tipo de alojamiento (8 tipos)
- ✅ Precios escalonados por cantidad de huéspedes
- ✅ Soporte para bebés (menores de 4 años)
- ✅ Información de edades en detail
- ✅ Caché local con fallback offline
- ✅ Sincronización automática en background
- ✅ Cálculo correcto: precio × huéspedes × noches
- ✅ Política de bebés configurable
- ✅ Datos de ejemplo para testing

---

## 📝 Notas

- **Última actualización**: 17 Enero 2026
- **Versión**: 2.0
- **Cambios principales**: Sistema de caché offline + cotización automática
- **Próximos**: Integración de payments, reviews, reservations confirmadas

---

## 🎯 Objetivos Alcanzados

1. ✅ Sistema de alojamientos flexible sin duplicar tablas
2. ✅ Cotización automática y correcta
3. ✅ Soporte offline para mejor UX
4. ✅ Escalable para futuros tipos de servicios
5. ✅ Datos de ejemplo para testing

**Status: LISTO PARA TESTING** 🚀
