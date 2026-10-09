# 📊 GuanaGO - Estado del Proyecto Enero 2026

> Documento actualizado: 17 de Enero 2026  
> Versión: 2.1.0  
> Status General: 🟢 Operativo con mejoras activas
> 
> **🆕 ÚLTIMA ACTUALIZACIÓN**: Implementación de flujo de aprobación condicional
> - ✅ Hoteles siempre requieren aprobación
> - ✅ Tours/Traslados aprobación basada en campo Airtable
> - ✅ Checkout actualizado con lógica condicional
> - Ver: [APPROVAL_FLOW_IMPLEMENTATION.md](APPROVAL_FLOW_IMPLEMENTATION.md)

---

## 🎯 Objetivo General

GuanaGO es una **plataforma turística integral para San Andrés Isla** que combina:
- 🌐 **Frontend Web/PWA**: React + TypeScript + Tailwind
- 🔌 **Backend API**: Node.js + Express (Render)
- 📊 **Base de Datos**: Airtable (conexión directa)
- 🤖 **IA**: Groq + Gemini (futuro copilot)
- 🗺️ **Mapas**: Mapbox GL
- ⛓️ **Blockchain**: Hedera (artistas/NFTs)

---

## 📋 Estado Actual de Módulos

### ✅ COMPLETADO - Módulo Turista

| Funcionalidad | Estado | Detalles |
|---------------|--------|----------|
| Home/Exploración | ✅ | Listados de tours, hoteles, taxis, paquetes |
| Mapa Interactivo | ✅ | Mapbox con POIs del directorio |
| Planificador de Itinerarios | ✅ | Builder dinámico de experiencias |
| Carrito de Compras | ✅ | Sistema con Context API |
| Checkout | ✅ | Selección de métodos de pago |
| GUANA Points | ✅ | Sistema de puntos del usuario |
| Wallet | ✅ | Consulta de saldo y transacciones |
| Chatbot | ✅ | GuanaIA con Groq (básico) |

### ✅ COMPLETADO - Módulo Partner/Socio

| Funcionalidad | Estado | Detalles |
|---------------|--------|----------|
| Dashboard Partner | ✅ | Vista de reservas y disponibilidad |
| Gestión de Reservas | ✅ | CRUD de reservas propias |
| Scanner QR | ✅ | Validación de cupones |
| Wallet Partner | ✅ | Caja/balance de operaciones |
| Crear Servicios | ✅ | Form para agregar experiencias |

### ✅ COMPLETADO - Módulo Admin

| Funcionalidad | Estado | Detalles |
|---------------|--------|----------|
| Dashboard Admin | ✅ | KPIs y estadísticas generales |
| Login con PIN | ✅ | Validación contra tabla Usuarios_Admins |
| Panel Sincronización | ✅ | Backend - sincroniza Airtable en tiempo real |
| Gestión de Socios | ✅ | CRUD de partners |
| Gestión Financiera | ✅ | Reportes de pagos y transacciones |
| Panel de Tareas | ✅ | To-do con estados y prioridades |

### 🔄 EN PROGRESO - Módulo Artistas/RIMM

| Funcionalidad | Estado | Detalles |
|---------------|--------|----------|
| Portal de Artista | ⏳ | Estructura base creada |
| Gestión de Portafolio | ⏳ | Crear/editar trabajos artísticos |
| NFT Minting | 🚫 | Pendiente Hedera SDK |
| Carrera de NFTs | 🚫 | Pendiente integración blockchain |

### 🚫 PENDIENTE - Integraciones Externas

| Servicio | Prioridad | Estado | Próximos Pasos |
|----------|-----------|--------|-----------------|
| **Make.com + IA** | 🔴 ALTA | Bloqueado | Crear escenarios para chatbot inteligente |
| **Hedera Blockchain** | 🟡 MEDIA | Bloqueado | Configurar testnet + SDK |
| **Pasarela Pagos** | 🔴 ALTA | Bloqueado | Integrar Wompi/ePayco |
| **Notificaciones** | 🟡 MEDIA | Bloqueado | Push, SMS, email |
| **Autenticación OAuth** | 🟡 MEDIA | Bloqueado | Google, Apple Sign-in |

---

## 📁 Archivos Clave Documentación

```
📄 README.md                          → Inicio rápido, estructura
📄 ARQUITECTURA.md                    → Diseño técnico, integraciones
📄 ARCHITECTURE_MAP.md                → Mapeo visual de componentes
📄 RIMM_NFT_STRATEGY.md              → Estrategia artistas/blockchain
📄 TODO_ADMIN_LOGIN.md               → Tareas de seguridad admin
📄 Pagos.md                          → Métodos de pago
📄 Kriol Creole.md                   → Localización idioma
```

---

## 🚀 Tareas Prioritarias Actuales (Q1 2026)

### 🔴 CRÍTICAS (Esta Semana)

1. **Copilot IA (Make.com + Groq/Gemini)** ← **TÚ ESTÁS AQUÍ**
   - [ ] Crear escenarios en Make.com
   - [ ] Integrar prompts de atención al cliente
   - [ ] Conectar endpoint `/api/copilot/message`
   - [ ] Pruebas con usuarios piloto

2. **Panel Sincronización Airtable**
   - [x] Backend completado
   - [x] UI completada
   - [ ] Testing en Render
   - [ ] Documentar procedimientos

### 🟡 ALTAS (Este Mes)

3. **Integración Pasarela Pagos**
   - [ ] Configurar Wompi/ePayco
   - [ ] Implementar pago en checkout
   - [ ] Testing de transacciones reales

4. **Sistema Notificaciones**
   - [ ] Emails transaccionales
   - [ ] SMS para reservas
   - [ ] Push notifications web

5. **Artistas/NFTs Fase 2**
   - [ ] Crear tablas Airtable (Artistas_Portafolio, etc)
   - [ ] Onboarding 3-5 artistas piloto
   - [ ] Contenido demo en IPFS

### 🟢 MEDIAS (Próximas 2 Semanas)

6. **Autenticación Mejorada**
   - [ ] Google Sign-in
   - [ ] Apple Sign-in
   - [ ] Biometría (futuro)

6b. **Autenticación Admin PIN** ✅ IMPLEMENTADO
   - [x] Login PIN con validación Airtable
   - [x] Sesión persistente (8 horas)
   - [x] Limite de intentos (5)
   - [x] UI/UX mejorada con modal
   - [x] Integración en AccountDashboard
   - [x] AdminBackend protegido
   - **Referencia**: [FIXES_ADMIN_AUTH_v2.md](FIXES_ADMIN_AUTH_v2.md)

7. **Optimización Performance & Cache**
   - [ ] Code splitting bundles grandes
   - [ ] Lazy loading componentes
   - [ ] **PWA Cache (Service Worker)** para imágenes offline
   - [ ] Compression de imágenes

---

## 📷 Sistema de Imágenes con PWA Cache

### Status Actual
- **Imágenes**: Descargadas desde Airtable `ServiciosTuristicos_SAI`
- **Problema**: Sin conexión no funcionan, cargas lentas después de la primera

### Solución Propuesta: PWA Cache (Opción C)

#### ¿Cómo Funciona?
El Service Worker (software que corre en background) automáticamente:
1. Intercepta solicitudes de imágenes
2. Verifica si ya están cacheadas
3. Si sí → Devuelve del cache (200ms) ⚡
4. Si no → Descarga de Airtable + guarda en cache

```
Solicitud de imagen
    ↓
¿Está en cache?
├─ SÍ → Devolver al instante (200ms) ⚡
└─ NO → Descargar + cachear + devolver (2-3s)
```

#### Impacto en Rendimiento

| Escenario | Sin Cache | Con PWA Cache | Mejora |
|-----------|-----------|---------------|--------|
| **1ª carga turista** | 4-7s | 4-7s | 0% (igual) |
| **2ª+ cargas** | 4-7s | 0.2s | **95%** ⚡ |
| **SIN INTERNET** | ❌ No funciona | ✅ Funciona 100% | 🟢 |
| **Datos/mes** | 150MB | 20MB | **87%** menos |
| **Batería** | Normal | Mejor | 30% ahorro |

#### Almacenamiento de Imágenes

**¿Dónde se guardan?**
- Navegador local (Cache Storage API)
- No es un archivo visible
- Automáticamente manejado por el navegador

**¿Cuánto espacio?**
- Límite: 50MB por dominio
- GuanaGO necesita: ~20MB (100 tours × 200KB)
- ✅ Cómodo dentro del límite

**¿Dónde físicamente?**
- **Windows**: `C:\Users\[usuario]\AppData\Local\Chrome\...`
- **Mac**: `~/Library/Application Support/Chrome/...`
- **Móvil**: `/data/data/com.android.chrome/...`
- Usuario NO ve esto directamente (navegador lo maneja)

#### Actualización Automática de Cache

El cache se actualiza automáticamente:
- Cada vez que se abre la app (si hay conexión)
- Máximo una vez cada 24 horas
- Si hay cambios en Airtable, se reflejan en la siguiente sesión

#### Compatibilidad

| Navegador | Soporte | Nivel |
|-----------|---------|-------|
| Chrome/Edge | ✅ Completo | Nativo |
| Firefox | ✅ Completo | Nativo |
| Safari (iOS 14+) | ✅ Completo | Nativo |
| Samsung Internet | ✅ Completo | Nativo |

### Implementación Roadmap

**Fase 1 (Próxima semana): Setup básico**
- [ ] Mejorar service worker
- [ ] Cachear imágenes automáticamente
- [ ] Testing offline

**Fase 2 (Mes 2): Optimizaciones**
- [ ] Sincronización de caché en background
- [ ] Indicador de estado de cache
- [ ] Limpiar cache antiguo

**Fase 3 (Mes 3): Avanzado**
- [ ] Precarga de imágenes por categoría
- [ ] Compresión de imágenes en client
- [ ] Estadísticas de uso de cache

---

## 🏗️ Estructura de Código

### Frontend (`src/`)
```
src/
├── pages/                 # Páginas por rol (turista, partner, admin)
│   ├── admin/            # Panel administrativo
│   ├── partner/          # Panel de socio operador
│   └── ...
├── components/           # Componentes reutilizables
│   ├── GuanaChatbot.tsx  # Chatbot con IA
│   ├── Navigation.tsx    # Menú inferior
│   └── ...
├── services/             # Servicios de API
│   ├── airtableService.ts    # Conexión Airtable
│   ├── chatService.ts        # ⭐ Integración Groq
│   ├── cachedApi.ts         # Cache local
│   └── ...
├── context/              # Context API (Cart, etc)
├── types.ts              # Interfaces TypeScript
└── constants.tsx         # Datos mock/constantes
```

### Backend (`backend/`)
```
backend/
├── routes/               # Endpoints API
│   ├── auth.js
│   ├── chatbot.js        # ⭐ Ruta chatbot
│   ├── services.js
│   └── ...
├── controllers/          # Lógica de negocio
├── middleware/           # Auth, logging, errores
└── README.md             # Documentación API
```

---

## 🔐 Variables de Entorno Requeridas

### Frontend (`.env.local`)
```bash
VITE_API_URL=https://guana-go-app.onrender.com
AIRTABLE_API_KEY=pat_...
VITE_AIRTABLE_BASE_ID=appi...
VITE_MAPBOX_API_KEY=pk_...
VITE_GEMINI_API_KEY=AIzaSy...    # Nuevo
VITE_GROQ_API_KEY=gsk_...         # Nuevo
```

### Backend (`.env`)
```bash
NODE_ENV=production
AIRTABLE_API_KEY=pat_...
AIRTABLE_BASE_ID=appi...
GEMINI_API_KEY=AIzaSy...
GROQ_API_KEY=gsk_...
MAKE_WEBHOOK_URL=https://hook.make.com/...
```

---

## 📊 Base de Datos (Airtable)

### Tablas Principales

| Tabla | Registros | Uso |
|-------|-----------|-----|
| `Directorio_Mapa` | ~150+ | Restaurantes, hoteles, POIs |
| `ServiciosTuristicos_SAI` | ~80+ | Tours, paquetes, experiencias |
| `Rimm_musicos` | ~20+ | Artistas Caribbean Night |
| `Leads` | ~500+ | Usuarios registrados |
| `Usuarios_Admins` | ~5 | Administradores |
| `Pagos` | ~100+ | Historial de transacciones |
| `Reservas` | ~200+ | Booking de servicios |
| `GUANA_Transacciones` | ~1000+ | Historial de puntos |

### Tablas Futuras (Fase RIMM/Blockchain)

- `Artistas_Portafolio` - Perfiles de artistas
- `Productos_Artista` - Trabajos/NFTs
- `Ventas_Artista` - Transacciones

---

## 🚢 Deployment

### Frontend
- **URL**: https://guana-go-app.onrender.com
- **Platform**: Render Web Service
- **Build**: `npm run build` (Vite)
- **Start**: `npm start` (Express + dist estático)

### Backend (Integrado)
- **API Endpoint**: `/api/*`
- **Sincronización**: A petición o automática
- **Base de Datos**: Airtable (conexión directa)

---

## 📞 Contactos y Recursos

| Recurso | Enlace |
|---------|--------|
| Airtable Base | [appiReH55Qhrbv4Lk](https://airtable.com) |
| Render Dashboard | [dashboard.render.com](https://dashboard.render.com) |
| Mapbox | [mapbox.com/account](https://mapbox.com/account) |
| Groq API | [console.groq.com](https://console.groq.com) |
| Google Gemini | [ai.google.dev](https://ai.google.dev) |
| Make.com | [make.com](https://make.com) |

---

## 🎓 Próximos Pasos Recomendados

1. ✅ **Hoy**: Revisar este documento + RIMM_NFT_STRATEGY.md
2. ⏳ **Mañana**: Crear escenarios Make para copilot IA
3. ⏳ **Esta Semana**: Integrar Groq/Gemini en chat
4. ⏳ **Próxima Semana**: Testing en Render y usuarios piloto

---

**Mantén este documento actualizado conforme avances. Es tu mapa de ruta. 🗺️**
