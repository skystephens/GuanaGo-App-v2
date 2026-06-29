import Anthropic from '@anthropic-ai/sdk';
import { makeRequest, registrarLogTrazabilidad } from '../utils/helpers.js';
import { config } from '../config.js';

// ─── Cache de catálogo (cotizador) ───────────────────────────────────────────
let _catalogCache = '';
let _catalogTs = 0;

async function loadCatalog() {
  if (_catalogCache && Date.now() - _catalogTs < 5 * 60 * 1000) return _catalogCache;
  try {
    const { apiKey, baseId } = config.airtable;
    if (!apiKey || !baseId) return '';
    const url = `https://api.airtable.com/v0/${baseId}/ServiciosTuristicos_SAI?maxRecords=20&fields[]=Nombre&fields[]=Precio&fields[]=Tipo`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return '';
    const data = await res.json();
    _catalogCache = (data.records || [])
      .map(r => `- ${r.fields?.Nombre || '?'} (${r.fields?.Tipo || 'Servicio'}): $${(r.fields?.Precio || 0).toLocaleString('es-CO')} COP`)
      .join('\n');
    _catalogTs = Date.now();
  } catch { /* silencioso */ }
  return _catalogCache;
}

// ─── System prompt cotizador ─────────────────────────────────────────────────
const SYSTEM_STATIC = `Eres Guana Go 🌴, el anfitrión oficial de turismo de San Andrés Isla, Colombia.

REGLAS:
1. NO se puede reservar para hoy. Si preguntan por hoy, sugiere mañana.
2. Caribbean Night SOLO los VIERNES.
3. Precios en COP. Tono caribeño, emojis, conciso (máx 200 palabras).
4. Agrega 20% de margen operativo al precio neto del catálogo.

CÁLCULO GRUPOS:
- Taxi estándar (1–4 pax): desde $13,000 COP
- Van/Microbús (5+ pax): desde $26,000 COP
- Habitaciones: 2 personas por habitación (redondea arriba)

FLUJO: pregunta personas → fechas → sugiere → calcula con desglose.`;

/**
 * Cotizador inteligente con Claude (Haiku — rápido y preciso)
 */
export const cotizar = async (req, res, next) => {
  try {
    const { mensaje, historial = [], usuario_id } = req.body;

    if (!mensaje) {
      return res.status(400).json({ success: false, error: 'El mensaje es requerido' });
    }
    if (!config.anthropicApiKey) {
      return res.status(500).json({ success: false, error: 'ANTHROPIC_API_KEY no configurada' });
    }

    const catalogo = await loadCatalog();
    const fecha = new Date().toLocaleDateString('es-CO', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

    const messages = [
      ...historial.slice(-8).map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      })),
      { role: 'user', content: mensaje },
    ];

    const claudeRes = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: [
        {
          type: 'text',
          text: SYSTEM_STATIC,
          cache_control: { type: 'ephemeral' },
        },
        {
          type: 'text',
          text: `FECHA: ${fecha}\n\nCATÁLOGO ACTUAL (Airtable):\n${catalogo || 'Ver catálogo en la app.'}`,
        },
      ],
      messages,
    });

    const respuesta = claudeRes.content[0]?.text
      || '¡Hola! 🌴 Soy Guana Go. ¿En qué puedo ayudarte?';

    res.json({
      success: true,
      response: respuesta,
      model: 'claude-haiku-4-5-20251001',
      usage: claudeRes.usage,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Error en cotizador Claude:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      response: '¡Hola! 🌴 Soy Guana Go. Tengo un problema técnico. Intenta de nuevo en un momento.',
    });
  }
};

/**
 * Enviar mensaje al chatbot Guana
 */
export const sendMessage = async (req, res, next) => {
  try {
    const { message, context, conversationId } = req.body;
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'El mensaje es requerido'
      });
    }

    const result = await makeRequest(
      config.makeWebhooks.chatbot,
      {
        action: 'chat',
        message,
        context,
        conversationId,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      },
      'CHATBOT_MESSAGE'
    );

    res.json({
      success: true,
      response: result.response || result.message,
      conversationId: result.conversationId,
      suggestions: result.suggestions || []
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener historial de conversación
 */
export const getConversationHistory = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    const result = await makeRequest(
      config.makeWebhooks.chatbot,
      {
        action: 'getHistory',
        conversationId,
        userId: req.user?.id
      },
      'GET_CHAT_HISTORY'
    );

    res.json({
      success: true,
      data: result.history || []
    });
  } catch (error) {
    next(error);
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// CHAT DE ATENCIÓN — endpoints nuevos (Groq llama-3.3-70b)
// ═══════════════════════════════════════════════════════════════════════════════

const TABLE_CHATS_ATENCION    = 'tblUwoBPPdW8iR4YK';
const TABLE_PROCEDIMIENTOS    = 'tblOvlFanUiguceZo';
const TABLE_DIRECTORIO_MAPA   = 'tblbrq0U77RAjgG9N';
const TABLE_SERVICIOS         = 'tblTp0v7EoCjNHU4W';
const TABLE_ALOJAMIENTOS      = 'tblUNglGMsxDZYZPs';

let _ragCache = '';
let _ragTs = 0;

async function getProcedimientosRAG() {
  if (_ragCache && Date.now() - _ragTs < 10 * 60 * 1000) return _ragCache;
  try {
    const { apiKey, baseId } = config.airtable;
    if (!apiKey) return '';
    const filter = encodeURIComponent(`{Audiencia}='chatbot_publico'`);
    const url = `https://api.airtable.com/v0/${baseId}/${TABLE_PROCEDIMIENTOS}?maxRecords=60&filterByFormula=${filter}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return '';
    const data = await res.json();
    _ragCache = (data.records || [])
      .map(r => {
        const f = r.fields;
        const titulo    = f.Titulo    || f.Pregunta  || '';
        const contenido = f.Contenido || f.Respuesta || '';
        return titulo && contenido ? `[${titulo}]: ${contenido}` : (contenido || titulo);
      })
      .filter(Boolean)
      .join('\n---\n');
    _ragTs = Date.now();
  } catch { /* silencioso */ }
  return _ragCache;
}

let _dirCache = '';
let _dirTs = 0;

async function getDirectorioResumen() {
  if (_dirCache && Date.now() - _dirTs < 15 * 60 * 1000) return _dirCache;
  try {
    const { apiKey, baseId } = config.airtable;
    if (!apiKey) return '';
    const url = `https://api.airtable.com/v0/${baseId}/${TABLE_DIRECTORIO_MAPA}?maxRecords=30&fields[]=Nombre&fields[]=Tipo&fields[]=Descripcion&fields[]=Horario`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return '';
    const data = await res.json();
    _dirCache = (data.records || [])
      .map(r => {
        const f = r.fields;
        return [f.Nombre, f.Tipo && `(${f.Tipo})`, f.Descripcion, f.Horario && `Horario: ${f.Horario}`]
          .filter(Boolean).join(' ');
      })
      .filter(Boolean)
      .join('\n');
    _dirTs = Date.now();
  } catch { /* silencioso */ }
  return _dirCache;
}

let _svcCache = '';
let _svcTs = 0;

async function getServiciosContext() {
  if (_svcCache && Date.now() - _svcTs < 10 * 60 * 1000) return _svcCache;
  try {
    const { apiKey, baseId } = config.airtable;
    if (!apiKey) return '';
    const fields = ['Nombre', 'Tipo', 'Precio_GuanaGo', 'Descripcion', 'Duracion', 'Incluye', 'Notas'].map(f => `fields[]=${encodeURIComponent(f)}`).join('&');
    const url = `https://api.airtable.com/v0/${baseId}/${TABLE_SERVICIOS}?maxRecords=50&${fields}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return '';
    const data = await res.json();
    _svcCache = (data.records || [])
      .filter(r => r.fields?.Nombre)
      .map(r => {
        const f = r.fields;
        const precio = f.Precio_GuanaGo ? `$${Number(f.Precio_GuanaGo).toLocaleString('es-CO')} COP` : '';
        const partes = [
          f.Nombre,
          f.Tipo && `(${f.Tipo})`,
          precio && `Precio: ${precio}`,
          f.Duracion && `Duración: ${f.Duracion}`,
          f.Descripcion,
          f.Incluye && `Incluye: ${f.Incluye}`,
          f.Notas,
        ].filter(Boolean);
        return partes.join(' · ');
      })
      .join('\n');
    _svcTs = Date.now();
  } catch { /* silencioso */ }
  return _svcCache;
}

let _aloCache = '';
let _aloTs = 0;

async function getAlojamientosContext() {
  if (_aloCache && Date.now() - _aloTs < 10 * 60 * 1000) return _aloCache;
  try {
    const { apiKey, baseId } = config.airtable;
    if (!apiKey) return '';
    const fields = ['Nombre', 'Tipo', 'Precio_GuanaGo', 'Descripcion', 'Capacidad', 'Servicios', 'Notas'].map(f => `fields[]=${encodeURIComponent(f)}`).join('&');
    const url = `https://api.airtable.com/v0/${baseId}/${TABLE_ALOJAMIENTOS}?maxRecords=50&${fields}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return '';
    const data = await res.json();
    _aloCache = (data.records || [])
      .filter(r => r.fields?.Nombre)
      .map(r => {
        const f = r.fields;
        const precio = f.Precio_GuanaGo ? `desde $${Number(f.Precio_GuanaGo).toLocaleString('es-CO')} COP/noche` : '';
        const partes = [
          f.Nombre,
          f.Tipo && `(${f.Tipo})`,
          precio && `Precio: ${precio}`,
          f.Capacidad && `Capacidad: ${f.Capacidad}`,
          f.Descripcion,
          f.Servicios && `Servicios: ${f.Servicios}`,
          f.Notas,
        ].filter(Boolean);
        return partes.join(' · ');
      })
      .join('\n');
    _aloTs = Date.now();
  } catch { /* silencioso */ }
  return _aloCache;
}

async function crearRegistroChatAtencion({ mensaje_usuario, historial_conversacion, respuesta_ia_tentativa, usuario_id, origen, estado }) {
  try {
    const { apiKey, baseId } = config.airtable;
    if (!apiKey) return null;
    const res = await fetch(`https://api.airtable.com/v0/${baseId}/${TABLE_CHATS_ATENCION}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          Fecha: new Date().toISOString(),
          Mensaje_Usuario: mensaje_usuario,
          Historial_Conversacion: historial_conversacion,
          Respuesta_IA_Tentativa: respuesta_ia_tentativa || '',
          ...(usuario_id ? { Usuario_ID: String(usuario_id) } : {}),
          Origen: origen,
          Estado: estado,
        },
        typecast: true,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.id || null;
  } catch { return null; }
}

const PALABRAS_ESCALAR = [
  'queja', 'reclamo', 'reembolso', 'devoluci', 'cancelaci',
  'error de cobro', 'problema con pago', 'me cobraron', 'cobro incorrecto',
];

const SYSTEM_ATENCION = `Eres el asistente de atención de GuanaGO para el archipiélago de San Andrés, Providencia y Santa Catalina. Respondes solo con información de las fuentes de contexto que se te entregan (procedimientos públicos y directorio de lugares).

Si la información para responder con seguridad NO está en el contexto entregado, no inventes. Responde exactamente con la palabra clave [ESCALAR] al inicio de tu respuesta, seguido de un mensaje breve y amable para el usuario indicando que el equipo le confirmará pronto.

Nunca reveles información de negocio interna (comisiones, costos, márgenes, utilidad, saldos de empresa). Si el usuario pregunta por eso, responde [ESCALAR] también.

Tono: amable, caribeño, conciso (máx 200 palabras).`;

/**
 * Chat de atención general — usa Groq llama-3.3-70b + RAG público Airtable
 */
export const atender = async (req, res, next) => {
  try {
    const { mensaje, historial = [], usuario_id } = req.body;
    if (!mensaje) return res.status(400).json({ success: false, error: 'El mensaje es requerido' });

    const groqKey = config.groqApiKey;
    if (!groqKey) {
      // Sin API key: escalar el chat para que el equipo lo vea en el panel admin
      console.warn('⚠️  GROQ_API_KEY no configurada — escalando chat sin IA');
      const idChat = await crearRegistroChatAtencion({
        mensaje_usuario: mensaje,
        historial_conversacion: JSON.stringify(historial.slice(-6)),
        respuesta_ia_tentativa: '',
        usuario_id: usuario_id || null,
        origen: 'chat_web_publico',
        estado: 'pendiente',
      });
      return res.json({
        success: true,
        respuesta: '¡Hola! 🌴 Nuestro asistente está siendo configurado. Tu mensaje quedó registrado y el equipo de GuanaGO te responderá pronto.',
        escalado: true,
        id_chat: idChat,
      });
    }

    // Escalar de inmediato si el mensaje contiene palabras de queja/reclamo
    const msgLower = mensaje.toLowerCase();
    if (PALABRAS_ESCALAR.some(p => msgLower.includes(p))) {
      const idChat = await crearRegistroChatAtencion({
        mensaje_usuario: mensaje,
        historial_conversacion: JSON.stringify(historial.slice(-6)),
        respuesta_ia_tentativa: '',
        usuario_id: usuario_id || null,
        origen: 'chat_web_publico',
        estado: 'pendiente',
      });
      return res.json({
        success: true,
        respuesta: 'Voy a anotar tu consulta para que el equipo te confirme directamente. Gracias por tu paciencia 🙏',
        escalado: true,
        id_chat: idChat,
      });
    }

    // Cargar contexto público en paralelo
    const [procedimientos, directorio, servicios, alojamientos] = await Promise.all([
      getProcedimientosRAG(),
      getDirectorioResumen(),
      getServiciosContext(),
      getAlojamientosContext(),
    ]);

    const partes = [
      servicios      && `TOURS Y SERVICIOS (precios Precio_GuanaGo):\n${servicios}`,
      alojamientos   && `ALOJAMIENTOS (precios Precio_GuanaGo por noche):\n${alojamientos}`,
      directorio     && `DIRECTORIO DE LUGARES:\n${directorio}`,
      procedimientos && `PROCEDIMIENTOS Y POLÍTICAS:\n${procedimientos}`,
    ].filter(Boolean);

    const systemMsg = partes.length
      ? `${SYSTEM_ATENCION}\n\nCONTEXTO DISPONIBLE:\n${partes.join('\n\n')}`
      : SYSTEM_ATENCION;

    const messages = [
      ...historial.slice(-8).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
      { role: 'user', content: mensaje },
    ];

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 500,
        messages: [{ role: 'system', content: systemMsg }, ...messages],
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!groqRes.ok) throw new Error(`Groq error ${groqRes.status}`);
    const groqData = await groqRes.json();
    const rawRespuesta = groqData.choices?.[0]?.message?.content || '';

    const escalado = rawRespuesta.trimStart().startsWith('[ESCALAR]');
    const respuestaLimpia = escalado
      ? rawRespuesta.replace('[ESCALAR]', '').trim()
      : rawRespuesta;

    let idChat = null;
    if (escalado) {
      idChat = await crearRegistroChatAtencion({
        mensaje_usuario: mensaje,
        historial_conversacion: JSON.stringify(historial.slice(-6)),
        respuesta_ia_tentativa: respuestaLimpia,
        usuario_id: usuario_id || null,
        origen: 'chat_web_publico',
        estado: 'pendiente',
      });
    }

    res.json({ success: true, respuesta: respuestaLimpia, escalado, id_chat: idChat });

  } catch (error) {
    console.error('❌ Error en chat atención:', error);
    // Intentar guardar el chat aunque Groq haya fallado
    try {
      const { mensaje, historial = [], usuario_id } = req.body;
      await crearRegistroChatAtencion({
        mensaje_usuario: mensaje || '',
        historial_conversacion: JSON.stringify((historial || []).slice(-6)),
        respuesta_ia_tentativa: '',
        usuario_id: usuario_id || null,
        origen: 'chat_web_publico',
        estado: 'pendiente',
      });
    } catch { /* silencioso */ }
    // Siempre responder 200 al frontend — nunca mostrar error técnico al visitante
    res.json({
      success: true,
      respuesta: '¡Hola! 🌴 Tu mensaje quedó registrado. El equipo de GuanaGO te responderá pronto.',
      escalado: true,
      id_chat: null,
    });
  }
};

/**
 * Contacto directo con un asesor — sin pasar por la IA
 */
export const contactoDirecto = async (req, res) => {
  try {
    const { mensaje, nombre, usuario_id } = req.body;
    if (!mensaje) return res.status(400).json({ success: false, error: 'El mensaje es requerido' });
    const idChat = await crearRegistroChatAtencion({
      mensaje_usuario: nombre ? `[${nombre}] ${mensaje}` : mensaje,
      historial_conversacion: '[]',
      respuesta_ia_tentativa: '',
      usuario_id: usuario_id || null,
      origen: 'chat_web_publico',
      estado: 'pendiente',
    });
    res.json({
      success: true,
      respuesta: '¡Mensaje recibido! 🙌 Un asesor de GuanaGO te responderá pronto.',
      id_chat: idChat,
    });
  } catch (error) {
    console.error('❌ Error en contacto directo:', error);
    res.json({
      success: true,
      respuesta: '¡Mensaje recibido! 🙌 Un asesor de GuanaGO te responderá pronto.',
      id_chat: null,
    });
  }
};

/**
 * Conteo de chats pendientes — usado por el badge del admin
 */
export const pendientesAtencion = async (req, res) => {
  try {
    const { apiKey, baseId } = config.airtable;
    if (!apiKey) return res.json({ success: true, total: 0 });
    const filter = encodeURIComponent(`{Estado}='pendiente'`);
    const url = `https://api.airtable.com/v0/${baseId}/${TABLE_CHATS_ATENCION}?filterByFormula=${filter}&fields[]=Estado`;
    const airtableRes = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(6000),
    });
    if (!airtableRes.ok) return res.json({ success: true, total: 0 });
    const data = await airtableRes.json();
    res.json({ success: true, total: (data.records || []).length });
  } catch {
    res.json({ success: true, total: 0 });
  }
};

/**
 * Listar chats de atención (admin)
 */
export const listarChatsAtencion = async (req, res) => {
  try {
    const { apiKey, baseId } = config.airtable;
    if (!apiKey) return res.json({ success: true, data: [] });
    const estado = req.query.estado;
    const filterPart = estado ? `&filterByFormula=${encodeURIComponent(`{Estado}='${estado}'`)}` : '';
    const url = `https://api.airtable.com/v0/${baseId}/${TABLE_CHATS_ATENCION}?maxRecords=100&sort[0][field]=Fecha&sort[0][direction]=desc${filterPart}`;
    const airtableRes = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!airtableRes.ok) return res.json({ success: true, data: [] });
    const data = await airtableRes.json();
    res.json({ success: true, data: data.records || [] });
  } catch {
    res.json({ success: true, data: [] });
  }
};

/**
 * Actualizar estado de un chat (admin marca como revisado/resuelto)
 */
export const actualizarChatAtencion = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, notas_internas, revisado_por } = req.body;
    const { apiKey, baseId } = config.airtable;
    if (!apiKey || !id) return res.status(400).json({ success: false, error: 'Faltan parámetros' });
    const airtableRes = await fetch(`https://api.airtable.com/v0/${baseId}/${TABLE_CHATS_ATENCION}/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          ...(estado         ? { Estado: estado }                 : {}),
          ...(notas_internas ? { Notas_Internas: notas_internas } : {}),
          ...(revisado_por   ? { Revisado_Por: revisado_por }     : {}),
        },
        typecast: true,
      }),
    });
    if (!airtableRes.ok) throw new Error('Error al actualizar en Airtable');
    const data = await airtableRes.json();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
