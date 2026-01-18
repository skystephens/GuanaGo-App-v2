# 🎨 Panel Unificado - Guía Visual

## 📱 Vista General del Panel

```
┌─────────────────────────────────────────────────────┐
│  ← [LOGO]     Mi Panel de Control      [ROL BADGE]  │
│  ↑ Atrás      Acceso rápido a todas    [SuperAdmin] │
│               tus funcionalidades                    │
└─────────────────────────────────────────────────────┘

┌─────────────┬─────────────┬─────────────┬──────────┐
│  🎫 TOURS   │ 🏨 HOTELS   │ 🚕 TAXI    │ 📦 PKG   │
│             │             │             │          │
│ Explora     │ Busca       │ Solicita    │ Ofertas  │
│ tours       │ hoteles     │ un taxi     │ especia  │
│ disponib    │ y posadas   │             │ les      │
└─────────────┴─────────────┴─────────────┴──────────┘

┌─────────────┬─────────────┬─────────────┬──────────┐
│ 🛍️ MARKET   │ 🗺️ MAPA     │ 🍽️ RESTAUR  │ 📅 PLAN  │
│             │             │             │          │
│ Compras     │ Descubre    │ Encuentra   │ Planifica│
│ locales     │ la isla     │ dónde comer │ tu viaje │
└─────────────┴─────────────┴─────────────┴──────────┘

┌─────────────┬─────────────┬──────────────────────┐
│ 💰 CARTERA  │ 👤 PERFIL   │                      │
│             │             │                      │
│ Gestiona    │ Información │                      │
│ tu dinero   │ personal    │                      │
└─────────────┴─────────────┴──────────────────────┘

┌─────────────────────────────────────────────────────┐
│  ℹ️ Panel Unificado                                 │
│                                                     │
│  Accede a todas tus funcionalidades desde aquí.    │
│  El panel se adapta automáticamente según tu rol   │
│  y te muestra solo las opciones disponibles.       │
└─────────────────────────────────────────────────────┘
```

## 👥 Vistas Específicas por Rol

### 🧑‍🚀 TURISTA - 11 Opciones

```
EXPLORA         TOURS           ALOJAMIENTOS    TRANSPORTE
Inicio          Busca tours     Reserva hoteles Solicita taxi
(Home)

PAQUETES        MARKETPLACE     MAPA INTERAC.   RESTAURANTES
Ofertas espec.  Compras locales Descubre isla   Lugares comer

MI ITINERARIO   CARTERA         MI PERFIL
Planifica viaje Gestiona dinero Datos personales
```

### 🤝 SOCIO/ALIADO/OPERADOR - 8 Opciones

```
DASHBOARD       OPERACIONES     MIS SERVICIOS   CREAR SERVICIO
Resumen negoc.  Gestiona ops    Tours propios   Nuevo tour/exper

ALOJAMIENTOS    RESERVAS        SCANNER         CARTERA
Gestiona hoteles Tus reservas   Check-in        Tus ganancias
```

### 🎤 ARTISTA - 9 Opciones (Socio + Caribbean Night)

```
DASHBOARD       OPERACIONES     MIS SERVICIOS   CREAR SERVICIO
Resumen negoc.  Gestiona ops    Tours propios   Nuevo tour/exper

ALOJAMIENTOS    RESERVAS        SCANNER         CARTERA
Gestiona hoteles Tus reservas   Check-in        Tus ganancias

CARIBBEAN NIGHT
Eventos musicales y presentaciones
```

### 👑 SUPER ADMIN - 11 Opciones

```
DASHBOARD       APROBACIONES    RESERVAS        USUARIOS
Panel control   Pendientes (12) Todas reserv.   Gestión usuarios

SERVICIOS       FINANZAS        CARIBBEAN       ARTISTAS
Tours y serv.   Reportes finan. Gestión evts.   Gestión artistas

SOCIOS          BACKEND         TAREAS
Gestión socios  Mapa estructura Gestión tareas
```

---

## 🎨 Paleta de Colores

Cada categoría tiene su propio degradado:

| Categoría | Color Degradado | Uso |
|-----------|-----------------|-----|
| Home | Blue-500 to Blue-600 | Inicio |
| Tours | Emerald-500 to Emerald-600 | Experiencias |
| Hotels | Orange-500 to Orange-600 | Alojamiento |
| Taxi | Yellow-500 to Yellow-600 | Transporte |
| Packages | Purple-500 to Purple-600 | Paquetes |
| Marketplace | Pink-500 to Pink-600 | Compras |
| Map | Cyan-500 to Cyan-600 | Exploración |
| Restaurants | Red-500 to Red-600 | Comida |
| Itinerary | Indigo-500 to Indigo-600 | Planificación |
| Wallet | Green-500 to Green-600 | Dinero |
| Profile | Gray-500 to Gray-600 | Datos |

---

## 📲 Responsividad

### Mobile (< 768px)
- **Grid**: 2 columnas
- **Card Size**: Medio
- **Spacing**: Compacto
- **Font**: Pequeño

### Tablet (768px - 1024px)
- **Grid**: 3 columnas
- **Card Size**: Grande
- **Spacing**: Moderado
- **Font**: Mediano

### Desktop (> 1024px)
- **Grid**: 4 columnas
- **Card Size**: Grande
- **Spacing**: Amplio
- **Font**: Normal

---

## 🎯 Interacciones

### Hover Effect (Desktop)
```
Antes: Card normal, sombra media
↓
Click/Hover: Scale 105%, sombra aumentada
↓
Después de click: Navega a la sección
```

### Mobile
```
Card con opacidad normal
↓
Click: Scale 95% (presión), cambio color
↓
Release: Navigate
```

---

## 🔔 Badges y Notificaciones

Algunas tarjetas pueden mostrar badges (por ejemplo, número de solicitudes pendientes):

```
┌─────────────────┐
│ 12  ← Badge     │
│   ✅            │
│                 │
│ APROBACIONES    │
│ Solicitudes     │
│ pendientes      │
└─────────────────┘
```

**Casos de uso:**
- `[12]` - Aprobaciones pendientes (Admin)
- `[5]` - Nuevas reservas
- `[NEW]` - Nuevas funcionalidades
- `[!]` - Alertas importantes

---

## 🚀 Flujo de Navegación

### Entrada al Panel
```
Home / Nav / Perfil
    ↓
Click "Panel" o botón grid
    ↓
Show UnifiedPanel
    ↓
Cargar roles y opciones
```

### Salida del Panel
```
Click en opción
    ↓
onNavigate(route)
    ↓
Ir a sección seleccionada
    ↓
Nav back si es necesario
```

---

## 💾 Persistencia de Estado

- **Rol del usuario**: Viene de App.tsx (userRole)
- **Autenticación**: Viene de isAuthenticated prop
- **Último acceso**: Se puede guardar en localStorage
- **Favoritos**: Futuro: personalizar orden de items

---

## 🔐 Seguridad

- ✅ Solo muestra opciones disponibles para el rol
- ✅ Los botones inactivos se desactivan si sin permisos
- ✅ Validación de rutas en App.tsx
- ✅ Control de acceso en cada página destino

---

## 📊 Estadísticas Esperadas

**Para TURISTA:**
- 11 opciones principales
- ~35% de uso esperado en el Panel
- Acceso principalmente a Tours, Hotels, Itinerary

**Para SOCIO:**
- 8 opciones principales
- ~60% de uso esperado (control de servicios)
- Acceso principalmente a Dashboard, Servicios, Reservas

**Para ADMIN:**
- 11 opciones principales
- ~80% de uso esperado (todas las funciones)
- Acceso a todas las secciones de control

---

## 🎓 Guía de Usuario

### Para Turista
> "El Panel te muestra todo lo que puedes hacer en la app. Busca Tours, Hoteles, Planifica tu viaje, todo en un solo lugar."

### Para Socio
> "Desde aquí controlas tu negocio: crea servicios, gestiona reservas, atiende check-ins, revisa ganancias."

### Para Admin
> "Supervisa la app desde aquí: aprueba solicitudes, revisa financiero, gestiona usuarios y servicios."

---

**Última actualización**: 17 de Enero 2026
**Estado**: ✅ Implementado y Listo para Usar
**Version**: 1.0
