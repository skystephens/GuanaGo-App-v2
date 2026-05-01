# GuanaGO — Sesión de trabajo 30 de abril 2026

## Contexto de la sesión

Esta sesión fue de análisis y diagnóstico, no de desarrollo. Sky trajo documentos estratégicos creados previamente en Claude.ai (web) y los compartió para revisar el estado real del proyecto antes de actuar.

Los documentos revisados fueron dos archivos HTML interactivos creados en sesiones anteriores con Claude.ai (web):

1. `guanago_mapa60dias.html` — Mapa Mental Maestro 2026 (ruta de 60 días Mayo–Septiembre)
2. `MAPA_ECOSISTEMA_GUANAGO.html` — Mapa del Ecosistema completo + especificación del Jarvis Cowork

Ambos archivos viven en `GuanaGo/docs/` y `GuanaGo/docsGG/` respectivamente.

---

## Documento 1 — `guanago_mapa60dias.html` (Mapa Mental Maestro 2026)

Este documento define GuanaGO como el **"Sistema Operativo del Destino"** — no solo una app de tours, sino la infraestructura digital completa de San Andrés: guía inteligente, recomendador, motor de reservas, plataforma de contenido y herramienta de gestión de la Ruta Raizal.

### Identidad y diferenciador

- Lema: *"La San Andrés que nadie les muestra"*
- 3 marcas activas: **GuanaGO** (turista B2C), **GuíaSAI** (operadora B2B), **Ruta Raizal** (el producto diferenciador)
- La Ruta Raizal es el corazón: experiencias auténticas raizales que no existen en ninguna OTA — Rondon Tour, Eco Fiwi, Coco ART con Breda Sky, Miss Trinie Museum, Bobby Rock / Bushi Food, posadas nativas, gastronomía raizal

### Features del producto (estado por el documento)

| Feature | Estado doc | Avance | Detalle |
|---------|-----------|--------|---------|
| Mapa Inteligente | LIVE | 45% | Mapbox 40+ POIs; evoluciona a recomendador contextual (hora, clima, intereses, historial) |
| Guía Multimedia | EN DEV | 15% | Narración audio (español/inglés/kriol), galería fotos, video IA 30-60s |
| Asistente GuanaIA | LIVE | 60% | Groq llama-3.3-70b; evoluciona a agente de viajes (disponibilidad, itinerario, cotización, reserva) |
| Motor de Reservas | EN DEV | 30% | Desde mapa o asistente: taxi, tour, restaurante, Ruta Raizal, Caribbean Night; PayU (COP) + Stripe (USD); QR voucher |
| Gamificación — GuanaPoints | EN DEV | 20% | Ganar puntos: guías completados, reseña verificada, referido, reserva, check-in en mapa; canjear por descuentos, acceso VIP, experiencias exclusivas |
| Ruta Raizal | ACTIVO | 70% | El diferenciador real — lo que no tiene ninguna OTA |

### 5 fuentes de ingreso proyectadas

| # | Fuente | Margen | Estado |
|---|--------|--------|--------|
| 1 | Comisión por reserva | 10–15% | En desarrollo |
| 2 | Suscripción premium turista | Recurrente | Pendiente |
| 3 | B2B — Agencias/OTAs | 12–15% comisión | Activo |
| 4 | Publicidad aliados locales | Fijo/mes | Pendiente |
| 5 | Publicidad contextual | CPM/CPC | Pendiente |

**Proyecciones de ingreso:**
- Mes 3: $2M COP (primeras comisiones + agencias)
- Mes 6: $12M COP (plataforma multicanal activa)
- Mes 12: $39M COP (40+ agencias a escala)
- Año 2: $91M COP (plataforma consolidada)

### Roadmap 60 días (del documento)

| Fase | Cuándo | Qué |
|------|--------|-----|
| **AHORA** | Mayo 2026 | Estabilizar existente, configurar tabla `Contenido_Redes` en Airtable, definir MVP guía turística |
| **PRONTO** | Jun–Jul | Recomendador por categoría+interés, primeros 5 audio-guías, videos IA, redes 3x/semana |
| **MEDIO** | Ago–Sep | Motor de reservas + pagos reales PayU, reserva desde mapa/chatbot, QR vouchers, GuanaPoints v1, evento LAMA en plataforma |
| **LARGO PLAZO** | Q4 2026 | Agente IA completo, App Store/Play Store, Token $GUANA, 40+ aliados, expansión a Providencia |

### Contenido y redes sociales (especificado en el documento)

La tabla `Contenido_Redes` en Airtable aún no existe — hay que crearla. Campos: tipo de post, red, fecha, estado, caption, hashtags, imágenes/video, métricas post-publicación. Flujo:

> Foto/video (real o IA) → Caption IA (Claude) → Airtable (programa + aprobación Sky) → Publicación (IG/TK/FB) → Métricas (registro)

6 tipos de contenido definidos: Destino, Cultura & Gastronomía, Arte & Experiencias, Tours & Servicios, Comunidad Raizal, Datos & Interacción.

### Arquitectura técnica definida en el documento

- **Capa 1 — Captura:** Airtable (back-office) — CRM aliados, grilla contenido, cotizaciones, aprobación antes de producción
- **Capa 2 — Runtime:** Firebase Firestore (tiempo real), Storage (media), Auth (usuarios), FCM (push). Node.js/Express en Render como API gateway. React PWA.
- **Capa 3 — IA:** Groq (velocidad) + Claude API (razonamiento). RAG sobre catálogo de servicios. Agente capaz de cotizar, reservar, reseñar.

---

## Documento 2 — `MAPA_ECOSISTEMA_GUANAGO.html` (Ecosistema + Jarvis Cowork)

Este es el documento más técnico y detallado. Fue generado por "Jarvis" (Claude Code) el 19 de abril 2026 como especificación arquitectural completa del ecosistema. Incluye inventario de features, endpoints, tablas Airtable, Make.com flows, y la especificación de las 6 capas del Jarvis Cowork.

### KPIs al momento del documento

- 14 features en producción
- 6 en progreso / críticos
- 6 capas del Cowork IA
- 15 tablas Airtable
- 25+ endpoints backend
- Potencial 500M COP en 2026

### Las 6 capas del Jarvis Cowork (asistente IA de rentabilidad)

El Cowork no es un chatbot genérico — es un agente especializado en el negocio turístico de Sky con acceso directo a tarifas, historial de reservas, catálogo y contexto de clientes.

| Capa | Nombre | Estado | Comando |
|------|--------|--------|---------|
| 1 | Data Airtable | ✅ LISTA | — (ya existe) |
| 2 | Backend B2B | 🔄 Pendiente | `"ejecuta capa 2"` |
| 3 | Frontend AdminCowork | 🔄 Pendiente | `"ejecuta capa 3"` |
| 4 | Make.com Automatización | 🔜 Post-capa 2 | Sky lo arma en Make |
| 5 | Cotizador Grupos 150+ pax | 🔜 Futuro | `"ejecuta cotizador PDF"` |
| 6 | Contabilidad Automática | 🔜 Pendiente confirmar | `"diseña escenario contable [software]"` |

**Capa 2 — Backend B2B (próxima a ejecutar):**
- Agregar `Precio actualizado` (tarifa neta OTA) a `loadCatalogContext()`
- Crear modo `b2b` en `agentService.js`
- Endpoint `GET /api/cowork/catalogo-b2b` (neta + precio OTA calculado)
- Endpoint `POST /api/cowork/chat` (agente IA modo B2B)
- Archivo nuevo: `backend/routes/cowork.js`

**Capa 3 — Frontend AdminCowork.tsx:**
- 4 tabs: **Catálogo B2B** (tabla neta+OTA) | **Cotizador** (chat IA B2B) | **Grupos** (formulario 150+ pax) | **Asistente** (chat libre + contexto)

**Capa 4 — Make.com Escenario A (Civitatis → Voucher automático):**
- Gmail Watch `comercial@guiasai.com` filtrando emails de Civitatis (500+ reservas/año)
- Parser / OpenAI extrae: cliente, reserva, fecha, pax, tour
- HTTP POST `/api/reservations/vouchers`
- Gmail Label → "civitatis-procesado"
- *Elimina completamente el trabajo manual de crear vouchers de Civitatis*

**Capa 5 — Cotizador grupos 150+ pax:**
- Descuento escalonado: <50 = estándar | 50-99 = -10% | 100-149 = -15% | 150+ = -20% + propuesta ejecutiva
- Output: PDF con portada, itinerario, tabla de precios, QR de confirmación

**Capa 6 — Contabilidad automática:**
- Make.com: reserva pagada → factura automática en Siigo/Alegra/QuickBooks
- Alerta: reserva no contabilizada >48h
- Resúmenes mensuales por canal (B2C / B2B / OTA)

### Motor de precios multi-canal (ya implementado en `pricingService.ts`)

| Canal | Lógica | Estado |
|-------|--------|--------|
| Directo B2C | Precio base + 15% concierge + logística | ✅ Activo |
| OTA / Agencia | Tarifa neta → OTA agrega +23% para venta pública | 🔄 Capa 2 |
| Aliado local | Comisión por transacción al aliado | ✅ Activo |
| Promotor | Base + ref_code → 8% comisión | 🔜 Futuro |

### Arquitectura de datos — 15 tablas Airtable

**Base principal:** `appiReH55Qhrbv4Lk` | **Base vouchers:** `appij4vUx7GZEwf5x`

| Tabla | Descripción | Estado |
|-------|-------------|--------|
| `ServiciosTuristicos_SAI` | 80+ servicios con tarifa neta OTA | ✅ |
| `Directorio_Mapa` | 31 POIs con lat/lon | ✅ |
| `Leads` | 500+ usuarios y agencias | ✅ |
| `Reservas` | Reservas unificadas B2C+B2B | ✅ |
| `CotizacionesGG` | Cotizaciones B2B | ⚠️ Vacía |
| `cotizaciones_Items` | Ítems por cotización | ✅ |
| `Pagos` | Historial de transacciones (100+) | ✅ |
| `Rimm_musicos` | 20+ artistas Caribbean Night | ✅ |
| `AlojamientosTuristicos_SAI` | Hoteles y hospedajes | ✅ |
| `GUANA_Transacciones` | Historial de puntos (1000+ registros) | ✅ |
| `Aliados_Beta` | Red de operadores certificados | ⚠️ Configurando |
| `Agencias_OTA` | Civitatis, tur.com | ⚠️ Pendiente datos |
| `Promotores_GG` | Red de referidos | 🔜 Futuro |
| `Tareas_To_do` | Gestión de tareas del proyecto | ✅ |
| `Generador_vouchers` | Vouchers Civitatis (base appij4vUx7GZEwf5x) | 🟠 |

**Tabla pendiente de crear:** `Contenido_Redes` — grilla de contenido para redes sociales (especificada en doc 1)

### Make.com — Scenarios activos y pendientes

**Activos (3):**
1. Directory/Map → Airtable `Directorio_Mapa` a Firestore
2. Catálogo de servicios → `ServiciosTuristicos_SAI` a Firestore
3. Registro/Auth → nuevo Lead sincroniza Firebase Auth

**Pendientes (3):**
1. **Civitatis → Voucher automático** (Capa 4) — elimina trabajo manual de 500+ reservas/año
2. **Contabilidad automática** (Capa 6) — confirmación de software pendiente
3. **OTA → Cotización automática** (futuro) — email agencia → Jarvis genera cotización JSON

### OTAs activas

| OTA | Modelo | Volumen | Estado |
|-----|--------|---------|--------|
| Civitatis | Neta +23% | 500+ emails/año | ✅ Activa |
| tur.com | Misma tarifa base | — | ✅ Activa |
| Mayoristas | Cotización directa | Grupos | 🔄 En diseño |

---

## Observación clave: el proyecto NO está en día 0

Los documentos estratégicos analizaban GuanaGO como si estuviera comenzando. La realidad que muestra el CLAUDE.md es muy diferente — ya hay 15+ features en producción:

- Chatbot Groq AI activo
- Mapa directorio con 31 puntos (Mapbox GL)
- Zonas de taxi (SVG interactivo)
- Tours desde Airtable via Make.com
- Caribbean Night (3 paquetes con reservas + analytics)
- Cotizador grupal con margen 20%
- Carrito + Checkout (CartContext)
- Admin Panel con 18+ vistas
- Firebase Auth (Google + email)
- Guana Wallet (puntos)
- Centro de Reservas Unificado (tab Reservas directas + tab Vouchers)
- Vouchers / Civitatis (CRUD completo)
- Cotizaciones GuíaSAI (PDF con foto-grid, lightbox, branding)
- Panel de Datos (alojamientos, taxis, tiquetes)

Los documentos trataban el proyecto con un nivel de detalle muy alto, pero algunos apartados asumían que ciertas cosas estaban por construirse cuando en realidad ya existen (ej: el Cowork está parcialmente construido en `backend/routes/cowork.js`, los vouchers Civitatis ya funcionan). El valor de estos documentos es como hoja de ruta y especificación de lo que falta — no como descripción del estado actual.

La estrategia de aliados y el Jarvis Cowork son correctos como visión, pero hay trabajo técnico pendiente más urgente (los 3 bloqueadores de ingreso).

---

## Los 3 bloqueadores reales de ingreso (prioridad)

| # | Problema | Estado |
|---|----------|--------|
| 1 | **Pasarela de pagos Wompi/PayU** — sin pago real, no hay comisión | Bug diagnosticado |
| 2 | **Notificación al operador (WhatsApp)** — sin esto el flujo es manual | Pendiente |
| 3 | **Firestore como runtime** — Airtable tiene rate limits con volumen real | Pendiente |

---

## Diagnóstico del link de pago PayU

Sky mostró la pantalla del modal "Generar Link de Pago" en la sección de Cotizaciones — ya estaba construido. El problema es que "no funciona". Se revisó el código completo y se encontraron 3 causas:

### Causa 1 — In-memory storage (la más crítica)

En `backend/routes/payments.js` línea 29:
```javascript
const pendingPayments = new Map();  // vive en RAM
```

Render.com en free tier duerme el servidor cuando no hay tráfico. Cuando el servidor se reinicia, ese `Map` se vacía. Flujo roto:
1. Sky genera el link → `pagoUrl = guanago.travel/pagar/{referenceCode}`
2. Servidor se reinicia (segundos o minutos después por inactividad)
3. Cliente hace click en el link → servidor busca `referenceCode` en el Map → no existe → muestra "Link expirado"

**Fix pendiente:** guardar los payment fields en Airtable en vez de RAM, y recuperarlos por `referenceCode` al servir `GET /pagar/:ref`. Esto hace el link resistente a reinicios del servidor.

### Causa 2 — Credenciales vs modo test

`.env` tiene `PAYU_TEST=1` (sandbox) pero las credenciales (`PAYU_MERCHANT_ID=627100`, etc.) parecen ser production. PayU sandbox rechaza credenciales de producción.

**Fix pendiente:** confirmar si las credenciales son sandbox o producción, y alinear `PAYU_TEST` con el tipo de cuenta.

### Causa 3 — Gateway URL viejo (menor)

`PAYU_GATEWAY_URL=https://gateway.payulatam.com/ppp-web-gateway/` — URL del gateway viejo de PayU (pre-2015). La URL actual es `checkout.payulatam.com`. Solo afecta modo producción.

---

## Alternativa: Binance Pay

Se discutió Binance Pay como alternativa o complemento a PayU.

**Ventajas:**
- API más simple (devuelve `checkoutUrl` directamente, sin página intermedia)
- Turistas internacionales lo usan en USD/USDT
- Fees más bajos
- Sin PSE ni bancos colombianos involucrados

**Desventajas:**
- Clientes de GuiaSAI (agencias colombianas) prefieren PSE/tarjeta en COP
- Incertidumbre regulatoria crypto en Colombia
- No todo turista local tiene Binance

**Conclusión:** mantener ambas en paralelo. PayU para COP/PSE (mercado local), Binance Pay como opción secundaria para turistas extranjeros que pagan en USDT. No es mucho trabajo agregar Binance Pay una vez que PayU funcione.

---

## Lo que queda pendiente para mañana

1. **Fix PayU — in-memory → Airtable persistencia**
   - Crear tabla `PagosTemporales` en Airtable (o usar campo en `CotizacionesGG`)
   - Al crear el link: guardar fields en Airtable con TTL de 24h
   - Al servir `GET /pagar/:ref`: leer de Airtable, no del Map
   - Esto resuelve el 90% del problema

2. **Alinear credenciales PayU**
   - Confirmar si `627100` / `629377` son sandbox o producción
   - Actualizar `PAYU_TEST` en Render.com según corresponda
   - Corregir `PAYU_GATEWAY_URL` a la URL correcta

3. **Decidir si agregar Binance Pay**
   - Si sí: crear `backend/routes/binancePay.js` y el modal en el frontend
   - Prioridad media, no bloquea el flujo principal

4. **Estrategia de aliados** (cuando los pagos funcionen)
   - Pipeline de captación en Airtable (`Aliados_Locales`)
   - Formulario de registro de aliados
   - Make.com flow: formulario → Airtable → notificación a Sky → aprobación

---

## Notas de arquitectura que NO cambiar

- `payments.js` ya está correctamente importado y montado en `server.js`:
  - `app.use('/api/payments', paymentsRoutes)` — para create y webhook
  - `app.use('/pagar', paymentsRoutes)` — para la página de pago
- El problema es funcional, no estructural — la estructura del código está bien
- No mover los pagos a otro archivo ni cambiar las rutas

---

*Sesión: 30 abril 2026 · Sky Stephens + Claude Code (claude-sonnet-4-6)*
