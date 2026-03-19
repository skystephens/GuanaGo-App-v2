# GuanaGO App — Sesión 19 de Marzo 2026

## Contexto de la sesión

Retomamos el desarrollo de la app GuanaGO luego de una pausa. El objetivo de esta sesión fue:

1. Levantar el entorno local (localhost:3006)
2. Acceder a la Torre de Control del Super Admin
3. Definir la estrategia Firebase + Airtable + IA
4. Mapear las oportunidades comerciales pendientes
5. Estructurar el mega-proyecto como un espacio de administración propio (tipo Taskade / Asana / Notion)

---

## 1. Estado del entorno local

- **Frontend:** `npm run dev` desde `/GuanaGo-App-Enero-main` → corre en `http://localhost:3006`
- **Backend:** `node server.js` → corre en `http://localhost:5000`
- **Problema encontrado:** Login con Google falla con `auth/unauthorized-domain` cuando se accede por IP `192.168.x.x` en lugar de `localhost`
- **Solución:** Usar `http://localhost:3006` O agregar la IP en Firebase Console > Authentication > Settings > Authorized Domains

---

## 2. Decisión de arquitectura: Firebase + Airtable + IA

### El problema con depender 100% de Airtable

- Airtable tiene rate limits (5 req/seg)
- No es una base de datos runtime — es una herramienta de gestión interna
- No tiene tiempo real, ni storage de archivos, ni hosting, ni notificaciones push

### Arquitectura definida (3 capas)

```
CAPA 1 — CAPTURA (Airtable)
  Formularios de ingreso de datos
  CRM de aliados, socios, artistas
  Aprobación de contenido por el equipo
  Gestión interna / back-office
  Procedimientos RAG (SOPs de desarrollo)

CAPA 2 — RUNTIME (Firebase)
  Firestore: base de datos en tiempo real de la app
  Firebase Storage: imágenes de servicios y aliados
  Firebase Auth: autenticación de usuarios
  FCM: notificaciones push
  Firebase Hosting: deploy de la PWA
  Firebase Analytics: métricas de uso

CAPA 3 — IA (Claude API + RAG)
  Asistente GuanaGO: chatbot sobre el catálogo
  RAG indexado desde Firestore
  Recomendaciones personalizadas
  Generación de descripciones de servicios
  Análisis de reseñas (sentiment)
```

### Regla clave

> Airtable = entrada y aprobación por humanos.
> Firestore = lo que la app lee y escribe en tiempo real.
> Sincronización: cuando un registro se aprueba en Airtable → Make.com lo empuja a Firestore.

### Lo que Firebase resuelve

| Necesidad | Solución |
|---|---|
| Tiempo real sin rate limit | Firestore listeners |
| Imágenes propias | Firebase Storage |
| Deploy de la PWA | Firebase Hosting |
| Push notifications | FCM (SDK ya instalado en el proyecto) |
| Login escalable | Firebase Auth |
| Offline-first | Firestore SDK con caché local nativo |
| Métricas | Firebase Analytics |

---

## 3. Capa de IA — Estrategia de monetización

### Modelo freemium (referencia: CamScanner)

CamScanner es una app de escaneo de documentos que ahora incluye videos publicitarios para usuarios que no pagan licencia. Los usuarios que sí pagan tienen la app sin publicidad. Es un modelo probado que financia el uso gratuito con publicidad.

Aplicado a GuanaGO:

```
PLAN FREE
  - Catálogo de tours, hoteles, eventos (lectura)
  - Búsqueda básica
  - 5 consultas/día al Asistente IA
  - Ver publicidad (banners + video opcional antes de reservar)
  - Acceso a ofertas de aliados

PLAN PREMIUM ($X/mes)
  - Asistente IA ilimitado
  - Reservas sin publicidad
  - Recomendaciones personalizadas
  - Descuentos exclusivos con aliados
  - Acceso anticipado a eventos (Caribbean Night, etc.)
```

### Fuentes de ingreso combinadas

1. **Publicidad:** Google AdSense + pauta directa de aliados locales
2. **Suscripción Premium:** plan mensual/anual con asistente IA
3. **Comisión por reserva:** porcentaje de cada transacción (tours, hoteles)
4. **Pauta destacada para aliados:** negocio paga por aparecer primero en categoría
5. **Módulo B2B GuiaSAI Business:** operadoras y agencias pagan por acceso al panel

---

## 4. Oportunidades comerciales mapeadas

### ANATO — Turismo organizado
- Preparar pitch para agencias miembro de ANATO
- GuanaGO como plataforma de destino en San Andrés y Providencia
- Valor: catálogo unificado, reservas en tiempo real, asistente IA para el turista

### Portafolio listo para envío
- Documento/página con: servicios disponibles, tarifas actualizadas, casos de uso B2B y B2C
- Formato: PDF descargable + URL pública
- Estado: en progreso

### Tarifas actualizadas
- Revisar y actualizar en Airtable: tours, hoteles, traslados, Caribbean Night, paquetes combo
- Incluir precios en COP y USD

### Integración GuiaSAI Business + GuanaGO
- Objetivo: una sola plataforma con dos vistas
  - Vista turista: GuanaGO (app)
  - Vista negocio: GuiaSAI Business (panel B2B)
- Mismo login, misma base de datos, mismo equipo de desarrollo

### Página web pública
- Landing page en guanago.app o guanago.com.co
- Secciones: catálogo de experiencias, registro de aliados, descarga de app, blog de destino

---

## 5. Marca, legal y estrategia

### Registro de marca
- Entidad: SIC Colombia (Superintendencia de Industria y Comercio)
- Marca: GuanaGO (mixta — texto + logo)
- Clases de Nice a revisar: clase 39 (transporte/turismo), clase 42 (software/tecnología)

### MVP final
- Definir lista cerrada de features para v1.0
- Todo lo que no entre al MVP va al backlog
- Evitar scope creep — mejor lanzar rápido y iterar

### Redes sociales
- Perfiles: Instagram, TikTok, Facebook
- Estrategia: reels de destinos + ofertas de aliados + behind the scenes del desarrollo
- Calendario de contenido 30 días antes del lanzamiento

### Gamificación
- GuanaPoints: se ganan por reservas, reseñas, referidos
- Badges por destinos visitados
- Canjeables por descuentos con aliados
- Tabla de líderes por temporada

### Tokenización (largo plazo)
- GuanaToken como loyalty token
- Holders = acceso a beneficios premium
- Puede ser centralizado primero, luego migrar a blockchain ligero

---

## 6. Torre de Control — Nuevas secciones agregadas hoy

La Torre de Control del Super Admin (dentro de la app) fue actualizada con 4 nuevas secciones:

| Sección | # Tareas | Color |
|---|---|---|
| Firebase & Infraestructura | 8 | Naranja |
| IA & Asistente Inteligente | 7 | Violeta |
| Oportunidades Comerciales | 6 | Teal |
| Marca, Legal & Estrategia | 6 | Cyan |

Las secciones anteriores (Aliados, PWA, Ads, Seguridad, Pagos, Lanzamiento) se mantienen.

El sistema de merge automático fue implementado: si el usuario ya tenía datos en localStorage, las nuevas secciones se agregan sin borrar el progreso existente.

---

## 7. Visión del mega-proyecto como espacio propio de administración

### Referencia: Taskade, Asana, Notion

El usuario tiene experiencia con:
- **Taskade:** mapas mentales + tareas + colaboración en tiempo real
- **Asana:** gestión de proyectos por equipo, flujos de trabajo
- **Notion:** wiki + base de datos + documentación integrada

### Lo que se quiere construir dentro de GuanaGO

Un espacio de administración que combine:

```
TORRE DE CONTROL (ya existe)
  - Proyectos con tareas (checklist, estado, prioridad, fecha)
  - Persistencia en localStorage + sync opcional
  - Vista de progreso por sección

PRÓXIMAS CAPAS A AGREGAR
  - Mapa mental interactivo de proyectos (nodos conectados)
  - Wiki de procedimientos (ya hay base con Procedimientos_RAG)
  - Panel de KPIs y métricas del negocio
  - Calendario de hitos y lanzamientos
  - Gestión de contactos (aliados, socios, clientes B2B)
  - Notas rápidas con IA (resumir, extraer tareas, conectar con proyectos)
```

### Diferencial vs herramientas externas

| | Taskade/Asana/Notion | GuanaGO Admin |
|---|---|---|
| Datos | En sus servidores | En Firestore propio |
| Contexto | Genérico | 100% del negocio turístico |
| IA | Genérica | Entrenada con los SOPs del proyecto |
| Integración | Por API | Nativa con el catálogo, reservas, aliados |
| Costo | $X/usuario/mes | Incluido en la plataforma |

---

## 8. Próximos pasos definidos

### Inmediato (esta semana)
- [ ] Acceder a Torre de Control en localhost y revisar todas las secciones
- [ ] Agregar dominios autorizados en Firebase (localhost + dominio producción)
- [ ] Activar Firestore en Firebase Console (modo producción)
- [ ] Preparar portafolio para envío a ANATO y contactos

### Corto plazo (próximas 2 semanas)
- [ ] Definir MVP v1.0 con lista cerrada de features
- [ ] Iniciar registro de marca en SIC
- [ ] Configurar sync Airtable → Firestore via Make.com
- [ ] Primer borrador de estrategia de redes sociales

### Mediano plazo (próximo mes)
- [ ] Integrar Claude API como asistente GuanaGO
- [ ] Firebase Hosting: primer deploy de la PWA
- [ ] FCM: primera campaña de push notifications
- [ ] Landing page pública funcionando

---

## 9. Stack técnico actual

```
Frontend:     React 19 + Vite + TypeScript + Tailwind CSS
Backend:      Node.js + Express en Render (puerto 5000)
Base datos:   Airtable (captura) → Firestore (runtime, próximamente)
Auth:         Firebase Auth (Google + email)
Storage:      Firebase Storage (próximamente)
Notificaciones: FCM (SDK instalado, pendiente configurar)
IA:           Claude API (próximamente) + RAG sobre Firestore
Deploy:       Render (backend) + Firebase Hosting (frontend, próximamente)
Automatización: Make.com (Airtable → Firestore sync)
```

---

*Documento generado el 19 de marzo de 2026 — Sesión de trabajo GuanaGO App*
