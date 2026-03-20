/**
 * agentService.js — GuanaGO AI Agent
 *
 * Agente IA multi-modo sobre Groq/Llama con memoria en Firestore.
 *
 * Modos:
 *   turista   → guia turístico público, descubre la isla
 *   cotizador → cotizador inteligente, calcula precios de tours/hoteles
 *   admin     → agente estratégico para el CEO, gestiona tareas y métricas
 *
 * Acciones estructuradas que puede devolver el agente:
 *   { "action": "create_task", "seccion": "...", "titulo": "...", "prioridad": "..." }
 *   { "action": "save_cotizacion", "items": [...], "total": 0, "personas": 0 }
 *   { "action": "show_catalog", "filter": "tours|hoteles|eventos" }
 *   { "action": "start_cotizacion" }
 */

import { config } from '../config.js';
import * as firestore from './firestoreService.js';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

// ─── System prompts por modo ──────────────────────────────────────────────────

function buildSystemPrompt(mode, context = {}) {
  const fecha = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  if (mode === 'admin') {
    const stats = context.stats || {};
    const urgentes = (context.tareasUrgentes || []).slice(0, 6);
    return `Eres GuanaGO Strategy Agent — el asistente de administración y estrategia del CEO de GuanaGO.

FECHA ACTUAL: ${fecha}

ESTADO DEL PROYECTO:
- Proyectos activos: ${stats.proyectos || 0}
- Tareas totales: ${stats.total || 0}
- Completadas: ${stats.completadas || 0} (${stats.progresoPct || 0}%)
- En progreso: ${stats.enProgreso || 0}
- Criticas pendientes: ${stats.criticas || 0}
- Bloqueadas: ${stats.bloqueadas || 0}

TAREAS URGENTES:
${urgentes.map(t => `- [${t.prioridad?.toUpperCase()}] ${t.titulo}: ${t.descripcion || ''}`).join('\n') || 'Sin tareas criticas pendientes.'}

CATALOGO ACTIVO:
${context.catalogo || 'Conectado a Airtable ServiciosTuristicos_SAI + Firebase Firestore.'}

CAPACIDADES:
Puedes analizar el estado del proyecto, sugerir prioridades, proponer tareas, revisar metricas, recomendar estrategias de marketing, comerciales y de tecnologia (Firebase, blockchain, tokens, GuiaSAI B2B).

IMPORTANTE: Cuando el usuario pida crear una tarea, incluye al FINAL de tu respuesta EXACTAMENTE este JSON (sin markdown):
{"action":"create_task","seccion":"id_seccion","titulo":"titulo de la tarea","descripcion":"descripcion detallada","prioridad":"critica|alta|media|baja"}

Secciones disponibles: aliados, pagos, lanzamiento, firebase, ia, comercial, b2c, b2b, ceo, marca, guiasai_agencias, lean_canvas, marketing, tokens_blockchain

TONO: Profesional, directo, orientado a resultados. Respuestas concisas.`;
  }

  if (mode === 'cotizador') {
    return `Eres Guana Go, el cotizador oficial de turismo de San Andres Isla, Colombia.

FECHA ACTUAL: ${fecha}

REGLAS:
1. NO se puede reservar para hoy. Si preguntan por hoy, sugiere manana.
2. Caribbean Night (Noche Blanca) SOLO los VIERNES.
3. Precios en COP (pesos colombianos).
4. Sé amigable, usa emojis, tono caribeno.
5. Agrega 20% de margen operativo al precio neto.

CATALOGO DISPONIBLE:
${context.catalogo || 'Cargando catalogo...'}

FLUJO DE COTIZACION:
1. Preguntar: cuantas personas? (adultos/ninos/bebes)
2. Preguntar: fechas de viaje (check-in y check-out)
3. Sugerir: tours + alojamiento segun grupo y presupuesto
4. Calcular: total con desglose claro

CALCULO GRUPOS:
- Taxi estandar (1-4 pax): desde $13,000 COP
- Van/Microbus (5+ pax): desde $26,000 COP
- Habitaciones: 2 personas por habitacion

Cuando el usuario confirme una cotizacion, incluye EXACTAMENTE al FINAL (sin markdown):
{"action":"save_cotizacion","items":[],"total":0,"personas":0,"checkIn":"YYYY-MM-DD","checkOut":"YYYY-MM-DD"}`;
  }

  // mode === 'turista' (default)
  return `Eres Guana, el guia turistico inteligente de GuanaGO para San Andres y Providencia, Colombia.

FECHA ACTUAL: ${fecha}

Ayudas a turistas a:
- Descubrir que hacer en San Andres (tours, playas, gastronomia, eventos caribenos)
- Planificar su itinerario dia a dia
- Entender la cultura raizal autentica
- Navegar la app GuanaGO (carrito, mapa, wallet, beneficios)

CATALOGO:
${context.catalogo || 'Tours, hoteles y paquetes disponibles en la app.'}

TONO: Amigable, apasionado por el Caribe, respuestas cortas y utiles.

Cuando el usuario quiera ver servicios, incluye al final:
{"action":"show_catalog","filter":"tours|hoteles|eventos"}

Cuando quiera cotizar:
{"action":"start_cotizacion"}`;
}

// ─── Cargar catalogo desde Airtable para contexto ─────────────────────────────

async function loadCatalogContext() {
  try {
    const { apiKey, baseId } = config.airtable;
    if (!apiKey || !baseId) return '';

    const url = `https://api.airtable.com/v0/${baseId}/ServiciosTuristicos_SAI`
      + `?maxRecords=25&fields[]=Nombre&fields[]=Precio&fields[]=Tipo&fields[]=Capacidad`;

    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return '';

    const data = await res.json();
    return (data.records || []).map(r =>
      `- ${r.fields?.Nombre || 'Sin nombre'} | ${r.fields?.Tipo || 'Servicio'} | $${(r.fields?.Precio || 0).toLocaleString('es-CO')} COP | Cap: ${r.fields?.Capacidad || '?'} pax`
    ).join('\n');
  } catch {
    return '';
  }
}

// ─── Extraer action JSON de la respuesta del modelo ──────────────────────────

function extractAction(text) {
  try {
    const match = text.match(/\{"action"[\s\S]*?\}/);
    if (match) return JSON.parse(match[0]);
  } catch { /* ignore */ }
  return null;
}

function cleanResponseText(text, action) {
  if (!action) return text;
  return text.replace(/\{"action"[\s\S]*?\}/, '').trim();
}

// ─── Chat principal del agente ────────────────────────────────────────────────

export async function agentChat({
  message,
  mode = 'turista',
  history = [],
  userId,
  conversationId,
  context = {},
}) {
  if (!config.groqApiKey) {
    throw new Error('GROQ_API_KEY no configurada en el servidor');
  }

  // Enriquecer contexto con catalogo Airtable si no viene del cliente
  if (!context.catalogo && (mode === 'cotizador' || mode === 'turista')) {
    context.catalogo = await loadCatalogContext();
  }

  const systemPrompt = buildSystemPrompt(mode, context);

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-12).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ];

  const groqRes = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.groqApiKey}`,
    },
    body: JSON.stringify({ model: MODEL, messages, temperature: 0.7, max_tokens: 1200 }),
    signal: AbortSignal.timeout(15000),
  });

  if (!groqRes.ok) {
    const err = await groqRes.text();
    throw new Error(`Groq error ${groqRes.status}: ${err}`);
  }

  const groqData = await groqRes.json();
  const rawResponse = groqData.choices?.[0]?.message?.content
    || 'Estoy teniendo problemas. Intenta de nuevo. Disculpa la molestia.';

  const action = extractAction(rawResponse);
  const response = cleanResponseText(rawResponse, action);

  // Persistir conversacion en Firestore (no bloqueante)
  const convId = conversationId || `conv-${Date.now()}`;
  if (userId) {
    firestore.saveMessage(userId, convId, { role: 'user', content: message, mode }).catch(() => {});
    firestore.saveMessage(userId, convId, {
      role: 'assistant', content: rawResponse, mode, action: action?.action,
    }).catch(() => {});
    firestore.logEvent('agent_chat', { userId, mode, hasAction: !!action }).catch(() => {});
  }

  // Si el agente quiere guardar una cotizacion, persistirla
  if (action?.action === 'save_cotizacion') {
    const cotId = `QT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
    const saved = await firestore.saveCotizacion({
      id: cotId,
      userId: userId || 'anonymous',
      mode,
      ...action,
      status: 'draft',
      generatedBy: 'agent',
    }).catch(() => null);
    if (saved) action.cotizacionId = saved;
  }

  // Si el agente quiere crear una tarea (modo admin), guardarla en Firestore
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
    response,
    action,
    conversationId: convId,
    model: MODEL,
    mode,
  };
}
