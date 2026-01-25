# GuiaSAI B2B - Sistema de Cotización para Agencias

## 🎯 Propósito

GuiaSAI B2B es una plataforma de cotización especializada para agencias de viaje, operadores turísticos y mayoristas. Permite solicitar disponibilidad de **Tours, Alojamientos y Traslados** de forma simultánea, con confirmación en tiempo real de socios locales.

**URL de Producción**: `https://guiasanandresislas.com/agencias`  
**URL de Desarrollo**: `http://localhost:5173/guiasai-b2b`

---

## 📋 Características Principales

### 1. Sistema de 3 Módulos
- **Alojamientos**: Búsqueda por fechas, cantidad de huéspedes, tipo de habitación
- **Tours**: Selección de actividades con descripción, duración, precio
- **Traslados**: Transporte aeropuerto-hotel, hotel-hotel, custom routes

### 2. Flujo Unificado de Cotización
1. Usuario selecciona servicios en cada módulo
2. Sistema calcula total en tiempo real
3. Genera cotización con ID único
4. Envía solicitud a aliados correspondientes
5. Muestra estado de confirmación en tiempo real
6. Una vez todos confirman → Habilitado pago

### 3. Perfil del Usuario que Cotiza
- Nombre agencia / operador
- Email y teléfono
- Empresa registrada (RUT/NIT)
- Historial de cotizaciones
- Dashboard de presupuestos activos

---

## 🎨 Identidad Visual GuiaSAI

### Paleta de Colores
- **Primario**: `#FF6600` (Naranja vibrante)
- **Secundario**: `#2FA9B8` (Turquesa)
- **Neutro**: `#F5F5F5` (Gris claro)
- **Texto**: `#333333` (Gris oscuro)
- **Accent**: `#FFFFFF` (Blanco)

### Tipografía
- Headings: `Poppins Bold`
- Body: `Inter Regular`
- Buttons: `Poppins SemiBold`

---

## 📁 Estructura de Carpetas

```
guiasai-b2b/
├── src/
│   ├── components/
│   │   ├── NavigationBar.tsx         # Barra superior con menú
│   │   ├── QuotationSummary.tsx      # Resumen de cotización (Total)
│   │   ├── UserProfileModal.tsx      # Modal perfil usuario
│   │   ├── ConfirmationStatus.tsx    # Estado de confirmaciones (aliados)
│   │   ├── PaymentGateway.tsx        # Pasarela de pago (final)
│   │   └── sections/
│   │       ├── AccommodationSection.tsx
│   │       ├── ToursSection.tsx
│   │       └── TransportsSection.tsx
│   ├── pages/
│   │   ├── QuotationPage.tsx         # Página principal
│   │   └── HistoryPage.tsx           # Historial de cotizaciones
│   ├── services/
│   │   ├── quotationService.ts       # API calls para cotizaciones
│   │   ├── partnersService.ts        # API calls para aliados
│   │   └── paymentService.ts         # Integración Wompi/Stripe
│   ├── styles/
│   │   ├── guiasai-theme.css         # Colores y tema
│   │   ├── components.css            # Estilos reutilizables
│   │   └── responsive.css            # Media queries
│   ├── types/
│   │   ├── quotation.ts              # Tipos de cotización
│   │   ├── accommodation.ts
│   │   ├── tour.ts
│   │   └── transport.ts
│   ├── hooks/
│   │   ├── useQuotation.ts           # Lógica de cotización
│   │   ├── useUser.ts                # Perfil usuario
│   │   └── usePartnerStatus.ts       # Estado aliados
│   ├── App.tsx
│   └── main.tsx
├── public/
│   ├── images/
│   │   ├── guiasai-logo.svg
│   │   └── icons/
│   ├── icons/
│   │   ├── hotel.svg
│   │   ├── tour.svg
│   │   └── transport.svg
├── package.json
├── vite.config.ts
└── README.md
```

---

## 🚀 Flujo de Usuario

### Paso 1: Acceso
```
Usuario (Agencia) accede a
→ https://guiasanandresislas.com/agencias
→ Sistema verifica si tiene perfil
  ├─ Sí: Va a cotización
  └─ No: Muestra formulario de registro
```

### Paso 2: Cotización Multiservicio
```
[BARRA SUPERIOR]
┌─ GuiaSAI Logo | Alojamientos | Tours | Traslados | Perfil (usuario) ─┐
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [SECCIÓN ALOJAMIENTOS]                                              │
│  Fechas: [Check-in] [Check-out]                                      │
│  Huéspedes: [1-10]                                                   │
│  Tipo habitación: [Doble] [Triple] [Suite]                           │
│  Hoteles disponibles: (resultado dinámico)                           │
│  [+ Agregar Alojamiento]                                             │
│                                                                      │
│  [SECCIÓN TOURS]                                                     │
│  Selecciona tours de interés:                                        │
│  ☐ Vuelta a la Isla Cultural                                        │
│  ☐ Snorkel + Manglares                                              │
│  ☐ Caribbean Night Experience                                       │
│  ☐ Eco-Adventure Day                                                │
│  [+ Agregar Tour]                                                    │
│                                                                      │
│  [SECCIÓN TRASLADOS]                                                 │
│  Tipo: [Aeropuerto-Hotel] [Hotel-Hotel] [Custom]                    │
│  Cantidad vehículos: [1-5]                                           │
│  Tipo vehículo: [Minivan] [Carro] [Lancha]                          │
│  [+ Agregar Traslado]                                                │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│ RESUMEN DE COTIZACIÓN                                                │
│ ─────────────────────────────────────────────────────────            │
│ Alojamientos x 3 noches:        $1,500,000 COP                       │
│ Tours (2 servicios):              $300,000 COP                       │
│ Traslados:                         $150,000 COP                      │
│ ─────────────────────────────────────────────────────────            │
│ TOTAL COTIZACIÓN:               $1,950,000 COP                       │
│ ─────────────────────────────────────────────────────────            │
│ [CONFIRMAR SOLICITUD]           [LIMPIAR FORMULARIO]                 │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Paso 3: Estado de Confirmación
```
Después de [CONFIRMAR SOLICITUD]:

┌─ ESTADO DE SOLICITUD: #QT-20260120-0047 ─────────────────────────┐
│                                                                   │
│ Estado General: ⏳ EN ESPERA DE CONFIRMACIÓN (2 horas max)         │
│                                                                   │
│ ✓ Alojamientos:                                                   │
│   Hotel Las Palmeras: ✓ Confirmado                               │
│   Precio final: $500,000/noche                                    │
│                                                                   │
│ ⏳ Tours:                                                          │
│   Vuelta a la Isla: ⏳ Esperando confirmación (45 min)             │
│   Snorkel + Manglares: ⏳ Esperando confirmación (1h 15m)          │
│                                                                   │
│ ✗ Traslados:                                                      │
│   Coop Taxis: ✗ Taxi 1 no disponible (alternativa sugerida)       │
│   Lancha privada: ✓ Confirmado                                   │
│                                                                   │
│ Renovar total:  [REVISAR CAMBIOS] [SOLICITAR ALTERNATIVAS]        │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

### Paso 4: Pago (una vez confirmado todo)
```
BOTÓN DISPONIBLE [IR A PAGO]

→ Genera link de pago (Wompi/Stripe)
→ Usuario paga online
→ Sistema genera voucher con QR
→ Confirmación a aliados
```

---

## 🔌 Integraciones Necesarias

### Backend (Make/Node.js)
- **API Airtable**: Lectura de alojamientos, tours, traslados
- **API Wompi/Stripe**: Procesamiento de pagos
- **WhatsApp API**: Notificaciones a aliados
- **Email**: Confirmaciones

### Flujo de Datos
```
GuiaSAI B2B (Frontend)
    ↓
Backend Node.js + Express
    ├→ Airtable (inventario)
    ├→ Make (orquestación)
    ├→ WhatsApp (notificaciones aliados)
    ├→ Wompi (pagos)
    └→ Database (historial cotizaciones)
```

---

## 📋 Especificaciones Técnicas

### Tecnologías
- **Frontend**: React 19 + TypeScript + Vite
- **Estilos**: CSS3 + Tailwind (personalizado con colores GuiaSAI)
- **Estado**: Context API / Zustand
- **HTTP**: Axios
- **Pagos**: Wompi SDK / Stripe.js

### Requisitos No-Funcionales
- **Performance**: < 2s load time
- **Responsividad**: Mobile first (iPhone 12 como referencia)
- **Accesibilidad**: WCAG 2.1 AA
- **Seguridad**: HTTPS, validación server-side, rate limiting

---

## 🛠️ Instalación y Setup

```bash
# Clonar repositorio
git clone https://github.com/skystephens/GuanaGo-App-v2.git
cd GuanaGo-App-Enero-main/guiasai-b2b

# Instalar dependencias
npm install

# Variables de entorno (.env.local)
VITE_API_URL=http://localhost:3001/api
VITE_AIRTABLE_KEY=xxxxx
VITE_WOMPI_KEY=xxxxx
VITE_AGENCIA_API=http://localhost:3001/api/agencias

# Desarrollo
npm run dev

# Build producción
npm run build

# Deploy a WordPress
npm run build:wordpress
# Coloca dist/ en: /wp-content/plugins/guiasai-agencias/
```

---

## 📊 Integración en WordPress (/agencias)

### Ubicación en WordPress
```
/wp-content/plugins/guiasai-agencias/
├── guiasai-agencias.php (plugin main)
├── dist/
│   ├── index.html
│   ├── main.js
│   └── styles.css
└── README.md
```

### Plugin PHP Minimal
```php
<?php
/*
Plugin Name: GuiaSAI Agencias
Description: Sistema de cotización B2B para agencias de viaje
Version: 1.0.0
Author: Sky Stephens
*/

add_shortcode('guiasai_quotation', function() {
    wp_enqueue_style('guiasai-style', plugin_dir_url(__FILE__) . 'dist/style.css');
    wp_enqueue_script('guiasai-script', plugin_dir_url(__FILE__) . 'dist/main.js', [], '1.0.0', true);
    
    return '<div id="guiasai-app"></div>';
});
?>
```

### .htaccess para ruteo
```
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ /agencias/index.html [QSA,L]
</IfModule>
```

---

## 🎯 Roadmap de Desarrollo

### Fase 1 (Enero-Febrero 2026)
- ✅ Estructura inicial
- 🔨 Componentes UI base
- 🔨 Integración API Airtable
- 🔨 Sistema de cotización

### Fase 2 (Marzo 2026)
- Confirmación en tiempo real
- Dashboard estado aliados
- Notificaciones WhatsApp
- Sistema de pagos

### Fase 3 (Abril 2026 - Pre ANATO)
- Optimización performance
- Testing exhaustivo
- Integración WordPress final
- Materiales de marketing

---

## 📞 Contacto y Soporte

**Sky Stephens** - CEO & Fundador  
Email: sky@guiasanandresislas.com  
WhatsApp: [Tu número]

---

**Última actualización**: 20 de Enero, 2026  
**Versión**: 1.0 - Setup Inicial
