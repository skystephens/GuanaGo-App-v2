import { makeRequest } from '../utils/helpers.js';
import { config } from '../config.js';

// Groq AI para cotizaciones inteligentes
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Cotizador inteligente con Groq AI
 * Recibe el mensaje del usuario y genera una cotización personalizada
 */
export const cotizar = async (req, res, next) => {
  try {
    const { mensaje, historial = [], usuario_id } = req.body;
    
    if (!mensaje) {
      return res.status(400).json({
        success: false,
        error: 'El mensaje es requerido'
      });
    }

    if (!config.groqApiKey) {
      return res.status(500).json({
        success: false,
        error: 'GROQ_API_KEY no configurada en el servidor'
      });
    }

    // Obtener servicios actuales para contexto
    let serviciosContext = '';
    try {
      const servicesResponse = await fetch(config.makeWebhooks.services, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'LIST_SERVICES_REAL', table: 'ServiciosTuristicos_SAI' })
      });
      const servicios = await servicesResponse.json();
      if (Array.isArray(servicios)) {
        serviciosContext = servicios.slice(0, 20).map(s => 
          `- ${s.fields?.Nombre || s.Nombre || s.title}: $${s.fields?.Precio || s.Precio || s.price} COP`
        ).join('\n');
      }
    } catch (e) {
      console.log('⚠️ No se pudieron cargar servicios de Airtable');
    }

    const fechaHoy = new Date().toLocaleDateString('es-CO', { 
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
    });

    // Construir historial de conversación
    const mensajesHistorial = historial.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    }));

    const systemPrompt = `Eres Guana Go, el anfitrión oficial de turismo de San Andrés Isla, Colombia. 🌴

FECHA ACTUAL: ${fechaHoy}

REGLAS IMPORTANTES:
1. NO se puede reservar para el mismo día (hoy). Si preguntan por hoy, sugiere mañana.
2. La Noche Blanca (Caribbean Night) SOLO opera los VIERNES.
3. Siempre muestra precios en COP (pesos colombianos).
4. Sé amigable, usa emojis y mantén un tono caribeño.

SERVICIOS DISPONIBLES:
${serviciosContext || 'Consulta nuestro catálogo en la app para ver opciones actualizadas.'}

CÁLCULO DE GRUPOS:
- Taxi estándar (1-4 personas): Desde $13,000 COP
- Van/Microbús (5+ personas): Desde $26,000 COP
- Habitaciones: Se calculan 2 personas por habitación

Cuando te pidan cotizar:
1. Pregunta cuántas personas (adultos, niños, infantes)
2. Pregunta las fechas del viaje
3. Ofrece opciones de tours y alojamiento
4. Calcula el total con desglose claro
5. Agrega 20% de margen operativo al precio neto

Responde de forma concisa y amigable.`;

    // Llamar a Groq AI
    const groqResponse = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.groqApiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...mensajesHistorial,
          { role: 'user', content: mensaje }
        ],
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!groqResponse.ok) {
      const errorData = await groqResponse.text();
      console.error('❌ Error Groq:', errorData);
      throw new Error(`Groq API error: ${groqResponse.status}`);
    }

    const groqData = await groqResponse.json();
    const respuesta = groqData.choices?.[0]?.message?.content || 
      '¡Hola! Soy Guana Go. Parece que tuve un problema procesando tu solicitud. ¿Puedes intentar de nuevo?';

    res.json({
      success: true,
      response: respuesta,
      model: 'llama-3.3-70b-versatile',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error en cotizador:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      response: '¡Hola! Soy Guana Go. Estoy experimentando problemas técnicos. Por favor intenta de nuevo en unos momentos. 🌴'
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
