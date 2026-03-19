# 🧠 MASTER CONTEXT - GuiaSAI/GuanaGO Project
## Conversación Completa con Claude (29 Enero 2026)

**IMPORTANTE**: Este documento contiene todo el contexto de nuestra conversación.
Claude Code debe leer esto PRIMERO antes de trabajar en el proyecto.

---

## 📋 RESUMEN EJECUTIVO

**Proyecto**: Ecosistema de turismo comunitario para San Andrés & Providencia
**Marcas**: 
- GuiaSAI (B2B - Agencias de viajes)
- GuanaGO (B2C - Turistas directos)

**Estado actual**:
- ✅ Demo funcional: guiasanandresislas.com/agencias/
- ✅ Sistema de vouchers en Airtable (incluso desde móvil)
- ✅ Operación activa con reservas reales
- 🔄 Preparación para ANATO 2026 (25-27 Febrero)

**Objetivo inmediato**: 
Optimizar presentación para ANATO destacando turismo comunitario auténtico.

---

## 🎯 DIFERENCIADOR CLAVE

GuiaSAI NO es un DMC tradicional. Es un ecosistema de turismo comunitario que conecta agencias con:

### Productos Auténticos (Distintivos):
- 🎨 **Coco Art**: Talleres de tallado de coco con maestros artesanos
- 🏝️ **Breda Sky**: Hospedaje con familias raizales
- 🗣️ **Kriol**: Experiencias en lengua creole
- 👐 **Artesanas**: 23 mujeres, técnicas ancestrales
- 🎵 **Cluster de Música**: Caribbean Night, reggae/calypso local
- 🍽️ **Cluster Gastronómico**: Rondón en casas de familia

### Impacto Medible:
- 127 emprendedores locales beneficiados
- $287,500 USD distribuidos en 2025
- 70% de cada venta va directo al operador local
- 4 clusters certificados

---

## 🏗️ ARQUITECTURA TÉCNICA ACTUAL

### Stack:
```
Frontend:
- React 18 + Vite + TypeScript
- Zustand (state management)
- airtableService.ts (API layer)

Backend:
- Airtable (serverless DB)
- Make.com (automatización - planeado)

Hosting:
- Apache/WordPress hosting
- guiasanandresislas.com/agencias/
```

### Base de Datos Airtable:

**Tablas Principales**:
1. **Servicios**: Catálogo completo (hoteles, tours, experiencias)
2. **CotizacionesGG**: Sistema de cotización B2B
3. **Proveedores**: Operadores locales certificados
4. **Experiencias_Autenticas**: Nueva tabla propuesta para turismo comunitario

**Campos Importantes Ya Existentes**:
- `Nombre`, `Slug`, `Tipo_Servicio`, `Categoria`
- `Precio_Base`, `Comision_Agencia`
- `Descripcion`, `Imagenes`
- `Es_Autentico`, `Operador_Raizal` (para destacar autenticidad)
- `Historia_Cultural` (contexto raizal/cultural)
- `Contexto_Bot` ⭐ (usado para evitar alucinaciones del chatbot)
- `Activo`, `Destacado`

---

## 🎯 NECESIDADES INMEDIATAS (Pre-ANATO)

### 1. URLs Individuales de Servicios (CRÍTICO)

**Por qué**: Compartir en catálogo WhatsApp Business

**Estructura propuesta**:
```
guiasanandresislas.com/servicio/tour-acuario-johnny-cay
guiasanandresislas.com/servicio/coco-art-workshop
guiasanandresislas.com/servicio/breda-sky-guesthouse
```

**Implementación**: 
- Componente ServiceDetailPage.tsx (ya generado)
- React Router con param `:slug`
- Open Graph tags para preview WhatsApp
- CSS optimizado para conversión (ya generado)

### 2. Destacar Autenticidad Raizal

**Elementos visuales necesarios**:
- Badge "🌴 Operado por Raizales"
- Sección "Historia Cultural" prominente
- Impact metrics (70% va al artesano)
- Testimonios de operadores locales

**Componentes a crear**:
- `<AuthenticityBadge />`
- `<ImpactMetrics />`
- `<LocalProviderCard />`

### 3. Material Marketing ANATO

**Piezas necesarias**:
- Flyer A5 (500 unidades)
- Tarjetas individuales A6 por servicio top (100 c/u)
- Banner Roll-Up
- QR codes de servicios
- Video 60 segundos

**Pitch refinado** (30 seg):
> "GuiaSAI conecta agencias con 127 emprendedores raizales certificados. 
> No vendemos tours genéricos - damos acceso a Coco Art, Caribbean Night, 
> cocina Kriol en casas familiares. El 70% de cada venta va directo a la 
> comunidad. Comisión 15%, soporte 24/7, confirmación <2h."

---

## 🤖 SISTEMA RAG + MCP (Arquitectura de IA)

### Visión Completa:

```
┌─────────────────────────────────────────┐
│ CAPA 1: INTELIGENCIA                    │
│ - Claude Code (dev agent)               │
│ - Claude MCP (context protocol)         │
│ - Gemini Flash (análisis masivo)        │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ CAPA 2: DATOS (Airtable como RAG)      │
│ - Tasks_Kanban (gestión de tareas)     │
│ - Documentos_RAG (knowledge base)       │
│ - Componentes_App (inventario código)  │
│ - Features_Roadmap (visión producto)   │
│ - Servicios, Cotizaciones, etc.        │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ CAPA 3: AUTOMATIZACIÓN (Make.com)      │
│ - Email → Voucher PDF → Cliente        │
│ - Nueva cotización → WhatsApp proveedor│
│ - Sync precios Google Sheets → Airtable│
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ CAPA 4: DISTRIBUCIÓN                   │
│ - GuiaSAI B2B (agencias)               │
│ - GuanaGO PWA (turistas)               │
│ - Admin Panel (proveedores)            │
└─────────────────────────────────────────┘
```

### MCP Setup:

```json
// .claude/mcp-config.json
{
  "mcpServers": {
    "airtable-guanago": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-airtable"],
      "env": {
        "AIRTABLE_API_KEY": "TU_API_KEY",
        "AIRTABLE_BASE_ID": "TU_BASE_ID"
      }
    }
  }
}
```

**Beneficio**: Claude Code lee Airtable automáticamente como memoria contextual.

---

## 📦 AUTOMATIZACIONES PROPUESTAS

### 1. Email → Voucher Automático

**Problema actual**: Reservas por email requieren proceso manual (15 min cada una)

**Solución Make.com**:
```
Email llega → Make.com detecta → Extrae datos con OpenAI →
Crea registro Airtable → Genera PDF voucher →
Envía a cliente + notifica proveedor WhatsApp
```

**Ahorro**: 5+ horas/semana

### 2. Sync de Precios Diario

**Problema**: Proveedores actualizan precios → hay que actualizar manual

**Solución**:
```
Google Sheet (editan proveedores) →
Make.com lee cambios diarios 6am →
Actualiza Airtable.Servicios →
Notifica en Slack
```

### 3. Chatbot sin Alucinaciones

**Uso del campo `Contexto_Bot`**:
```typescript
const context = await airtable.getField('Contexto_Bot');

const systemPrompt = `
Eres asistente de GuiaSAI.

CONTEXTO REAL:
${context}

Responde SOLO con esta información.
NUNCA inventes precios, horarios o ubicaciones.
`;
```

---

## 📊 ESTRUCTURA DE CATEGORÍAS PROPUESTA

### Cambio de:
```
❌ Hoteles | Tours | Transportes
```

### A:
```
✅ Experiencias Auténticas
   - Coco Art Workshop
   - Taller Artesanía Raizal
   - Rondón en Casa de Familia

✅ Música & Cultura
   - Caribbean Night
   - Tour Radio Raizal
   - Storytelling con Mayores

✅ Arte & Creación
   - Pintura Local
   - Fotografía Cultural
   - Tejido Tradicional

✅ Hospedaje Comunitario
   - Breda Sky Guesthouse
   - Casa Nativa San Luis
   - Homestay Pescadores

✅ Clusters & Asociaciones
   - Cluster de Música (15 músicos)
   - Asociación Artesanas (23 mujeres)
   - Coco Art Collective (8 artistas)
   - Cluster Gastronómico (12 cocineras)

✅ Tours Tradicionales
   - Acuario + Johnny Cay
   - Hoyo Soplador
   - Snorkeling
```

---

## 🎯 PRIORIZACIÓN DE TAREAS

### CRÍTICO (Esta semana - Pre ANATO):
1. ✅ URLs individuales funcionando (`/servicio/:slug`)
2. ✅ Catálogo WhatsApp Business (30 productos top)
3. ✅ Destacar autenticidad en homepage
4. ✅ Material marketing diseñado
5. ✅ QR codes generados

### IMPORTANTE (Post-ANATO):
1. ⚡ Automatización email → voucher
2. ⚡ CRM básico para seguimiento agencias
3. ⚡ Knowledge base (FAQ) en Airtable
4. ⚡ MCP configurado para Claude Code

### VISIÓN (1-3 meses):
1. 🚀 GuanaGO PWA completo
2. 🚀 Sistema de puntos gamificado
3. 🚀 Dashboard proveedores completo
4. 🚀 Tokenización (fase exploratoria)

---

## 💡 USO EFICIENTE DE CLAUDE CODE

### ❌ NO usar Claude Code para:
- Brainstorming
- Planificación arquitectónica
- Preguntas conceptuales
- Discusiones de diseño

### ✅ SÍ usar Claude Code para:
- Implementar tareas específicas
- Generar componentes
- Escribir tests
- Refactorizar código
- Actualizar Airtable programáticamente

### Prompt óptimo:
```
❌ MAL (desperdicia tokens):
"Hola Claude, necesito que me ayudes a crear un componente 
para mostrar servicios. Debería tener cards bonitas con 
imágenes y un botón de cotizar..."

✅ BIEN (eficiente):
"Implementa TASK-001 de Airtable."

✅ ÓPTIMO (con MCP):
"Lee .claude/tasks/TASK-001.md y ejecútalo."
```

### Workflow recomendado:
1. Planifica en Airtable (gratis, ilimitado)
2. Documenta en .md (contexto persistente)
3. Claude Code ejecuta (tokens mínimos)
4. Actualiza Airtable automáticamente
5. Commit a Git

---

## 📁 ARCHIVOS GENERADOS EN ESTA CONVERSACIÓN

### Documentación:
- ✅ `guiasai-community-tourism-structure.md` - Estructura completa turismo comunitario
- ✅ `automation-email-to-voucher.md` - Workflow automatización reservas
- ✅ `claude-code-efficient-usage.md` - Guía uso eficiente tokens
- ✅ `guiasai-backend-integration-guide.md` - Integración Airtable API
- ✅ `guiasai-technical-specs.md` - Specs técnicas sistema

### Código:
- ✅ `service-detail-page.tsx` - Componente páginas individuales
- ✅ `service-detail.css` - Estilos optimizados conversión
- ✅ `guiasai-rag-architecture.html` - Diagrama interactivo sistema

### Datos:
- ✅ `01_Tasks_Kanban.csv` - Tareas proyecto
- ✅ `02_Documentos_RAG.csv` - Knowledge base
- ✅ `03_Componentes_App.csv` - Inventario componentes
- ✅ `04_Features_Roadmap.csv` - Roadmap features

---

## 🔑 DECISIONES DE ARQUITECTURA CLAVE

### ADR-001: Airtable como Backend
**Decisión**: Usar Airtable en lugar de Postgres/MongoDB
**Razón**: 
- Equipo no técnico puede actualizar datos
- API inmediata sin backend
- Relaciones visuales
- Costo-efectivo ($20/mes vs $100+/mes servidor)

### ADR-002: Zustand vs Redux
**Decisión**: Zustand para state management
**Razón**:
- Menos boilerplate
- Mejor performance
- TypeScript nativo
- Bundle más pequeño (1.2kb vs 8kb)

### ADR-003: Monorepo Turborepo
**Decisión**: Usar monorepo para GuiaSAI + GuanaGO
**Razón**:
- Compartir componentes UI
- Reutilizar airtableService
- Deploy independiente
- Mantenimiento centralizado

### ADR-004: PWA vs App Nativa
**Decisión**: PWA para GuanaGO (no app nativa)
**Razón**:
- Un solo codebase
- Instalable sin App Store
- Funciona offline
- Actualizaciones instantáneas
- Costo menor desarrollo

---

## 🎨 GUÍA DE ESTILO Y BRANDING

### Paleta de Colores:
```css
--ocean: #00B4D8;
--coral: #FF6B35;
--turquoise: #06FFA5;
--deep-blue: #023E8A;
```

### Tipografía:
- **Display**: Playfair Display (serif, elegante)
- **UI/Headings**: Poppins (sans-serif, moderno)
- **Body**: Inter (legibilidad)
- **Code**: JetBrains Mono

### Estética:
- Minimalismo brutal + lujo caribeño
- Gradientes oceánicos
- Sombras suaves
- Bordes redondeados
- Animaciones sutiles

---

## 💰 MODELO DE NEGOCIO

### GuiaSAI B2B:
- **Revenue**: Comisión 15% sobre reservas
- **Clientes**: Agencias de viajes nacionales/internacionales
- **Precio neto**: Transparente para agencias
- **Valor agregado**: Soporte 24/7, confirmación <2h, proveedores certificados

### GuanaGO B2C (Futuro):
- **Revenue**: Margen 8% (precio más bajo que B2B)
- **Clientes**: Turistas directos, residentes
- **Diferenciador**: Precios bajos + gamificación + experiencias auténticas
- **Restricciones**: No reembolsable, pago inmediato

### Modelo de Impacto:
- 70% de venta → Operador local
- 20% → Colectivo/Asociación (mantenimiento)
- 10% → Programa de becas jóvenes

---

## 🔗 RECURSOS Y REFERENCIAS

### URLs Importantes:
- Sitio actual: https://guiasanandresislas.com/agencias/
- GuanaGO (desarrollo): https://guanago.travel
- ANATO 2026: https://vitrinaturistica.anato.org/

### Airtable:
- Base ID: [Agregar cuando esté disponible]
- API Key: En `.env` como `VITE_AIRTABLE_API_KEY`

### Contactos Clave:
- Cluster de Música: cluster@musica-raizal.com
- Asociación Artesanas: artesanas@sanandres.com
- Coco Art: info@cocoart-sai.com
- Cluster Gastronómico: cocina@kriol-gastro.com

---

## 🚀 PRÓXIMOS PASOS INMEDIATOS

### Para Claude Code:
1. ✅ Leer este archivo completo
2. ✅ Leer archivos de contexto en `.claude/context/`
3. ✅ Sincronizar schema de Airtable con script
4. ✅ Leer tareas pendientes de Airtable
5. ✅ Implementar según prioridad

### Para el Equipo:
1. ⚡ Terminar relaciones Airtable (Paso 7 de guía importación)
2. ⚡ Crear cuenta Make.com
3. ⚡ Obtener API keys de Airtable
4. ⚡ Configurar WhatsApp Business
5. ⚡ Diseñar material ANATO

---

## 📝 NOTAS FINALES

**Fecha de esta conversación**: 29 Enero 2026
**Evento objetivo**: ANATO 2026 (25-27 Febrero)
**Tiempo disponible**: ~3 semanas

**Filosofía del proyecto**:
> "No vendemos tours. Conectamos agencias con el alma raizal de San Andrés 
> y generamos impacto económico real en 127 familias locales."

**Enfoque técnico**:
> "Stack simple pero poderoso. Airtable + React + Make.com. 
> Lo que importa es la ejecución y el impacto, no la complejidad técnica."

---

## 🤝 COLABORADORES EN ESTA CONVERSACIÓN

- **Usuario**: Fundador de GuiaSAI, 10+ años experiencia en SAI
- **Claude (Anthropic)**: Asistente AI en arquitectura y desarrollo
- **Objetivo compartido**: Lanzamiento exitoso en ANATO 2026 con propuesta única de turismo comunitario

---

**FIN DEL MASTER CONTEXT**

Claude Code: Lee los demás archivos en `.claude/context/` para detalles específicos.
Empieza leyendo `airtable-schema.md` (cuando esté disponible) para entender 
la estructura real de datos.
