# 🏗️ GuanaGO - Arquitectura del Proyecto

> Última actualización: Enero 2026

---

## 📋 Resumen

GuanaGO es una aplicación turística para San Andrés Isla que combina:
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express (desplegado en Render)
- **Base de datos**: Airtable (conexión directa)
- **IA**: Groq AI para chatbot con contexto de servicios
- **Mapas**: Mapbox GL

---

## 🔌 Integraciones Principales

### 1. Airtable (Base de Datos Principal)
**Servicio**: `services/airtableService.ts`

| Tabla | Uso |
|-------|-----|
| `Directorio_Mapa` | Puntos del directorio (restaurantes, hoteles, etc.) |
| `ServiciosTuristicos_SAI` | Tours, hoteles, paquetes turísticos |
| `Rimm_musicos` | Artistas de Caribbean Night / RIMM |
| `Leads` | Prospectos y contactos |

**Funciones disponibles:**
```typescript
import { airtableService } from './services/airtableService';

// Directorio
await airtableService.getDirectoryPoints();

// Servicios turísticos
await airtableService.getServices();      // Todos
await airtableService.getTours();         // Solo tours
await airtableService.getHotels();        // Solo hoteles
await airtableService.getPackages();      // Solo paquetes

// RIMM Caribbean Night
await airtableService.getArtists();       // Artistas de Rimm_musicos

// Leads
await airtableService.createLead({ nombre, email, telefono, mensaje });
```

### 2. Groq AI (Chatbot)
**Servicio**: `services/chatService.ts`

El chatbot GuanAI:
- Usa modelo `llama-3.3-70b-versatile` de Groq
- Carga contexto de tours y directorio desde Airtable
- Responde sobre servicios, precios, horarios de San Andrés

```typescript
import { sendChatMessage } from './services/chatService';

const response = await sendChatMessage('¿Qué tours hay disponibles?', historial);
```

### 3. Mapbox (Mapas)
**Componentes**: `DirectoryMapbox.tsx`, `TaxiZonesMapbox.tsx`, `SanAndresMap.tsx`

Muestra puntos del directorio, zonas de taxi y mapa interactivo.

---

## 📁 Estructura del Proyecto

```
GuanaGo-App-Enero-main/
├── 📄 App.tsx                    # Router principal
├── 📄 index.tsx                  # Entry point
├── 📄 types.ts                   # Interfaces TypeScript
├── 📄 constants.tsx              # Datos mock/constantes
│
├── 📁 services/                  # Servicios de datos
│   ├── airtableService.ts        # ⭐ Conexión directa Airtable
│   ├── api.ts                    # API general + fallbacks
│   ├── cachedApi.ts              # Cache de datos
│   ├── chatService.ts            # ⭐ Chatbot con Groq AI
│   └── cacheService.ts           # Utilidades de cache
│
├── 📁 components/                # Componentes reutilizables
│   ├── CaribbeanNightSection.tsx # Sección RIMM/artistas
│   ├── GuanaChatbot.tsx          # Chatbot UI
│   ├── DirectoryMapbox.tsx       # Mapa del directorio
│   └── ...
│
├── 📁 pages/                     # Páginas principales
│   ├── Home.tsx                  # Inicio
│   ├── InteractiveMap.tsx        # Mapa interactivo
│   ├── TourList.tsx              # Lista de tours
│   ├── Taxi.tsx                  # Cotizador de taxis
│   └── admin/                    # Panel admin
│
├── 📁 backend/                   # Backend Express (Render)
│   ├── controllers/              # Lógica de endpoints
│   ├── routes/                   # Definición de rutas
│   ├── middleware/               # Auth, logging, errores
│   └── config.js                 # Configuración
│
└── 📄 server.js                  # Entry point backend
```

---

## ⚙️ Variables de Entorno

### Desarrollo Local (.env)
```env
# Groq AI
VITE_GROQ_API_KEY=gsk_xxx...

# Mapbox
VITE_MAPBOX_API_KEY=pk.eyJ1...

# Airtable (conexión directa)
AIRTABLE_API_KEY=pat_TU_TOKEN_AQUI
VITE_AIRTABLE_BASE_ID=appiReH...

# Make.com Webhooks (legacy, algunos endpoints)
MAKE_WEBHOOK_USERS=https://hook.us1.make.com/...
MAKE_WEBHOOK_DIRECTORY=https://hook.us1.make.com/...
MAKE_WEBHOOK_SERVICES=https://hook.us1.make.com/...
```

### Producción (Render)
Las mismas variables se configuran en el dashboard de Render como Environment Variables.

⚠️ **IMPORTANTE**: El archivo `.env` NO se sube a GitHub (está en .gitignore)

---

## 🚀 Desarrollo Local

### Iniciar el frontend
```bash
npm run dev
```
Abre: http://localhost:5173

### Iniciar el backend
```bash
npm run dev:server
```
Abre: http://localhost:5000

### Iniciar ambos
```bash
npm run dev:all
```

---

## 🌐 Producción (Render)

- **URL**: https://guanago-app.onrender.com
- **Backend**: https://guanago-backend.onrender.com
- **Deploy**: Automático al hacer push a `master`

---

## 📊 Tablas Airtable Requeridas

### Directorio_Mapa
| Campo | Tipo | Descripción |
|-------|------|-------------|
| Nombre | Text | Nombre del lugar |
| Categoria | Select | restaurant, hotel, tour, etc. |
| Latitud | Number | Coordenada |
| Longitud | Number | Coordenada |
| Telefono | Phone | Contacto |
| Direccion | Text | Dirección física |
| Imagen | Attachment | Foto del lugar |

### ServiciosTuristicos_SAI
| Campo | Tipo | Descripción |
|-------|------|-------------|
| Servicio | Text | Nombre del servicio |
| Tipo de Servicio | Select | Tour, Hotel, Paquete |
| Precio | Currency | Precio en COP |
| Descripcion | Long text | Detalle del servicio |
| Imagen | Attachment | Fotos |
| Ubicacion | Select | San Andres, Providencia |
| Publicado | Checkbox | Si está activo |

### Rimm_musicos
| Campo | Tipo | Descripción |
|-------|------|-------------|
| Nombre | Text | Nombre del artista |
| Genero | Text | Género musical |
| Bio | Long text | Biografía |
| Imagen | Attachment | Foto |
| Spotify | URL | Link Spotify |
| Instagram | URL | Link Instagram |
| Activo | Checkbox | Si está activo |

---

## 🎯 Flujo de Datos

```
┌─────────────┐     ┌──────────────┐     ┌───────────┐
│   Usuario   │────▶│   Frontend   │────▶│  Airtable │
│   (React)   │     │   (Vite)     │     │  (Datos)  │
└─────────────┘     └──────────────┘     └───────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Groq AI    │
                    │  (Chatbot)   │
                    └──────────────┘
```

---

## 📝 Notas Importantes

1. **Airtable vs Make.com**: La mayoría de datos ahora vienen directo de Airtable. Make.com se usa solo para algunos endpoints legacy.

2. **Cache**: Los servicios implementan cache de 5 minutos para reducir llamadas a Airtable.

3. **Fallbacks**: Si Airtable falla, hay datos mock en `constants.tsx` y `api.ts`.

4. **Seguridad**: Las API keys tienen prefijo `VITE_` para ser accesibles en el frontend. En producción, considera mover operaciones sensibles al backend.
