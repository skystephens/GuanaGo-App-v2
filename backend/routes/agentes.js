/**
 * GuanaGO Agentes — Jarvis comercial
 * POST /api/agentes/admin-chat
 *
 * Jarvis tiene acceso de lectura a:
 *   - Tareas_To_do (backlog del proyecto)
 *   - Cola_Agentes (tareas para subagentes)
 *   - Leads (pipeline comercial)
 * Y puede escribir nuevas tareas en Tareas_To_do.
 */

import express  from 'express';
import Anthropic from '@anthropic-ai/sdk';
import axios     from 'axios';

const router = express.Router();

const claude   = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const AT_BASE  = process.env.AIRTABLE_BASE_ID || 'appiReH55Qhrbv4Lk';
const AT_KEY   = process.env.AIRTABLE_API_KEY;

// ── Airtable helpers ──────────────────────────────────────────────────────────

async function atFetch(table, params = {}) {
  const url = `https://api.airtable.com/v0/${AT_BASE}/${encodeURIComponent(table)}`;
  const r = await axios.get(url, {
    headers: { Authorization: `Bearer ${AT_KEY}` },
    params: { maxRecords: 20, ...params },
  });
  return r.data.records.map(rec => ({ id: rec.id, ...rec.fields }));
}

async function atCreate(table, fields) {
  const url = `https://api.airtable.com/v0/${AT_BASE}/${encodeURIComponent(table)}`;
  const r = await axios.post(url, { fields }, {
    headers: { Authorization: `Bearer ${AT_KEY}`, 'Content-Type': 'application/json' },
  });
  return r.data;
}

// ── Tool definitions para Claude ──────────────────────────────────────────────

const tools = [
  {
    name: 'leer_tareas',
    description: 'Lee las tareas del proyecto desde Tareas_To_do en Airtable. Filtra por estado si se especifica.',
    input_schema: {
      type: 'object',
      properties: {
        estado: {
          type: 'string',
          description: 'Filtrar por estado: "Pendiente", "En progreso", "Listo". Omitir para ver todas.',
        },
      },
    },
  },
  {
    name: 'leer_leads',
    description: 'Lee los leads del pipeline comercial desde la tabla Leads en Airtable.',
    input_schema: {
      type: 'object',
      properties: {
        estado: {
          type: 'string',
          description: 'Filtrar por Estado_del_Lead: "Nuevo", "Contactado", "Cotizado", "Confirmado", "Perdido".',
        },
      },
    },
  },
  {
    name: 'leer_cola_agentes',
    description: 'Lee la Cola_Agentes: tareas pendientes de ejecución por subagentes (Make.com, IA, etc.).',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'crear_tarea',
    description: 'Crea una nueva tarea en Tareas_To_do de Airtable.',
    input_schema: {
      type: 'object',
      required: ['Titulo'],
      properties: {
        Titulo:      { type: 'string', description: 'Título de la tarea' },
        Prioridad:   { type: 'string', description: 'Alta / Media / Baja' },
        Categoria:   { type: 'string', description: 'Backend / Frontend / Comercial / IA / Operaciones' },
        Notas_IA:    { type: 'string', description: 'Contexto adicional o instrucción para ejecutar' },
      },
    },
  },
];

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM = `Eres Jarvis, el asistente comercial interno de GuanaGO y GuíaSAI S.A.S.

NEGOCIO:
- GuanaGO: app PWA B2C turismo San Andrés. guanago.travel
- GuíaSAI: portal B2B para agencias. Ambos comparten backend e infraestructura.
- Empresa Raizal, RNT 48674. Dueños: Sky Stephens (CTO), Marta Porras (CEO).

STACK:
- Frontend: React 19 + Vite + TypeScript + Tailwind
- Backend: Node.js + Express en Render.com
- DB: Airtable (appiReH55Qhrbv4Lk) — tablas clave: ServiciosTuristicos_SAI, Leads, Reservas, CotizacionesGG, Cola_Agentes, Tareas_To_do
- Automatización: Make.com
- IA: Claude API (tú mismo) + Groq (chatbot B2C)
- Pagos: PayU integrado

COMISIONES / PRECIOS:
- B2C directo: precio base + 15% concierge
- B2B agencias: tarifa neta → GuanaGO cobra 12-15% comisión
- Aliados: 10% comisión en Plan Activo, 15% en Plan Básico
- Ventana de comisión: 90 días desde primer contacto

SERVICIOS DESTACADOS:
- Johnny Cay, Acuario, Caribbean Night, tours buceo, Coco ART, traslados aeropuerto, alojamiento posadas

INSTRUCCIONES:
1. Responde siempre en español, conciso y directo.
2. Cuando ejecutes herramientas, dí qué consultaste antes de mostrar resultados.
3. Al final de cada respuesta lista las acciones que ejecutaste (si las hay).
4. Si el usuario pide redactar un mensaje para cliente, usa lenguaje cálido y profesional en español.
5. Puedes crear tareas en Airtable directamente cuando se te pida.
6. Si no tienes datos suficientes, pídelos — no inventes cifras.`;

// ── POST /api/agentes/admin-chat ──────────────────────────────────────────────

router.post('/admin-chat', async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages[] requerido' });
  }

  try {
    let response = await claude.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 2048,
      system:     SYSTEM,
      tools,
      messages,
    });

    // Agentic loop: ejecutar tools mientras Claude las solicite
    const executedTools = [];
    while (response.stop_reason === 'tool_use') {
      const toolUses = response.content.filter(b => b.type === 'tool_use');
      const toolResults = [];

      for (const tu of toolUses) {
        let result;
        try {
          result = await executeTool(tu.name, tu.input);
        } catch (e) {
          result = { error: e.message };
        }
        executedTools.push({ tool: tu.name, input: tu.input });
        toolResults.push({ type: 'tool_result', tool_use_id: tu.id, content: JSON.stringify(result) });
      }

      response = await claude.messages.create({
        model:      'claude-sonnet-4-6',
        max_tokens: 2048,
        system:     SYSTEM,
        tools,
        messages: [
          ...messages,
          { role: 'assistant', content: response.content },
          { role: 'user',      content: toolResults },
        ],
      });
    }

    const text = response.content.find(b => b.type === 'text')?.text || '';
    res.json({ reply: text, tools_used: executedTools });

  } catch (err) {
    console.error('[agentes] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Tool executor ─────────────────────────────────────────────────────────────

async function executeTool(name, input) {
  switch (name) {
    case 'leer_tareas': {
      const filterFormula = input.estado
        ? `{Status}="${input.estado}"`
        : '';
      const records = await atFetch('Tareas_To_do', {
        ...(filterFormula ? { filterByFormula: filterFormula } : {}),
        sort: [{ field: 'Prioridad', direction: 'desc' }],
      });
      return records.map(r => ({
        id:         r.id,
        titulo:     r.Titulo || r.Name || '(sin título)',
        status:     r.Status,
        prioridad:  r.Prioridad,
        categoria:  r.Categoria,
        notas:      r.Notas_IA,
      }));
    }

    case 'leer_leads': {
      const filterFormula = input.estado
        ? `{Estado_del_Lead}="${input.estado}"`
        : '';
      const records = await atFetch('Leads', {
        ...(filterFormula ? { filterByFormula: filterFormula } : {}),
        sort: [{ field: 'Created Time', direction: 'desc' }],
      });
      return records.map(r => ({
        id:        r.id,
        nombre:    r.Nombre,
        whatsapp:  r.WhatsApp,
        estado:    r.Estado_del_Lead,
        fuente:    r.Fuente_del_Lead,
        tipo:      r.Tipo_Cliente,
        fechas:    r.Fechas_del_Viaje,
        intereses: r.Intereses_de_Tours,
      }));
    }

    case 'leer_cola_agentes': {
      const records = await atFetch('Cola_Agentes', {
        filterByFormula: `{Estado}="Pendiente"`,
      });
      return records.map(r => ({
        id:      r.id,
        agente:  r.Agente,
        estado:  r.Estado,
        payload: r.Payload,
      }));
    }

    case 'crear_tarea': {
      const record = await atCreate('Tareas_To_do', {
        Titulo:    input.Titulo,
        Status:    'Pendiente',
        Prioridad: input.Prioridad || 'Media',
        Categoria: input.Categoria || 'General',
        Notas_IA:  input.Notas_IA || '',
      });
      return { created: true, id: record.id, titulo: input.Titulo };
    }

    default:
      throw new Error(`Tool desconocida: ${name}`);
  }
}

export default router;
