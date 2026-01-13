
// URLs de los endpoints
const BACKEND_URL = 'https://guanago-backend.onrender.com';
const MAKE_API_URL = 'https://hook.us1.make.com/gleyxf83giw4xqr7i6i94mb7syclmh2o';

export interface ChatResponse {
  reply: string;
  model?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Cotizador inteligente con Groq AI
 * Usa el backend de Render que conecta con Groq (llama-3.3-70b)
 */
export const cotizar = async (
  mensaje: string, 
  historial: ChatMessage[] = [],
  usuarioId?: string
): Promise<ChatResponse> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/chatbot/cotizar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mensaje,
        historial,
        usuario_id: usuarioId
      }),
    });

    const data = await response.json();
    
    if (data.success && data.response) {
      return { 
        reply: data.response,
        model: data.model
      };
    }
    
    // Fallback a Make.com si el backend falla
    return sendMessage(mensaje, 'es');

  } catch (error) {
    console.error("Error en cotizador Groq:", error);
    // Fallback a Make.com
    return sendMessage(mensaje, 'es');
  }
};

/**
 * Envía el mensaje del usuario a la IA (Make.com RAG).
 * Incluye un flag de contexto para activar el RAG con la tabla "Procedimientos Rag".
 */
export const sendMessage = async (userMessage: string, userLanguage: string): Promise<ChatResponse> => {
  try {
    const response = await fetch(MAKE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'CHAT_WITH_RAG',
        ragTable: 'Procedimientos Rag',
        message: userMessage,
        userLanguage: userLanguage,
        systemInstruction: "Eres Guana, un asistente experto en logística de San Andrés. Antes de responder dudas sobre seguros, cancelaciones o protocolos, consulta los SOP de la tabla Procedimientos Rag."
      }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return data || { reply: "Lo siento, tuve un problema consultando los manuales de logística. ¿Puedes repetir tu pregunta?" }; 

  } catch (error) {
    console.error("Error sending message to Guana AI:", error);
    return { 
      reply: "¡Hola! Soy Guana. En este momento estoy experimentando problemas técnicos al consultar nuestros procedimientos. Por favor, intenta de nuevo más tarde." 
    };
  }
};
