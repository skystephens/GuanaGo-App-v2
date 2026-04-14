import Anthropic from '@anthropic-ai/sdk';
import { makeRequest, registrarLogTrazabilidad } from '../utils/helpers.js';
import { config } from '../config.js';

// Cache de catálogo para no llamar Airtable en cada request
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

// System prompt estático — se cachea en Claude (ephemeral, 5 min TTL)
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
          cache_control: { type: 'ephemeral' },  // prompt base cacheado
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
