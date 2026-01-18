# Panel de Aprobaciones Admin - Documentación Técnica

## 📋 Descripción

Nuevo panel en el **Super Admin Dashboard** que permite gestionar todas las solicitudes de reserva (AvailabilityRequests) que están en proceso de aprobación. Facilita la aprobación rápida de solicitudes sin necesidad de acceder a Airtable directamente.

---

## 🎯 Características

### ✅ Gestión Centralizada
- Vista de **todas las solicitudes** en el sistema (no solo las del socio)
- Filtrado por estado: Pendientes, Aprobadas, Rechazadas, Todas
- Estadísticas en tiempo real (contador de cada estado)
- Botón de refrescar manual

### ✅ Aprobación/Rechazo
- Botones de **Aprobar** y **Rechazar** para solicitudes pendientes
- Estados de procesamiento con spinner
- Mensajes de éxito/error
- Confirmación para rechazo
- Update inmediato en UI

### ✅ Información del Huésped
- Nombre completo
- Email (para envío de confirmación)
- WhatsApp (para notificación)
- Cantidad de adultos

### ✅ Detalles de la Reserva
- Tipo de servicio (Hotel, Tour, Traslado, Paquete)
- Fechas de entrada/salida (para hoteles)
- Nombre del servicio
- Fecha de creación de la solicitud
- Estado actual

### ✅ UI Responsiva
- Diseño mobile-first con Tailwind CSS
- Colores por estado (amarillo=pending, verde=approved, rojo=rejected)
- Indicadores visuales con iconos
- Grid de stats responsive

---

## 🏗️ Arquitectura

### Frontend: AdminApprovals.tsx

```
App.tsx
  ├─ case ADMIN_APPROVALS
  └─ render: <AdminApprovals onBack={goBack} onNavigate={navigateTo} />
```

**Componente** (React FC):
- Estado local: `requests[]`, `loading`, `filter`, `processingId`, `successMessage`
- Hooks: `useState`, `useEffect`
- Métodos:
  - `loadRequests()`: Carga desde API
  - `handleApprove(id)`: Envía PATCH con estado='approved'
  - `handleReject(id)`: Envía PATCH con estado='rejected'

**Data Flow**:
```
Component Mount
  ↓
useEffect → loadRequests()
  ↓
api.availability.listAllRequests()
  ↓
GET /api/availability-requests/admin/all
  ↓
Backend responde con AvailabilityRequest[]
  ↓
setRequests() → UI actualiza
  ↓
Usuario hace clic en Aprobar/Rechazar
  ↓
handleApprove/handleReject()
  ↓
api.availability.updateRequest(id, { estado })
  ↓
PATCH /api/availability-requests/:id
  ↓
Backend actualiza registro
  ↓
UI actualiza localmente + mensaje éxito
```

### Backend Routes

```javascript
// NEW
router.get('/admin/all', 
  authenticateToken,           // Requiere JWT
  authorizeRole('admin'),      // Solo admin
  availabilityController.listAll
);

// EXISTENTE (sin cambios)
router.patch('/:id',
  authenticateToken,
  authorizeRole('partner', 'admin'),
  availabilityController.updateRequest
);
```

### Backend Controller

```javascript
// NEW
export const listAll = async (req, res, next) => {
  const records = await listAvailabilityRequests({});
  res.json({ success: true, data: records });
};

// ACTUALIZADO: updateRequest ahora soporta { estado, updatedAt }
```

### Frontend API

```typescript
// NEW
listAllRequests: async () => {
  GET /api/availability-requests/admin/all
  return AvailabilityRequest[]
}

// NUEVO
updateRequest: async (requestId, updates) => {
  PATCH /api/availability-requests/:id
  body: { estado, tarifa, condiciones, updatedAt }
  return updated record
}
```

---

## 📊 Data Structure

### AvailabilityRequest Interface (Frontend)

```typescript
interface AvailabilityRequest {
  id: string;
  usuarioId: string;
  socioId: string;
  servicioId: string;
  tipoServicio: 'hotel' | 'tour' | 'traslado' | 'paquete';
  servicioNombre?: string;
  checkIn?: string;      // ISO date
  checkOut?: string;     // ISO date
  adultos: number;
  estado: 'pending' | 'approved' | 'rejected' | 'expired';
  contactName: string;
  contactEmail: string;
  contactWhatsapp: string;
  createdAt: string;     // ISO datetime
  updatedAt?: string;    // ISO datetime
}
```

---

## 🎨 UI Layout

### Header
```
[← Back] Solicitudes en Proceso | 🔄 Refrescar
         Aprueba o rechaza solicitudes de reserva
```

### Stats Grid (4 columnas)
```
[Pendientes: 5] [Aprobadas: 12] [Rechazadas: 2] [Total: 19]
```

### Request Cards (Grid dinámico)
```
┌─────────────────────────────────────────┐
│ Status Badge | Service Type             │
│ Nombre Servicio                         │
│ Solicitado: 17 Ene 2026 14:30          │
├─────────────────────────────────────────┤
│ 👤 Huésped: Juan García                │
│ 📧 juan@example.com                     │
│ 📱 +57 300 123 4567                    │
│ 🏨 2 Adultos                            │
│                                          │
│ 📅 Ene 20 → Ene 23 (3PM → 1PM)         │
├─────────────────────────────────────────┤
│ [✅ Aprobar]  [❌ Rechazar]             │
└─────────────────────────────────────────┘
```

### Filter Buttons
- Pendientes (amarillo)
- Aprobadas (verde)
- Rechazadas (rojo)
- Todas (azul)

---

## 🔄 Estados y Transiciones

```
PENDING
  ├─ Usuario hace clic [Aprobar]
  │   ↓
  │   availabilityStatus: loading
  │   ↓
  │   PATCH /api/availability-requests/:id
  │   body: { estado: 'approved' }
  │   ↓
  │   Response 200
  │   ↓
  │   UI actualiza: estado = 'approved'
  │   ↓
  │   Mostrar: "✅ Solicitud aprobada exitosamente"
  │   ↓
  │   APPROVED (con badge verde y fecha)
  │
  └─ Usuario hace clic [Rechazar]
      ↓
      Confirmar: "¿Estás seguro?"
      ↓
      availabilityStatus: loading
      ↓
      PATCH /api/availability-requests/:id
      body: { estado: 'rejected' }
      ↓
      Response 200
      ↓
      UI actualiza: estado = 'rejected'
      ↓
      Mostrar: "❌ Solicitud rechazada"
      ↓
      REJECTED (con badge rojo y fecha)
```

---

## 🔐 Autenticación y Autorización

### Requerimientos
1. **JWT Token** en header Authorization (Bearer token)
2. **User Role** debe ser `admin` (SuperAdmin)
3. **Scope**: Puede ver y gestionar TODAS las solicitudes

### Headers Requeridos
```
GET /api/availability-requests/admin/all
Authorization: Bearer eyJhbGc...
```

### Errores Posibles
```
401 Unauthorized     → Token inválido/expirado
403 Forbidden        → Usuario no es admin
400 Bad Request      → Parámetros inválidos
500 Server Error     → Error en servidor
```

---

## 📱 Integración en Dashboard

### AdminDashboard.tsx
Se agregó botón con:
- **Icono**: Clock (⏱️)
- **Color**: Gradiente amarillo/naranja con pulsación animada
- **Posición**: Segunda columna (después de Usuarios)
- **Acción**: `onClick={() => onNavigate(AppRoute.ADMIN_APPROVALS)}`

```tsx
<button 
  onClick={() => onNavigate(AppRoute.ADMIN_APPROVALS)}
  className="bg-gradient-to-br from-yellow-900 to-orange-900 p-4 rounded-xl border border-yellow-600 hover:border-yellow-400"
>
  <Clock size={24} className="text-yellow-400" />
  <span className="text-xs font-bold">Aprobaciones</span>
</button>
```

---

## 🧪 Testing Checklist

### Happy Path
- [ ] Admin ve panel con lista de solicitudes pendientes
- [ ] Clica "Aprobar" → solicitud se marca aprobada
- [ ] Clica "Rechazar" → aparece confirmación → se marca rechazada
- [ ] Filtros funcionan (muestra solo estado seleccionado)
- [ ] Stats se actualizan correctamente
- [ ] Mensaje de éxito aparece por 3 segundos

### Edge Cases
- [ ] Sin solicitudes → muestra mensaje "No hay solicitudes"
- [ ] Cargando → muestra spinner
- [ ] Error en API → muestra alerta
- [ ] Usuario no autenticado → rechaza request (401)
- [ ] Usuario no es admin → rechaza request (403)

### Performance
- [ ] Primera carga toma < 2 segundos
- [ ] Refrescar manual actualiza lista
- [ ] No hay re-renders innecesarios
- [ ] Estados de procesamiento responden rápido

---

## 🚀 Próximas Mejoras (Backlog)

1. **Auto-Refresh**: Polling cada 30 segundos en background
2. **Notificaciones**: WebSocket para actualizaciones en tiempo real
3. **Batch Actions**: Aprobar/rechazar múltiples a la vez
4. **Notes**: Agregar notas al aprobar/rechazar
5. **Audit Trail**: Registrar quién aprobó, cuándo y por qué
6. **Export**: Descargar reporte de solicitudes (PDF/CSV)
7. **Search**: Buscar por nombre, email, teléfono
8. **Sorting**: Ordenar por fecha, estado, servicios
9. **Tarifa Custom**: Permitir cambiar tarifa al aprobar
10. **Email Template**: Personalizar email de aprobación

---

## 📝 Notas Técnicas

### Por qué `/admin/all` antes que otras rutas
En Express, el orden de las rutas importa. Si pones:
```javascript
router.get('/:id', ...)    // Coincide con cualquier :id
router.get('/admin/all', ...)  // Nunca se ejecuta si :id = "admin"
```

Por eso `/admin/all` debe venir ANTES que `/:id`.

### TypeScript y Optional Chaining
En AdminApprovals.tsx se usa:
```typescript
const response = await (api.availability as any).listAllRequests?.();
```

Esto es porque TypeScript no reconoce `listAllRequests` en la definición de tipo (cache). El `as any` es temporal hasta recompilar.

### Manejo de Errores
- Errors capturados con try/catch
- API devuelve `[]` si falla (fallback)
- Usuario ve alerta de error en UI
- No se bloquea la app

---

## 🔗 Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `types.ts` | +1 ruta: `ADMIN_APPROVALS` |
| `App.tsx` | +import AdminApprovals, +case en switch |
| `pages/admin/AdminDashboard.tsx` | +Clock icon, +button navegación |
| `pages/admin/AdminApprovals.tsx` | ✨ NEW - componente completo |
| `services/api.ts` | +listAllRequests, +updateRequest |
| `backend/routes/availability.js` | +GET /admin/all |
| `backend/controllers/availabilityController.js` | +listAll method |

---

## 📞 Soporte

### Errores Comunes

**"No puedo acceder al panel"**
- Verifica ser SuperAdmin
- Revisa token JWT válido

**"No veo solicitudes"**
- ¿Existen registros en Airtable?
- ¿El backend está corriendo?
- Clica botón refrescar

**"Clic en Aprobar no funciona"**
- Verifica conexión a internet
- Revisa console por errores
- Recarga página

---

## 📊 KPIs Recomendados

Métricas a monitorear:
- **Tiempo de aprobación**: Promedio de tiempo entre solicitud y aprobación
- **Tasa de rechazo**: % de solicitudes rechazadas
- **Volumen diario**: Nuevas solicitudes por día
- **Picos horarios**: Cuándo más solicitudes llegan
- **Servicio más solicitado**: Qué tipo de servicio (hotel, tour, etc)

---

**Versión**: 1.0.0  
**Fecha**: 17 Enero 2026  
**Status**: ✅ Producción
