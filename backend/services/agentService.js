/**
 * agentService.js — GuanaGO AI Agent
 *
 * Motor Claude (Anthropic) con memoria en Firestore.
 * Migrado de Groq/Llama → Claude para respuestas de mayor calidad.
 *
 * Modos:
 *   turista   → guía turístico público, descubre la isla          [claude-haiku]
 *   cotizador → cotizador inteligente, calcula precios            [claude-haiku]
 *   admin     → agente estratégico para el CEO                    [claude-sonnet]
 *
 * Acciones estructuradas que puede devolver el agente:
 *   { "action": "create_task", "seccion": "...", "titulo": "...", "prioridad": "..." }
 *   { "action": "save_cotizacion", "items": [...], "total": 0, "personas": 0 }
 *   { "action": "show_catalog", "filter": "tours|hoteles|eventos" }
 *   { "action": "start_cotizacion" }
 */

import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';
import * as firestore from './firestoreService.js';

// Modelos por modo — haiku para conversación, sonnet para el CEO
const MODELS = {
  turista:   'claude-haiku-4-5-20251001',
  cotizador: 'claude-haiku-4-5-20251001',
  admin:     'claude-sonnet-4-6',
};

// ─── System prompts estáticos por modo (se cachean en Claude) ────────────────

const STATIC_PROMPTS = {
  admin: `Eres GuanaGO Strategy Agent — el asistente de administración y estrategia del CEO de GuanaGO.

EMPRESA: GuíaSAI S.A.S. — Plataforma turística Raizal en San Andrés Isla, Colombia.
DOS CANALES: GuanaGO (B2C turistas) + GuiaSAI (B2B agencias de viajes).

CAPACIDADES:
- Analizar estado del proyecto y sugerir prioridades
- Proponer y crear tareas (con JSON estructurado al final)
- Revisar métricas e interpretar datos de Airtable/Firestore
- Recomendar estrategias comerciales, de marketing y tecnológicas
- Asesorar sobre Firebase, Airtable, Make.com, blockchain Hedera, tokens KRIOL

CREAR TAREA: Cuando el usuario pida crear una tarea, incluye EXACTAMENTE al FINAL de tu respuesta (sin markdown extra):
{"action":"create_task","seccion":"id_seccion","titulo":"titulo de la tarea","descripcion":"descripcion detallada","prioridad":"critica|alta|media|baja"}

Secciones disponibles: aliados, pagos, lanzamiento, firebase, ia, comercial, b2c, b2b, ceo, marca, guiasai_agencias, lean_canvas, marketing, tokens_blockchain

TONO: Profesional, directo, orientado a resultados. Respuestas concisas. Hablas en español.`,

  cotizador: `Eres Guana Go 🌴, el cotizador oficial de turismo de San Andrés Isla, Colombia.

REGLAS DE NEGOCIO:
1. NO se puede reservar para hoy. Si preguntan por hoy, sugiere mañana.
2. Caribbean Night (Noche Blanca) SOLO los VIERNES.
3. Precios en COP (pesos colombianos). Menciona USD solo si el cliente lo pide.
4. Agrega 20% de margen operativo al precio neto del catálogo.
5. Sé amigable, usa emojis, tono caribeño. Respuestas máx 200 palabras.

CÁLCULO DE GRUPOS:
- Taxi estándar (1–4 pax): desde $13,000 COP
- Van/Microbús (5+ pax): desde $26,000 COP
- Habitaciones: 2 personas por habitación (redondea hacia arriba)

FLUJO DE COTIZACIÓN:
1. Preguntar: ¿cuántas personas? (adultos / niños / bebés)
2. Preguntar: fechas de viaje (check-in y check-out)
3. Sugerir: tours + alojamiento según grupo y presupuesto
4. Calcular: total con desglose claro

GUARDAR COTIZACIÓN: Cuando el usuario confirme una cotización, incluye EXACTAMENTE al FINAL (sin markdown extra):
{"action":"save_cotizacion","items":[],"total":0,"personas":0,"checkIn":"YYYY-MM-DD","checkOut":"YYYY-MM-DD"}`,

  turista: `Eres Guana 🌴, el guía turístico inteligente de GuanaGO para San Andrés y Providencia, Colombia.

Ayudas a turistas a:
- Descubrir qué hacer en la isla (tours, playas, gastronomía, eventos caribeños)
- Planificar su itinerario día a día
- Entender la cultura Raizal auténtica
- Navegar la app GuanaGO (carrito, mapa, wallet, beneficios)

TONO: Amigable, apasionado por el Caribe. Respuestas cortas y útiles. Máx 150 palabras.

Cuando el usuario quiera ver servicios, incluye al final:
{"action":"show_catalog","filter":"tours|hoteles|eventos"}

Cuando quiera cotizar:
{"action":"start_cotizacion"}`,
};

// ─── Cargar catálogo desde Airtable (cache 5 min) ────────────────────────────

let _catalogCache = '';
let _catalogTs = 0;

async function loadCatalogContext() {
  if (_catalogCache && Date.now() - _catalogTs < 5 * 60 * 1000) return _catalogCache;

  try {
    const { apiKey, baseId } = config.airtable;
    if (!apiKey || !baseId) return '';

    const url = `https://api.airtable.com/v0/${baseId}/ServiciosTuristicos_SAI`
      + `?maxRecords=30&fields[]=Nombre&fields[]=Precio&fields[]=Tipo&fields[]=Capacidad`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return '';

    const data = await res.json();
    _catalogCache = (data.records || [])
      .map(r => `- ${r.fields?.Nombre || '?'} | ${r.fields?.Tipo || 'Servicio'} | $${(r.fields?.Precio || 0).toLocaleString('es-CO')} COP | Cap: ${r.fields?.Capacidad || '?'} pax`)
      .join('\n');
    _catalogTs = Date.now();
  } catch {
    // silencioso — el catálogo es contexto extra, no crítico
  }
  return _catalogCache;
}

// ─── Extraer y limpiar action JSON de la respuesta ───────────────────────────

function extractAction(text) {
  try {
    const match = text.match(/\{"action"[\s\S]*?\}/);
    if (match) return JSON.parse(match[0]);
  } catch { /* ignore */ }
  return null;
}

function cleanText(text, action) {
  if (!action) return text;
  return text.replace(/\{"action"[\s\S]*?\}/, '').trim();
}

// ─── Convertir historial al formato de Claude ─────────────────────────────────

function toClaudeMessages(history, currentMessage) {
  const msgs = history
    .slice(-12)
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({ role: m.role, content: m.content }));

  msgs.push({ role: 'user', content: currentMessage });
  return msgs;
}

// ─── Chat principal ───────────────────────────────────────────────────────────

export async function agentChat({
  message,
  mode = 'turista',
  history = [],
  userId,
  conversationId,
  context = {},
}) {
  if (!config.anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY no configurada en el servidor');
  }

  const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });
  const model = MODELS[mode] || MODELS.turista;

  // Cargar catálogo si hace falta
  if (!context.catalogo && (mode === 'cotizador' || mode === 'turista')) {
    context.catalogo = await loadCatalogContext();
  }

  // System prompt: parte estática (cacheada) + parte dinámica
  const staticPrompt = STATIC_PROMPTS[mode] || STATIC_PROMPTS.turista;

  // Contexto dinámico (cambia por request — no se cachea)
  const fecha = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  let dynamicContext = `\nFECHA ACTUAL: ${fecha}`;

  if (mode === 'admin' && context.stats) {
    const s = context.stats;
    const urgentes = (context.tareasUrgentes || []).slice(0, 6);
    dynamicContext += `

ESTADO DEL PROYECTO:
- Proyectos activos: ${s.proyectos || 0}
- Tareas: ${s.total || 0} total | ${s.completadas || 0} completadas (${s.progresoPct || 0}%) | ${s.criticas || 0} críticas | ${s.bloqueadas || 0} bloqueadas

TAREAS URGENTES:
${urgentes.map(t => `- [${t.prioridad?.toUpperCase()}] ${t.titulo}: ${t.descripcion || ''}`).join('\n') || 'Sin tareas críticas pendientes.'}`;
  }

  if (context.catalogo) {
    dynamicContext += `\n\nCATÁLOGO ACTIVO (datos reales Airtable):\n${context.catalogo}`;
  }

  // Construir request con prompt caching en la parte estática
  const response = await anthropic.messages.create({
    model,
    max_tokens: mode === 'admin' ? 1500 : 600,
    system: [
      {
        type: 'text',
        text: staticPrompt,
        cache_control: { type: 'ephemeral' },   // ← cachea el prompt base (5 min TTL)
      },
      {
        type: 'text',
        text: dynamicContext,                    // ← contexto dinámico (no se cachea)
      },
    ],
    messages: toClaudeMessages(history, message),
  });

  const rawResponse = response.content[0]?.text
    || 'Estoy teniendo problemas. Intenta de nuevo. 🌴';

  const action = extractAction(rawResponse);
  const cleanResponse = cleanText(rawResponse, action);

  // Persistir en Firestore (no bloquea la respuesta)
  const convId = conversationId || `conv-${Date.now()}`;
  if (userId) {
    firestore.saveMessage(userId, convId, { role: 'user', content: message, mode }).catch(() => {});
    firestore.saveMessage(userId, convId, {
      role: 'assistant', content: rawResponse, mode, action: action?.action,
      model, inputTokens: response.usage?.input_tokens,
    }).catch(() => {});
    firestore.logEvent('agent_chat', { userId, mode, hasAction: !!action, model }).catch(() => {});
  }

  // Persistir cotización si el agente la confirmó
  if (action?.action === 'save_cotizacion') {
    const cotId = `QT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
    const saved = await firestore.saveCotizacion({
      id: cotId,
      userId: userId || 'anonymous',
      mode,
      ...action,
      status: 'draft',
      generatedBy: 'claude',
    }).catch(() => null);
    if (saved) action.cotizacionId = saved;
  }

  // Persistir tarea si el agente la creó (modo admin)
  if (action?.action === 'create_task' && mode === 'admin') {
    firestore.saveTorreTask({
      id: `agent-${Date.now()}`,
      ...action,
      estado: 'pendiente',
      creadaEn: new Date().toISOString(),
      origen: 'agent_ia',
    }).catch(() => {});
  }

  return {
    response: cleanResponse,
    action,
    conversationId: convId,
    model,
    mode,
    usage: response.usage,   // input/output tokens para monitorear costo
  };
}
