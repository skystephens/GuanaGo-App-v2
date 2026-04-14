/**
 * Chat Service — GuanaGO
 *
 * Llama al backend que usa Claude (Anthropic).
 * La API key NUNCA se expone en el frontend.
 */

export interface ChatResponse {
  reply: string;
  model?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const API_URL = import.meta.env.VITE_API_URL || '/api';

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
        historial: historial.slice(-8),  // últimos 8 mensajes
        usuario_id: _usuarioId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const data = await response.json();

    return {
      reply: data.response || '¿En qué puedo ayudarte? 🌴',
      model: data.model,
    };

  } catch (error) {
    console.error('Error en chatService.cotizar:', error);

    // Fallback inteligente mientras el backend no responde
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
 * Función legacy — redirige a cotizar
 */
export const sendMessage = async (
  userMessage: string,
  _userLanguage: string
): Promise<ChatResponse> => {
  return cotizar(userMessage, []);
};
