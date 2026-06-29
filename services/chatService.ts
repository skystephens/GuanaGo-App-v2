/**
 * Chat Service — GuanaGO
 *
 * Llama al backend que usa Claude (Anthropic) para cotizaciones
 * y Groq llama-3.3-70b para atención general.
 * Las API keys NUNCA se exponen en el frontend.
 */

export interface ChatResponse {
  reply: string;
  model?: string;
}

export interface AtencionResponse {
  reply: string;
  escalado: boolean;
  id_chat?: string | null;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Palabras que indican intención de cotización — se desvían a /api/chatbot/cotizar
const KEYWORDS_COTIZACION = [
  'cotiza', 'cotizar', 'precio', 'cuánto cuesta', 'cuanto cuesta',
  'cuánto vale', 'cuanto vale', 'reservar', 'reserva', 'tarifa', 'tarifas',
  'cuánto cobran', 'cuanto cobran',
];

export function esMensajeCotizacion(mensaje: string): boolean {
  const lower = mensaje.toLowerCase();
  return KEYWORDS_COTIZACION.some(k => lower.includes(k));
}

/**
 * Cotizador inteligente — delega al backend /api/chatbot/cotizar
 * El backend usa Claude Haiku con contexto real de Airtable.
 */
export const cotizar = async (
  mensaje: string,
  historial: ChatMessage[] = [],
  _usuarioId?: string
): Promise<ChatResponse> => {
  try {
    const response = await fetch(`${API_URL}/chatbot/cotizar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mensaje,
        historial: historial.slice(-8),
        usuario_id: _usuarioId,
      }),
    });

    if (!response.ok) throw new Error(`Backend error: ${response.status}`);

    const data = await response.json();
    return { reply: data.response || '¿En qué puedo ayudarte? 🌴', model: data.model };

  } catch (error) {
    console.error('Error en chatService.cotizar:', error);

    const lower = mensaje.toLowerCase();
    let reply = '🌴 Soy Guana Go. Estoy teniendo un problema técnico. ¿Puedes intentar de nuevo?';
    if (lower.includes('cotiz') || lower.includes('precio')) {
      reply = '🌴 Para cotizar tours visita "Planifica" y te doy precios actualizados. ¿Cuántas personas son?';
    } else if (lower.includes('hotel') || lower.includes('alojam')) {
      reply = '🏨 Tenemos hoteles disponibles. Ve a "Planifica" → "Hoteles" para ver opciones y precios.';
    } else if (lower.includes('taxi') || lower.includes('traslad')) {
      reply = '🚕 Las tarifas de taxi varían por zona. Consulta "Planifica" → "Traslados".';
    } else if (lower.includes('tour') || lower.includes('paseo') || lower.includes('excurs')) {
      reply = '🎯 Tenemos tours increíbles: Acuario, Johnny Cay, Vuelta a la isla. ¿Cuántos van?';
    } else if (lower.includes('caribbean') || lower.includes('noche') || lower.includes('rimm')) {
      reply = '🎵 Caribbean Night es los VIERNES. ¡Música en vivo, ambiente caribeño! ¿Te interesa reservar?';
    }
    return { reply };
  }
};

/**
 * Chat de atención general — delega al backend /api/chatbot/atencion
 * El backend usa Groq llama-3.3-70b + RAG público de Airtable.
 * Si la IA no puede resolver, crea un registro en Chats_Atencion (escalado=true).
 */
export const atender = async (
  mensaje: string,
  historial: ChatMessage[] = [],
  usuarioId?: string | null
): Promise<AtencionResponse> => {
  try {
    const response = await fetch(`${API_URL}/chatbot/atencion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mensaje,
        historial: historial.slice(-8),
        usuario_id: usuarioId || null,
      }),
    });

    if (!response.ok) throw new Error(`Backend error: ${response.status}`);

    const data = await response.json();
    return {
      reply: data.respuesta || '¿En qué puedo ayudarte? 🌴',
      escalado: data.escalado ?? false,
      id_chat: data.id_chat || null,
    };

  } catch (error) {
    console.error('Error en chatService.atender:', error);
    return {
      reply: '🌴 Tengo un problema técnico momentáneo. ¿Puedes intentar de nuevo en un momento?',
      escalado: false,
    };
  }
};

/**
 * Función legacy — redirige a cotizar
 */
export const sendMessage = async (
  userMessage: string,
  _userLanguage: string
): Promise<ChatResponse> => {
  return cotizar(userMessage, []);
};
