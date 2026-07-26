# Mapa de Tablas — Airtable `appiReH55Qhrbv4Lk`

Referencia rápida: qué hace cada tabla, para qué sirve, y con qué se conecta.
Actualizar este archivo cada vez que se cree una tabla nueva o cambie el propósito de una existente.

---

## 🧾 Núcleo de cotizaciones y ventas

| Tabla | ID | Para qué sirve |
|---|---|---|
| **CotizacionesGG** | `tblNSEeP3MttNNDuT` | La cotización en sí: cliente, fechas, pax, precio total, `Etapa_CRM` (pipeline de ventas), `Estado` (Borrador/Enviada/Aceptada/Rechazada), `Numero_Reserva` tras pago. |
| **Cotizaciones_Items** | `tblU0eA9kxyXhK49t` | **Cada línea/servicio dentro de una cotización** (hoteles, tours, vuelos, ítems libres). Se vincula a `CotizacionesGG` por `ID CotizacionGG`. ⚠️ Ya tiene 268+ registros — cualquier fetch nuevo sobre esta tabla debe paginar. |
| **PagosTemporales** | `tblvJME0wM9uWPNzl` | Links de pago Wompi/PayU pendientes, con expiración 24h. Reemplaza el `Map` en memoria que se perdía al reiniciar Render. |
| **Pagos** | `tblYzz6SUbFIfZ5Na` | Registro de pagos ya confirmados, vinculado a `Reservas`. |
| **Reservas** | `tbl1UJGW7vQ4W0D0G` | Reservas confirmadas de usuarios (modelo más antiguo/paralelo a CotizacionesGG). |

## 🏨 Catálogo de servicios (lo que se vende)

| Tabla | ID | Para qué sirve |
|---|---|---|
| **AlojamientosTuristicos_SAI** | `tblUNglGMsxDZYZPs` | Catálogo de hoteles/alojamientos. `Precio_GuanaGO` = precio general todo el año. `Disponible_Copa_Isla` = si aplica para el evento (solo disponibilidad, el precio de evento vive en `Copa_Tarifas`). |
| **ServiciosTuristicos_SAI** | `tblTp0v7EoCjNHU4W` | Catálogo de tours/servicios (no alojamiento). Incluye precios B2B/B2C, comisión agencia, contenido marketing. |
| **Taxis_Traslados** | `tblLefq5XdqF45VwL` | Tarifas de traslados/transporte. |
| **Tiquetes_Aereos** | `tbl1kR2vzIFqQlgnn` | Catálogo de vuelos (aerolínea, origen/destino, precios por tipo de pasajero). |
| **Artesanias** | `tblL7MNKCInfIr6Mx` | Catálogo de productos artesanales (Coco Art y futuros artesanos) — alimenta `/cocoart`. |
| **Paquetes_Internacionales** | `tbl8HlrsJoJJI0emx` | Paquetes de viaje salientes (no destino San Andrés). |
| **Disponibilidad_SAI** | `tblcw6FBoo7iQPhDB` | Bloques de fechas por alojamiento (bloqueado, reservado, promo) — disponibilidad, no precio. |
| **Alojamientos_Solicitudes** / **Servicios_Solicitudes** / **Directorio_Solicitudes** | — | Formularios de alta de aliados **pendientes de aprobación**, antes de pasar al catálogo real. |

## 🎯 Copa de la Isla (evento de diciembre)

| Tabla | ID | Para qué sirve |
|---|---|---|
| **Copa_Tarifas** | `tblz1uekwVb41U27q` | **Catálogo único de precios del evento** (venta/neto) — aquí van las tarifas fijas de diciembre, separadas del catálogo general. |
| **Copa_Delegaciones** | `tblQTPoSr4ggTX3nc` | Cada club/delegación: coordinador, meta de pax, checkin/checkout, código de acceso al portal. |
| **Copa_Viajeros** | `tblpxiCyegu9qVUsN` | Cada pasajero dentro de una delegación. |

## 👥 CRM, leads y aliados

| Tabla | ID | Para qué sirve |
|---|---|---|
| **Leads** | `tblpVCm7xaEmWAkKu` | Perfil de usuario/lead B2C — viajero, residente, tipo de cliente, estado. |
| **Conversaciones_CRM** | `tbl2Uu3IwcWKAQ4bP` | Trazabilidad de conversaciones WhatsApp/app, alimentada por Make.com. |
| **Directorio_Mapa** | `tblbrq0U77RAjgG9N` | Red de aliados locales (RABR) — el que ya usamos para hoteles/comercios en el mapa, comisión pactada, redes sociales. |
| **Embajadores** | `tblkAbIW3LQX0dh9u` | Red de embajadores/referidos (incluye taxistas vía `Taxi_Vehiculo`). |
| **Onboarding_Aliados** | `tblvty1nlawk7wADQ` | Relato/contexto IA de cada aliado nuevo durante el alta. |
| **Perfiles_Usuarios** | `tblC6teRhWovnSzic` | Perfiles B2C con GuanaPoints y plan (Explorador/Activo/Premium). |
| **Usuarios_Admins** | `tblpy5YxDt6knhZHd` | Usuarios internos del panel admin (roles, permisos, Firebase UID). |

## 📣 Contenido, marketing y comunidad

| Tabla | ID | Para qué sirve |
|---|---|---|
| **Contenido_Redes** | `tbl2clkc9P7BuY831` | Calendario de publicaciones IG/FB/TikTok — el que usamos para el plan de contenido 80/20. |
| **Promociones** | `tblBNPE6dwvqbhZde` | Ofertas de aliados — pines dorados en el mapa. |
| **Concursos** / **Concurso_Participantes** | `tblYOTVRaQprTxVwq` / `tbl3sIlBTnFh2WCfF` | Concursos gastronómicos/culturales y negocios inscritos. |
| **Ruta_Paradas** | `tbllu90BFliMT6lfs` | Paradas de la Ruta Raizal (POIs, aliados, música). |
| **Rimm_musicos** / **Productos_Artista** / **Ventas_Artista** | — | Caribbean Night: músicos, su merch, y ventas. |

## ⚙️ Sistema, IA y operación interna

| Tabla | ID | Para qué sirve |
|---|---|---|
| **Procedimientos_RAG** | `tblOvlFanUiguceZo` | Base de conocimiento del chatbot IA (SOPs, FAQs) — filtrada por `Audiencia`. |
| **Chats_Atencion** | `tblUwoBPPdW8iR4YK` | Chats escalados del bot a atención humana. |
| **Cola_Agentes** | `tblZz2bz7ixVdi72y` | Cola de tareas para agentes IA + Make.com. |
| **Notificaciones_Queue** | `tblA1GkQIno4ViU8W` | Cola central de envíos (WhatsApp/push/email) que Make.com procesa cada 15 min. |
| **Sesiones_Contexto** | `tbl4FmiwqW3xxwEYT` | **Memoria entre sesiones de Claude** — decisiones, tareas generadas, contexto técnico de cada sesión de trabajo. |
| **Tareas_To_do** | `tblqHgUvpDUsLozIc` | Backlog de tareas técnicas del proyecto. |
| **Home_Config** | `tblQmeIYaFwPp2n3r` | Configuración clave-valor del home de la app. |
| **GUANA_Transacciones** | `tbldeRzkrNZbsC4Xc` | Movimientos de GuanaPoints. |
| **Retos_GUANA** | `tbljWcVbdT7PDxQ1c` | Retos/gamificación del programa GuanaPoints. |

---

## Cómo mantener esto vivo

- Cuando crees una tabla nueva en Airtable, agrégala aquí en la categoría que corresponda **antes** de conectarla al código.
- Si una tabla cambia de propósito (como pasó con el riesgo de mezclar `Precio_GuanaGO` general con tarifas de evento), anota la aclaración aquí para no repetir la confusión.
- Este archivo vive en el repo (`MAPA_TABLAS_AIRTABLE.md`) junto a tu `CLAUDE.md` — Claude Code puede leerlo como contexto en cualquier sesión nueva.
