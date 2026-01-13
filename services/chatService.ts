/**
 * Chat Service - Asistente Guana Go con Groq AI
 * Usa datos de Airtable para dar información actualizada de San Andrés
 */

import { airtableService } from './airtableService';

// Groq API - Usar variable de entorno
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface ChatResponse {
  reply: string;
  model?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Cache de contexto de servicios
let servicesContext: string = '';
let directoryContext: string = '';
let lastContextUpdate: number = 0;
const CONTEXT_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Cargar contexto de servicios desde Airtable
 */
async function loadServicesContext(): Promise<string> {
  const now = Date.now();
  if (servicesContext && (now - lastContextUpdate) < CONTEXT_TTL) {
    return servicesContext;
  }

  try {
    const services = await airtableService.getServices();
    const tours = services.filter(s => s.category === 'tour').slice(0, 12);
    const hotels = services.filter(s => s.category === 'hotel').slice(0, 8);
    
    servicesContext = `
TOURS DISPONIBLES EN SAN ANDRÉS:
${tours.map(t => `• ${t.title}: $${t.price?.toLocaleString()} COP/persona. ${t.duration || ''}. ${t.includes?.slice(0, 80) || ''}`).join('\n')}

HOTELES:
${hotels.map(h => `• ${h.title}: Desde $${h.price?.toLocaleString()} COP/noche`).join('\n')}
`;
    lastContextUpdate = now;
  } catch (error) {
    console.error('Error cargando contexto de servicios:', error);
    servicesContext = '';
  }
  
  return servicesContext;
}

/**
 * Cargar contexto del directorio desde Airtable
 */
async function loadDirectoryContext(): Promise<string> {
  const now = Date.now();
  if (directoryContext && (now - lastContextUpdate) < CONTEXT_TTL) {
    return directoryContext;
  }

  try {
    const places = await airtableService.getDirectoryPoints();
    const byCategory: Record<string, any[]> = {};
    
    places.forEach(p => {
      const cat = p.categoria || p.category || 'Otro';
      if (!byCategory[cat]) byCategory[cat] = [];
      if (byCategory[cat].length < 4) {
        byCategory[cat].push(p);
      }
    });
    
    directoryContext = `
DIRECTORIO DE SAN ANDRÉS:
${Object.entries(byCategory).map(([cat, items]) => 
  `${cat}: ${items.map(i => i.nombre || i.name).join(', ')}`
).join('\n')}
`;
  } catch (error) {
    console.error('Error cargando directorio:', error);
    directoryContext = '';
  }
  
  return directoryContext;
}

/**
 * Sistema de instrucciones para el asistente
 */
const SYSTEM_PROMPT = `Eres Guana Go 🌴, asistente de viajes experto en San Andrés, Colombia.

PERSONALIDAD:
- Amigable, entusiasta y conocedor de la isla
- Respuestas concisas (máx 150 palabras)
- Usas emojis ocasionalmente

CAPACIDADES:
1. Cotizar tours con precios reales de Airtable
2. Recomendar actividades según preferencias
3. Información de lugares (restaurantes, cajeros, farmacias)
4. Tarifas de taxi por zonas
5. Planificar itinerarios

REGLAS:
- Precios en COP (pesos colombianos)
- Menciona que precios pueden variar
- Para reservar: invita a usar la app "Planifica"
- Si no sabes algo, sé honesto

DATOS ACTUALIZADOS:
`;

/**
 * Cotizador inteligente con Groq AI + contexto Airtable
 */
export const cotizar = async (
  mensaje: string, 
  historial: ChatMessage[] = [],
  _usuarioId?: string
): Promise<ChatResponse> => {
  try {
    // Cargar contexto de Airtable
    const [services, directory] = await Promise.all([
      loadServicesContext(),
      loadDirectoryContext()
    ]);
    
    const contextPrompt = SYSTEM_PROMPT + services + '\n' + directory;
    
    // Preparar mensajes para Groq (últimos 6 del historial)
    const messages = [
      { role: 'system', content: contextPrompt },
      ...historial.slice(-6).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: mensaje }
    ];
    
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        temperature: 0.7,
        max_tokens: 400,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Error Groq:', response.status, err);
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    
    return { 
      reply: data.choices?.[0]?.message?.content || 'No pude procesar tu mensaje.',
      model: 'llama-3.3-70b'
    };

  } catch (error) {
    console.error("Error en cotizador Groq:", error);
    
    // Respuestas de fallback inteligentes
    const mensajeLower = mensaje.toLowerCase();
    let reply = '¡Hola! 🌴 Soy Guana Go. Estoy teniendo problemas técnicos, pero puedes explorar nuestros servicios en la app. ¿En qué más puedo ayudarte?';
    
    if (mensajeLower.includes('cotiz') || mensajeLower.includes('precio')) {
      reply = '🌴 Para cotizar tours, visita "Planifica" donde encontrarás precios actualizados. ¿Qué tipo de actividad te interesa?';
    } else if (mensajeLower.includes('hotel')) {
      reply = '🏨 Tenemos hoteles disponibles. Revisa "Planifica" > "Hoteles" para ver opciones y precios.';
    } else if (mensajeLower.includes('taxi')) {
      reply = '🚕 Las tarifas de taxi varían por zona. Consulta "Planifica" > "Traslados" para más info.';
    } else if (mensajeLower.includes('tour') || mensajeLower.includes('paseo')) {
      reply = '🎯 Tenemos tours increíbles: Acuario, Johnny Cay, Vuelta a la isla. Revisa "Planifica" > "Tours".';
    }
    
    return { reply };
  }
};

/**
 * Función legacy - redirige a cotizar
 */
export const sendMessage = async (userMessage: string, _userLanguage: string): Promise<ChatResponse> => {
  return cotizar(userMessage, []);
};
