# 📱 Panel Unificado - Guía de Uso

## 🎯 Descripción General

El **Panel Unificado** es un hub centralizado de navegación que agrupa todas las funcionalidades de la aplicación según el rol del usuario. En lugar de depender solo de la barra de navegación inferior, los usuarios pueden acceder a un panel completo con todas sus opciones disponibles de forma clara y organizada.

## 🔑 Características Principales

### ✅ Panel Adaptativo por Rol
El panel mostrará diferentes opciones según el rol del usuario:

#### 🧑‍🚀 **TURISTA**
- ✈️ Explora (Home)
- 🎫 Tours
- 🏨 Alojamientos
- 🚕 Transporte
- 📦 Paquetes
- 🛍️ Marketplace
- 🗺️ Mapa Interactivo
- 🍽️ Restaurantes
- 📅 Mi Itinerario
- 💰 Cartera
- 👤 Mi Perfil

#### 🤝 **SOCIO / ALIADO / OPERADOR**
- 📊 Dashboard (Resumen de negocio)
- ⚙️ Operaciones
- 📦 Mis Servicios
- ➕ Crear Nuevo Servicio
- 🏨 Alojamientos
- 📅 Reservas
- 📱 Check-in Scanner
- 💳 Cartera (Ganancias)

#### 🎤 **ARTISTA**
- 📊 Dashboard
- ⚙️ Operaciones
- 📦 Mis Servicios
- ➕ Crear Servicio
- 🏨 Alojamientos
- 📅 Reservas
- 📱 Check-in Scanner
- 💳 Cartera
- 🎵 Caribbean Night (Eventos Musicales)

#### 👑 **SUPER ADMIN**
- 📊 Dashboard
- ✅ Aprobaciones (Solicitudes pendientes)
- 📅 Reservas (Todas las reservaciones)
- 👥 Usuarios
- 📦 Servicios
- 💰 Finanzas
- 🎵 Caribbean Night
- 🎤 Artistas
- 🤝 Socios
- 🏗️ Backend (Mapa de estructura)
- ✓ Tareas

## 🎨 Diseño Visual

### Layout
- **Grid Responsivo**: 2 columnas en móvil, 3 en tablet, 4 en desktop
- **Tarjetas Interactivas**: Cada opción es una tarjeta con:
  - Icono colorido
  - Nombre de la opción
  - Descripción breve
  - Badge (si aplica, como notificaciones)

### Colores y Estilos
- **Degradados únicos**: Cada categoría tiene su propio color
- **Hover Effects**: Escala aumentada y sombra mejorada
- **Animaciones Suaves**: Transiciones de 300ms

### Ejemplo de Tarjeta
```
┌─────────────────┐
│   🎫           │ ← Icono en fondo translúcido
│                │
│   TOURS        │ ← Título
│ Explora tours  │ ← Descripción
│ disponibles    │
└─────────────────┘
```

## 🚀 Cómo Acceder al Panel

### Opción 1: Desde el Menu de Navegación (PRÓXIMA MEJORA)
Se agregará un botón "Panel" en la barra de navegación inferior para acceso rápido.

### Opción 2: Desde el Home
En el home habrá un botón "Mi Panel" que llevará al Panel Unificado.

### Opción 3: Desde el Perfil
En la sección de perfil hay un enlace al Panel.

## 💡 Beneficios

1. **Mejor UX**: No depender solo del espacio limitado de la barra inferior
2. **Escalabilidad**: Fácil de agregar nuevas funcionalidades sin saturar la UI
3. **Inclusión**: Todos los usuarios ven sus opciones disponibles de forma clara
4. **Navegación Intuitiva**: Estructura visual clara y jerarquía de información

## 🔧 Implementación Técnica

### Archivo: `components/UnifiedPanel.tsx`
```typescript
interface UnifiedPanelProps {
  userRole: UserRole;
  onNavigate: (route: AppRoute) => void;
  onBack: () => void;
  isAuthenticated: boolean;
  onLogout?: () => void;
}
```

### Usar en App.tsx
```tsx
case AppRoute.UNIFIED_PANEL: 
  return <UnifiedPanel 
    userRole={userRole} 
    onNavigate={navigateTo} 
    onBack={goBack} 
    isAuthenticated={isAuthenticated} 
    onLogout={handleLogout} 
  />;
```

### Acceso desde componentes
```tsx
// En cualquier componente
<button onClick={() => onNavigate(AppRoute.UNIFIED_PANEL)}>
  Mi Panel
</button>
```

## 📝 Ejemplos de Uso

### Para Turista
1. Usuario abre app
2. Hace click en "Mi Panel" (botón en home o nav)
3. Ve todas las opciones: Tours, Hotels, Mapa, etc
4. Selecciona la que quiere
5. Navega a esa sección

### Para Super Admin
1. Super Admin abre app
2. Accede al Panel
3. Ve dashboard, aprobaciones, reservas, finanzas, etc
4. Puede ver y aprobar solicitudes de una sola vista

## 🎯 Futuras Mejoras

- [ ] Agregar botón "Panel" en navigation.tsx
- [ ] Agregar acceso rápido en home.tsx
- [ ] Mostrar notificaciones/badges dinámicos (pendientes, nuevos, etc)
- [ ] Personalizar orden de items según preferencias del usuario
- [ ] Búsqueda rápida dentro del panel
- [ ] Shortcuts de teclado para acceso rápido

---

**Estado**: ✅ Implementado y listo para usar
**Ruta**: `AppRoute.UNIFIED_PANEL`
**Componente**: [UnifiedPanel.tsx](../components/UnifiedPanel.tsx)
