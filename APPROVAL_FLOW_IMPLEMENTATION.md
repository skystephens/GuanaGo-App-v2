# Flujo de Aprobación Condicional - Implementación Técnica

## 📋 Descripción General

Sistema flexible de aprobación de servicios que requieren confirmación del socio antes de procesar el pago. La aprobación es **obligatoria para alojamientos** y **condicional para tours/traslados** basada en un campo Airtable.

---

## 🔄 Flujo de Datos

```
Usuario en Detail.tsx
    ↓
Selecciona fechas (hoteles) o fecha/hora (tours)
    ↓
Agrega a carrito → CartItem con { requiresApproval, checkIn, checkOut, date, time }
    ↓
Llega a Checkout.tsx
    ↓
¿Hay servicios con requiresApproval=true?
    ├─ SÍ → Mostrar alerta amarilla + botón "Solicitar Disponibilidad"
    │       ↓
    │       Usuario envia solicitud → availabilityStatus: 'pending'
    │       ↓
    │       Socio aprueba en panel → availabilityStatus: 'approved'
    │       ↓
    │       Botón "Pagar" habilitado
    │
    └─ NO → Botón "Pagar" habilitado directamente
```

---

## 🗂️ Mapeo de Airtable → Tour Interface

### ServiciosTuristicos_SAI

| Campo Airtable | Mapeo en Tour Interface | Notas |
|---|---|---|
| `Tipo de Servicio` | `category` | 'hotel'\|'tour'\|'taxi'\|'package' |
| `RequiereAprobacion` | `requiresApproval` | Boolean; campo nuevo |
| `Requiere Aprobacion` | `requiresApproval` | Fallback si el anterior no existe |
| *No existe* | `requiresApproval` | Default: true si hotel, false si tour |

### Lógica de Mapeo en airtableService.ts (línea 596-605)

```typescript
requiresApproval: (() => {
  if (tipoServicio.includes('alojamiento') || tipoServicio.includes('hotel')) {
    return true; // Hoteles SIEMPRE requieren aprobación
  }
  // Tours/Traslados: leer del campo Airtable
  const fieldValue = f['RequiereAprobacion'] || f['Requiere Aprobacion'] || false;
  return fieldValue === true || fieldValue === 'true' || fieldValue === 'sí' || fieldValue === 'si';
})(),
```

---

## 🎯 Componentes Afectados

### 1. **types.ts**
- ✅ `Tour` interface: nuevo campo `requiresApproval?: boolean`
- ✅ `CartItem` interface: nuevos campos `checkIn?: string`, `checkOut?: string`

### 2. **services/airtableService.ts (getServices)**
- ✅ Lee `RequiereAprobacion` de Airtable
- ✅ Mapea a `requiresApproval` en Tour object
- ✅ Hoteles siempre `true`, tours dependen del campo

### 3. **pages/Detail.tsx**
- ✅ Modal de fechas para hoteles (check-in/check-out)
- ✅ `handleAddToCart` usa `checkIn`/`checkOut` para hoteles
- ✅ CartItem incluye `requiresApproval` al agregar

### 4. **pages/Checkout.tsx**
- ✅ Nueva lógica: `servicesNeedingApproval = items.filter(i => i.requiresApproval === true)`
- ✅ Alert amarilla muestra lista de servicios requiriendo aprobación
- ✅ Botón "Solicitar Disponibilidad" envía request para todos los servicios con `requiresApproval=true`
- ✅ Botón "Pagar" deshabilitado mientras `hasApprovalRequirement && availabilityStatus !== 'approved'`
- ✅ Muestra check-in/check-out para hoteles en resumen de carrito

---

## 📱 Estados en Checkout

### availabilityStatus
```
'not-requested'  → Usuario no ha solicitado aprobación aún
    ↓
'pending'        → Solicitud enviada, esperando respuesta del socio
    ↓
'approved'       → Socio aprobó, usuario puede pagar
```

### Transiciones
```
Checkout abre
    ↓ (si hasApprovalRequirement)
Mostrar alerta + botón
    ↓
Usuario hace clic "Solicitar Disponibilidad"
    ↓
availabilityStatus = 'pending'
    ↓
(Socio aprueba en backend vía PATCH /api/availability-requests/:id)
    ↓
availabilityStatus = 'approved' (requiere polling o webhook)
    ↓
Botón "Pagar" habilitado
```

---

## 🔌 Endpoints Involucrados

### Crear Solicitud (Detail.tsx → Checkout.tsx)
```
POST /api/availability-requests
Body: {
  alojamientoId: string,
  checkIn: string (ISO date),
  checkOut: string (ISO date),
  adultos: number,
  tipoServicio: 'hotel'|'tour'|'traslado',
  contactName: string,
  contactEmail: string,
  contactWhatsapp: string
}
```

### Listar Solicitudes del Usuario
```
GET /api/availability-requests/user
Auth: JWT
Response: AvailabilityRequest[]
```

### Aprobar Solicitud (Partner Portal)
```
PATCH /api/availability-requests/:id
Body: { estado: 'approved'|'rejected', ... }
Auth: JWT + role: 'partner'|'admin'
```

---

## 💾 Airtable Tables

### AvailabilityRequests
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | Text (PK) | UUID único |
| `usuarioId` | Text (FK) | Usuario que solicita |
| `socioId` | Text (FK) | Socio/Partner propietario del servicio |
| `servicioId` | Text (FK) | Referencia a ServiciosTuristicos_SAI.id |
| `tipoServicio` | Select | 'hotel'\|'tour'\|'traslado' |
| `checkIn` | Date | Fecha de entrada (hoteles) |
| `checkOut` | Date | Fecha de salida (hoteles) |
| `adultos` | Number | Cantidad de adultos |
| `estado` | Select | 'pending'\|'approved'\|'rejected'\|'expired' |
| `contactEmail` | Email | Para notificaciones |
| `contactWhatsapp` | Text | Para confirmación vía WhatsApp |
| `expiresAt` | DateTime | Validez de la solicitud (24h default) |
| `createdAt` | DateTime | Timestamp |
| `updatedAt` | DateTime | Timestamp |

### ServiciosTuristicos_SAI
Campos relevantes para aprobación:
- `Tipo de Servicio` → category
- `RequiereAprobacion` → requiresApproval (nuevo campo a crear)
- `Socio_ID` → Para referenciar AvailabilityRequests.socioId

---

## 🎨 UI/UX Changes

### Detail.tsx
✅ Ya implementado en sesión anterior
- Modal con date pickers para check-in/check-out
- Botón "Confirmar Fechas" agrega al carrito con datos de reserva

### Checkout.tsx - Paso 3 (Pago)
✅ Nueva implementación
```
┌─────────────────────────────────────────────┐
│ ⚠️ Verificación de Disponibilidad Requerida  │
├─────────────────────────────────────────────┤
│ Los siguientes servicios requieren          │
│ confirmación del socio antes de proceder:   │
│                                              │
│ • Posada Caribeña (hotel)                   │
│ • Tour de Avistamiento de Aves (tour)       │
│                                              │
│ Estado: Pendiente                           │
│ [Solicitar Disponibilidad]                  │
└─────────────────────────────────────────────┘
```

---

## 🔄 Polling de Aprobación (Future)

Actualmente el `availabilityStatus` debe ser actualizado manualmente. Para mejorar UX:

```typescript
useEffect(() => {
  if (hasApprovalRequirement && availabilityStatus === 'pending') {
    const interval = setInterval(async () => {
      const requests = await api.availability.listMyRequests();
      const allApproved = servicesNeedingApproval.every(svc => 
        requests.some(req => req.servicioId === svc.id && req.estado === 'approved')
      );
      if (allApproved) setAvailabilityStatus('approved');
    }, 5000); // Poll cada 5 segundos
    
    return () => clearInterval(interval);
  }
}, [availabilityStatus, hasApprovalRequirement]);
```

---

## ✅ Checklist de Implementación

- [x] Agregar campo `requiresApproval` a Tour interface
- [x] Agregar campos `checkIn`/`checkOut` a CartItem interface
- [x] Mapear `RequiereAprobacion` desde Airtable en getServices()
- [x] Actualizar Checkout con lógica condicional (no solo hoteles)
- [x] Mostrar lista de servicios requiriendo aprobación
- [x] Mostrar check-in/check-out en resumen de carrito
- [x] Actualizar handleRequestAvailability para servicios condicionales
- [ ] Implementar polling de aprobación en Checkout
- [ ] Crear panel socio: "Mis Solicitudes" (approval requests)
- [ ] Crear panel socio: "Mis Reservas" (paid reservations)
- [ ] Validar que `RequiereAprobacion` existe en Airtable schema
- [ ] Agregar notificaciones WhatsApp a socio cuando hay solicitud

---

## 🧪 Testing

### Case 1: Hotel (requiere aprobación siempre)
1. Seleccionar hotel en Detail
2. Elegir fechas (check-in/check-out)
3. Agregar a carrito
4. En Checkout: debe mostrar alerta amarilla
5. Botón pagar debe estar deshabilitado
6. Clic en "Solicitar Disponibilidad"
7. availabilityStatus pasa a 'pending'
8. (Backend aprueba)
9. availabilityStatus pasa a 'approved'
10. Botón pagar se habilita

### Case 2: Tour sin aprobación requerida
1. Seleccionar tour con `RequiereAprobacion=false`
2. Elegir fecha/hora
3. Agregar a carrito
4. En Checkout: NO debe mostrar alerta
5. Botón pagar habilitado directamente

### Case 3: Tour con aprobación requerida
1. Seleccionar tour con `RequiereAprobacion=true`
2. Elegir fecha/hora
3. Agregar a carrito
4. En Checkout: debe mostrar alerta (como hoteles)
5. Requiere aprobación antes de pagar

### Case 4: Carrito mixto
1. Agregar: Hotel + Tour sin aprobación + Tour con aprobación
2. Checkout debe mostrar alerta para: Hotel + Tour con aprobación
3. Tour sin aprobación no aparece en alerta
4. Requiere aprobación solo de los 2 primeros

---

## 📚 Documentación Relacionada

- [GUIA_TECNICA_ALOJAMIENTOS_v2.md](GUIA_TECNICA_ALOJAMIENTOS_v2.md) - Flujo completo de alojamientos
- [FLUJO_APROBACION_ALOJAMIENTOS.md](FLUJO_APROBACION_ALOJAMIENTOS.md) - Estados y transiciones
- [MAPEO_AIRTABLE_CODIGO.md](MAPEO_AIRTABLE_CODIGO.md) - Field mappings
- [AIRTABLE_SCHEMA_ALOJAMIENTOS.md](AIRTABLE_SCHEMA_ALOJAMIENTOS.md) - Schema details

---

## 🚀 Próximos Pasos

1. **Crear campo en Airtable**: `RequiereAprobacion` (Toggle) en ServiciosTuristicos_SAI
2. **Implementar polling**: Refrescar availabilityStatus automáticamente
3. **Panel Socio**: Crear "Mis Solicitudes" y "Mis Reservas"
4. **Notificaciones**: Integrar WhatsApp/Email para solicitudes de aprobación
5. **Analytics**: Trackear tiempo promedio de aprobación por servicio

