
# 🗺️ Guana Go: Arquitectura Técnica (V4.0 - Enero 2026)

Alianza Guana Go y Cluster de musica RIMM kriol myussik de san 
esto es soberanía cultural pura! Lo que planteas es convertir el talento de los artistas raizales en un Activo Digital Real. Ya no es solo música sonando en una noche de eventos; es una colección de activos que el turista se lleva en su Wallet y que financia directamente la industria local.Aquí tienes la hoja de ruta para integrar los NFTs del Clúster de Música RIMM en el ecosistema GuanaGO usando Hedera (HTS):1. El Concepto: "Vibrant Heritage NFTs"En lugar de ver el NFT como un "dibujo", lo planteamos como un Utility Token de Cultura.El Activo: Una pieza musical exclusiva, un video behind-the-scenes de la Caribbean Night o un arte digital del clúster.La Utilidad: Poseer el NFT da acceso a:Entrada VIP a la próxima Caribbean Night.Descuentos en Coco ART.Un porcentaje de "royalties sociales" o puntos $GUANA extra.2. Organización de la DB en Airtable (El Backend)Para que el proceso sea escalable, tu base de datos debe actuar como el "Puente de Metadatos". Necesitas una tabla llamada Colecciones_NFT:Campo AirtableTipo de DatoFunciónNombre_ColeccionTextoEj: "Caribbean Night - Live Stieg 2026"Artista_IDLink a ArtistasVincula al creador del clúster RIMM.IPFS_CIDTextoEl enlace descentralizado donde vive el audio/imagen.Token_ID_HederaTextoEl ID único una vez minteado en la red.Precio_GGONúmeroCosto en puntos o moneda local.Royalty_SocialPorcentajeCuánto recibe el artista por cada re-venta (Ej. 10%).3. Proceso de Minteo con Hedera Token Service (HTS)A diferencia de Ethereum, en Hedera el minteo es ultra barato ($1 USD aprox.) y muy rápido.Captura en la App: El artista sube su obra desde el portal B2B de GuanaGO.Almacenamiento: El archivo se sube a IPFS (usando servicios como Pinata o NFT.storage) para que sea eterno.Minteo: Tu backend de Node.js usa el SDK de Hedera para crear el NFT vinculado al IPFS CID.Vinculación: El TokenID se guarda en tu Airtable y aparece automáticamente en la sección "Novedades" de la App.4. El Modelo de Trabajo AliadoEste es el corazón de la alianza con el Clúster:Transparencia: El artista puede ver en tiempo real cuántas personas poseen su activo.Financiamiento: El 70% va al artista, 20% al Clúster RIMM (para nuevos eventos) y 10% a GuanaGO (mantenimiento de plataforma).Captura de Data: La App registra qué turistas compran qué géneros. Esta data es oro para el Secretario de Turismo: "Secretario, sabemos que el 60% de los europeos prefiere el Reggae Raizal; enfoquemos la promoción de verano en ese nicho".

necesito implementar una estrategia para ser ese apoyo tecnologico y de creacion de valor de artistas musicales que hacen parte del cluster pero que no tienen casi movimiento economico con su musica y no saben lo que es un nft o cripto y tendre que ser su apoyo y asesor, y recibir un % de cada elemento y asi tendre una coleccion de musica avalada por los mismos artistas, los cuales pueden vender sus servicios o la posibilidad de comer, almorzar, ir a un paseo con un artista y conocerlo un poco mas en una experiencia Vip o un tour de los que manejamos en nuestro portal. y obtener un % de cada servicio, venta de memorias usb o nfts con musica del artista etc.

ayudame a crear algo asi para el cluster y en un futuro lo podre usar para otros artistas plasticos etc.


## 📋 Resumen Ejecutivo

**GuanaGO** es una PWA (Progressive Web App) de turismo para San Andrés Isla, Colombia. Conecta turistas con operadores locales mediante un sistema de reservas con validación blockchain, chatbot IA y mapas interactivos.

### Stack Tecnológico
| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend | Node.js/Express en Render |
| Base de Datos | Airtable (vía Make.com webhooks) |
| IA/Chatbot | Groq AI (llama-3.3-70b-versatile) |
| Mapas | Mapbox GL JS v3.17.0 |
| Blockchain | Hedera Network (auditoría) |
| Automatización | Make.com (webhooks) |
| Hosting | Render.com (Backend) + GitHub Pages/Vercel (Frontend) |

---

## 🧠 1. El Cerebro (Data Flow)

### Flujo de Datos Seguro
```
[App Frontend] → [Make.com Webhooks] → [Airtable] 
                         ↓
                  [Groq AI / Hedera]
```

### Webhooks Configurados (Make.com)
| Webhook | URL | Función |
|---------|-----|---------|
| Directory | `hook.us1.make.com/gleyxf83giw4xqr7i6i94mb7syclmh2o` | Mapa y directorio |
| Services | `hook.us1.make.com/klnf8ruz7znu31mlig5y7osajbney2p3` | Catálogo de tours |
| Users | `hook.us1.make.com/8lz93j5qs3m5qu4cakeukxeq6hhgx6hc` | Registro/Auth |

### Tablas Airtable
| Tabla | Descripción | Campos Clave |
|-------|-------------|--------------|
| `ServiciosTuristicos_SAI` | Tours, hoteles, paquetes | Nombre, Precio, Imagen, Categoria, Estado |
| `Directorio_Mapa` | 31 puntos de interés | Nombre, Lat, Lon, Categoria, Descripcion |
| `Usuarios_SAI` | Usuarios y partners | Email, Rol, Estado, WalletBalance |
| `Artistas_RIMM` | Artistas Caribbean Night | Nombre, Genero, Bio, Imagen, Redes |

---

## 🗂️ 2. Estructura del Proyecto

```
GuanaGo-App/
├── App.tsx                    # Router principal + inicialización caché
├── constants.tsx              # Datos mock y configuración
├── types.ts                   # Interfaces TypeScript
├── services/
│   ├── api.ts                 # API central (Make.com + Backend)
│   ├── cachedApi.ts           # ⭐ API con caché integrado (nuevo)
│   ├── cacheService.ts        # ⭐ Sistema de caché local v2.0
│   └── chatService.ts         # Chatbot Groq AI
├── components/
│   ├── GuanaChatbot.tsx       # Chat flotante con Groq
│   ├── DirectoryMapbox.tsx    # Mapa interactivo (40+ puntos, con caché)
│   ├── SanAndresMap.tsx       # Mapa SVG zonas de taxi
│   ├── GroupQuote.tsx         # Cotizador grupal
│   └── Navigation.tsx         # Navegación inferior
├── pages/
│   ├── Home.tsx               # Inicio con categorías (caché)
│   ├── TourList.tsx           # Lista de tours (Airtable)
│   ├── Detail.tsx             # Detalle + reserva + carrito
│   ├── Taxi.tsx               # Calculadora de tarifas
│   ├── MusicEventDetail.tsx   # RIMM Caribbean Night
│   ├── InteractiveMap.tsx     # Directorio interactivo
│   └── admin/
│       ├── AdminDashboard.tsx
│       ├── AdminCaribbeanNight.tsx
│       └── DynamicItineraryBuilder.tsx
├── backend/
│   ├── server.js              # Express server
│   ├── config.js              # Variables de entorno
│   ├── controllers/
│   │   └── chatbotController.js  # Endpoint /cotizar
│   └── routes/
│       └── chatbot.js         # Rutas de chatbot
└── .env                       # API Keys (no en repo)
```

---

## 💾 2.5. Sistema de Caché Local (Nuevo v2.0)

### Estrategia: Stale-While-Revalidate

El sistema de caché garantiza que **siempre haya datos disponibles**, incluso offline:

```
┌─────────────────────────────────────────────────────────┐
│ 1. Datos de FALLBACK local (hardcodeados en código)    │
│    ↓ (instantáneo)                                      │
│ 2. Verificar CACHÉ en localStorage                      │
│    ↓                                                    │
│ 3. Si caché fresco → usar directamente                  │
│ 4. Si caché viejo → usar + actualizar en background     │
│ 5. Si sin caché → usar fallback + intentar API          │
└─────────────────────────────────────────────────────────┘
```

### Archivos Clave

| Archivo | Descripción |
|---------|-------------|
| `services/cacheService.ts` | Core del sistema de caché, datos fallback |
| `services/cachedApi.ts` | Wrapper de la API con caché integrado |

### Tipos de Datos Cacheados

| CacheKey | TTL | Descripción |
|----------|-----|-------------|
| `services_turisticos` | 6 horas | Tours, hoteles, paquetes |
| `directory_map` | 24 horas | Puntos del mapa (40+) |
| `artistas_rimm` | 12 horas | Artistas Caribbean Night |
| `taxi_zones` | 7 días | Zonas y tarifas de taxi |
| `caribbean_events` | 4 horas | Eventos RIMM |

### Uso en Componentes

```typescript
// ❌ Antes (sin caché, dependiente de red)
import { api } from './services/api';
const data = await api.services.listPublic();

// ✅ Ahora (con caché, siempre funciona)
import { cachedApi } from './services/cachedApi';
const data = await cachedApi.getServices(); // Instantáneo desde caché/fallback
```

### Funciones Principales

```typescript
// Inicializar al arrancar la app (App.tsx)
import { initializeCachedApi } from './services/cachedApi';
useEffect(() => { initializeCachedApi(); }, []);

// Obtener datos con fallback garantizado
const services = await cachedApi.getServices();
const directory = await cachedApi.getDirectory();
const artists = await cachedApi.getArtists();

// Forzar actualización desde API
const fresh = await cachedApi.getServices({ forceRefresh: true });

// Estadísticas del caché
import cache from './services/cacheService';
console.log(cache.getStats()); // { totalSize: '45.2 KB', entries: {...} }
```

### Datos de Fallback

El sistema incluye **40+ puntos** hardcodeados en `cacheService.ts`:
- 3 Farmacias/Droguerías
- 4 Cajeros/Bancos  
- 8 Restaurantes
- 6 Hoteles
- 4 Tiendas
- 7 Puntos turísticos
- 3 Transporte
- 2 Hospitales
- 3 Entretenimiento

---

## 🤖 3. Chatbot Guana Go (Groq AI)

### Endpoint
```
POST https://guanago-backend.onrender.com/api/chatbot/cotizar
```

### Request
```json
{
  "mensaje": "Cotiza tour para 4 personas",
  "historial": [
    {"role": "user", "content": "Hola"},
    {"role": "assistant", "content": "¡Hola! Soy Guana Go..."}
  ],
  "usuario_id": "opcional"
}
```

### Características
- **Modelo**: `llama-3.3-70b-versatile` (Groq)
- **Contexto**: Carga servicios de Airtable en tiempo real
- **Reglas de negocio**:
  - No reservar para el mismo día
  - Noche Blanca solo viernes
  - Margen operativo 20%
- **Fallback**: Make.com si Groq falla

---

## 🗺️ 4. Sistema de Mapas

### DirectoryMapbox (31 Puntos)
| Categoría | Emoji | Color | Ejemplos |
|-----------|-------|-------|----------|
| Restaurante | 🍽️ | Naranja | La Regatta, Miss Trinie |
| Hotel | 🏨 | Azul | Decameron, Sol Caribe |
| Farmacia | 💊 | Rojo | Droguería Alemana |
| Cajero | 🏧 | Verde | Bancolombia, Davivienda |
| Atracción | 🏝️ | Púrpura | Johnny Cay, Acuario |
| Transporte | 🚕 | Amarillo | Muelle, Aeropuerto |
| Tienda | 🛍️ | Rosa | Artesanías |
| Naturaleza | 🌴 | Verde | Hoyo Soplador |

### SanAndresMap (Zonas de Taxi)
| Zona | Nombre | Taxi (1-4) | Van (5+) |
|------|--------|------------|----------|
| Z1 | Centro/North End | $13,000 | $26,000 |
| Z2 | San Luis | $30,000 | $50,000 |
| Z3 | La Loma/El Cove | $35,000 | $55,000 |
| Z4 | Sur/Punta Sur | $45,000 | $70,000 |
| Z5 | West View | $40,000 | $60,000 |

---

## 🎵 5. RIMM Caribbean Night

### Paquetes
| Tier | Nombre | Precio | Incluye |
|------|--------|--------|---------|
| 1 | Básico | $150,000 | Entrada general |
| 2 | Con Transporte | $220,000 | Entrada + Transfer |
| 3 | VIP Experience | $350,000 | Entrada + Transfer + Mesa VIP |

### Flujo
1. Usuario selecciona paquete en `MusicEventDetail.tsx`
2. Se agrega al carrito con `addToCart()`
3. Checkout con validación de inventario
4. Reserva registrada en Airtable

---

## 📍 6. Rutas de la Aplicación

### Nivel 1: Turista (Público)
| Ruta | Componente | Descripción |
|------|------------|-------------|
| `HOME` | Home.tsx | Categorías y búsqueda |
| `TOUR_LIST` | TourList.tsx | Tours desde Airtable |
| `TOUR_DETAIL` | Detail.tsx | Reserva con fecha/cantidad |
| `INTERACTIVE_MAP` | InteractiveMap.tsx | Directorio 31 puntos |
| `TAXI_DETAIL` | Taxi.tsx | Calculadora de tarifas |
| `WALLET` | Wallet.tsx | Tokens $GUANA |
| `CHECKOUT` | Checkout.tsx | Pago y confirmación |

### Nivel 2: Partner (Operador)
| Ruta | Componente | Descripción |
|------|------------|-------------|
| `PARTNER_DASHBOARD` | PartnerDashboard.tsx | Métricas de ventas |
| `PARTNER_OPERATIONS` | PartnerOperations.tsx | Escáner QR |
| `PARTNER_RESERVATIONS` | - | Lista de reservas |

### Nivel 3: Admin
| Ruta | Componente | Descripción |
|------|------------|-------------|
| `ADMIN_DASHBOARD` | AdminDashboard.tsx | KPIs generales |
| `ADMIN_CARIBBEAN_NIGHT` | AdminCaribbeanNight.tsx | Gestión RIMM |
| `ADMIN_SERVICES` | AdminServices.tsx | Catálogo global |
| `ITINERARY_BUILDER` | DynamicItineraryBuilder.tsx | Cotizador grupal |

---

## 🔐 7. Variables de Entorno

```env
# Make.com Webhooks
MAKE_WEBHOOK_USERS=https://hook.us1.make.com/...
MAKE_WEBHOOK_DIRECTORY=https://hook.us1.make.com/...
MAKE_WEBHOOK_SERVICES=https://hook.us1.make.com/...

# Groq AI (Chatbot)
GROQ_API_KEY=gsk_...

# Airtable (Opcional - via Make)
AIRTABLE_API_KEY=pat...
AIRTABLE_BASE_ID=app...

# Mapbox
VITE_MAPBOX_TOKEN=pk.eyJ1...
```

---

## 🚀 8. Despliegue

### Frontend (Vite)
```bash
npm run build
# Output: /dist
```

### Backend (Render)
- Auto-deploy desde GitHub `master`
- URL: `https://guanago-backend.onrender.com`
- Configurar env vars en Render Dashboard

### Repositorio
- **GitHub**: `skystephens/GuanaGo-App-v2`
- **Branch**: `master`

---

## 📊 9. Estado de Funcionalidades

| Feature | Estado | Notas |
|---------|--------|-------|
| Chatbot Groq AI | ✅ Activo | llama-3.3-70b |
| Mapa Directorio (31 pts) | ✅ Activo | Mapbox GL |
| Zonas Taxi (5 zonas) | ✅ Activo | SVG interactivo |
| Tours desde Airtable | ✅ Activo | Via Make.com |
| RIMM Caribbean Night | ✅ Activo | 3 paquetes |
| Cotizador Grupal | ✅ Activo | Margen 20% |
| Carrito + Checkout | ✅ Activo | CartContext |
| Admin Caribbean Night | ✅ Activo | Reservas/Analytics |
| Blockchain Hedera | 🔄 Pendiente | Solo UI |
| Pagos Reales | 🔄 Pendiente | Mock actual |

---

## 📞 Contacto

**Proyecto**: GuanaGO - Turismo San Andrés  
**Versión**: 4.0 (Enero 2026)  
**Repositorio**: github.com/skystephens/GuanaGo-App-v2
