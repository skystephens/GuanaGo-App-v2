
# 🗺️ Guana Go: Arquitectura Técnica (V4.0 - Enero 2026)

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
├── App.tsx                    # Router principal
├── constants.tsx              # Datos mock y configuración
├── types.ts                   # Interfaces TypeScript
├── services/
│   ├── api.ts                 # API central (Make.com + Backend)
│   └── chatService.ts         # Chatbot Groq AI
├── components/
│   ├── GuanaChatbot.tsx       # Chat flotante con Groq
│   ├── DirectoryMapbox.tsx    # Mapa interactivo (31 puntos)
│   ├── SanAndresMap.tsx       # Mapa SVG zonas de taxi
│   ├── GroupQuote.tsx         # Cotizador grupal
│   └── Navigation.tsx         # Navegación inferior
├── pages/
│   ├── Home.tsx               # Inicio con categorías
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
