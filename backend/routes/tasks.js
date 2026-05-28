/**
 * /api/tasks — Tareas del proyecto desde Airtable (Tareas_To_do)
 *
 * GET    /api/tasks              → listar tareas (filtros: status, prioridad, categoria, asignado)
 * GET    /api/tasks/stats        → métricas de avance
 * POST   /api/tasks              → crear tarea
 * PATCH  /api/tasks/:id          → actualizar campos de una tarea
 * DELETE /api/tasks/:id          → eliminar tarea
 * POST   /api/tasks/webhook      → sync desde Make.com
 */

import express from 'express';
import axios   from 'axios';

const router = express.Router();

const BASE_ID = process.env.AIRTABLE_BASE_ID || 'appiReH55Qhrbv4Lk';
const AT_KEY  = process.env.AIRTABLE_API_KEY;
const TABLE   = 'Tareas_To_do';
const AT_URL  = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}`;

const headers = () => ({
  Authorization: `Bearer ${AT_KEY}`,
  'Content-Type': 'application/json',
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapRecord(record) {
  const f = record.fields;
  return {
    id:                record.id,
    titulo:            f.Titulo        || f.Title   || f.Nombre || '',
    descripcion:       f.Descripcion   || f.Description || '',
    status:            normalizeStatus(f.Status     || f.Estado || 'pendiente'),
    prioridad:         normalizePriority(f.Prioridad || f.Priority || 'media'),
    categoria:         normalizeCategory(f.Categoria || f.Category || 'desarrollo'),
    asignadoA:         f.Asignado_A    || f.AssignedTo  || null,
    creadoPor:         f.Creado_Por    || f.CreatedBy   || null,
    estimacionHoras:   toInt(f.Estimacion_Horas || f.EstimacionHoras),
    horasReales:       toInt(f.Horas_Reales     || f.HorasReales),
    archivoReferencia: f.Archivo_Referencia || null,
    seccionReferencia: f.Seccion_Referencia  || null,
    fechaVencimiento:  f.Fecha_Vencimiento   || null,
    completedAt:       f.Fecha_Completado    || null,
    dependeDe:         parseDeps(f.Depende_De || f.DependeDe),
    notasIA:           f.Notas_IA            || null,
    createdAt:         record.createdTime,
    updatedAt:         f.Fecha_Actualizacion  || null,
  };
}

function mapToFields(data) {
  const fields = {};
  if (data.titulo        != null) fields.Titulo              = data.titulo;
  if (data.descripcion   != null) fields.Descripcion         = data.descripcion;
  if (data.status        != null) fields.Status              = data.status;
  if (data.prioridad     != null) fields.Prioridad           = data.prioridad;
  if (data.categoria     != null) fields.Categoria           = data.categoria;
  if (data.asignadoA     != null) fields.Asignado_A          = data.asignadoA;
  if (data.creadoPor     != null) fields.Creado_Por          = data.creadoPor;
  if (data.estimacionHoras != null) fields.Estimacion_Horas = data.estimacionHoras;
  if (data.horasReales   != null) fields.Horas_Reales        = data.horasReales;
  if (data.archivoReferencia != null) fields.Archivo_Referencia = data.archivoReferencia;
  if (data.seccionReferencia != null) fields.Seccion_Referencia = data.seccionReferencia;
  if (data.fechaVencimiento  != null) fields.Fecha_Vencimiento  = data.fechaVencimiento;
  if (data.dependeDe     != null) fields.Depende_De = Array.isArray(data.dependeDe)
    ? data.dependeDe.join(',') : data.dependeDe;
  if (data.notasIA       != null) fields.Notas_IA = data.notasIA;
  if (data.completedAt   != null) fields.Fecha_Completado    = data.completedAt;
  if (data.updatedAt     != null) fields.Fecha_Actualizacion = data.updatedAt;
  return fields;
}

function normalizeStatus(s) {
  const v = (s || '').toLowerCase().replace(/[\s_-]/g, '');
  if (v.includes('progreso') || v === 'inprogress') return 'en_progreso';
  if (v.includes('complet') || v === 'done')        return 'completado';
  if (v.includes('bloqu')   || v === 'blocked')     return 'bloqueado';
  return 'pendiente';
}

function normalizePriority(p) {
  const v = (p || '').toLowerCase();
  if (v.includes('critica') || v === 'critical') return 'critica';
  if (v === 'alta'  || v === 'high')             return 'alta';
  if (v === 'baja'  || v === 'low')              return 'baja';
  return 'media';
}

function normalizeCategory(c) {
  const v = (c || '').toLowerCase();
  if (v.includes('front'))   return 'frontend';
  if (v.includes('back'))    return 'backend';
  if (v.includes('content')) return 'contenido';
  if (v.includes('comerc'))  return 'comercial';
  if (v.includes('infra'))   return 'infraestructura';
  if (v.includes('design'))  return 'diseño';
  return c || 'desarrollo';
}

function toInt(v) {
  const n = parseInt(v, 10);
  return isNaN(n) ? null : n;
}

function parseDeps(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  return String(v).split(',').map(s => s.trim()).filter(Boolean);
}

// Pagina automáticamente — Airtable devuelve máx 100 por página
async function fetchAll(params = {}) {
  if (!AT_KEY) return [];
  const records = [];
  let offset = null;
  do {
    const query = new URLSearchParams();
    if (offset) query.set('offset', offset);
    if (params.filterByFormula) query.set('filterByFormula', params.filterByFormula);
    query.set('pageSize', '100');
    query.set('sort[0][field]', 'Prioridad');
    query.set('sort[0][direction]', 'asc');

    const { data } = await axios.get(`${AT_URL}?${query}`, { headers: headers() });
    records.push(...(data.records || []));
    offset = data.offset || null;
  } while (offset);
  return records;
}

// ── GET /api/tasks ────────────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    if (!AT_KEY) return res.status(503).json({ success: false, error: 'Airtable no configurado' });

    const { status, prioridad, categoria, asignado } = req.query;
    const filters = [];
    if (status)    filters.push(`{Status} = '${status}'`);
    if (prioridad) filters.push(`{Prioridad} = '${prioridad}'`);
    if (categoria) filters.push(`{Categoria} = '${categoria}'`);
    if (asignado)  filters.push(`{Asignado_A} = '${asignado}'`);

    const formula = filters.length === 1
      ? filters[0]
      : filters.length > 1
        ? `AND(${filters.join(',')})`
        : '';

    const records = await fetchAll(formula ? { filterByFormula: formula } : {});
    const tasks   = records.map(mapRecord);

    // Orden local: critica→alta→media→baja, luego por status (en_progreso primero)
    const PRIO = { critica: 0, alta: 1, media: 2, baja: 3 };
    const STAT = { en_progreso: 0, pendiente: 1, bloqueado: 2, completado: 3 };
    tasks.sort((a, b) =>
      (STAT[a.status] ?? 9) - (STAT[b.status] ?? 9) ||
      (PRIO[a.prioridad] ?? 9) - (PRIO[b.prioridad] ?? 9)
    );

    res.json({ success: true, total: tasks.length, tasks });
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message;
    console.error('[tasks] GET error:', msg);
    res.status(500).json({ success: false, error: msg });
  }
});

// ── GET /api/tasks/stats ──────────────────────────────────────────────────────

router.get('/stats', async (req, res) => {
  try {
    if (!AT_KEY) return res.status(503).json({ success: false, error: 'Airtable no configurado' });

    const records = await fetchAll();
    const tasks   = records.map(mapRecord);

    const byStatus   = {};
    const byCategoria = {};
    const byPrioridad = {};
    let horasEstimadas = 0;
    let horasReales    = 0;

    tasks.forEach(t => {
      byStatus[t.status]       = (byStatus[t.status]       || 0) + 1;
      byCategoria[t.categoria] = (byCategoria[t.categoria] || 0) + 1;
      byPrioridad[t.prioridad] = (byPrioridad[t.prioridad] || 0) + 1;
      horasEstimadas += t.estimacionHoras || 0;
      horasReales    += t.horasReales     || 0;
    });

    const total      = tasks.length;
    const completadas = byStatus.completado || 0;

    res.json({
      success: true,
      stats: {
        total,
        completadas,
        pctCompletado: total ? Math.round((completadas / total) * 100) : 0,
        byStatus,
        byCategoria,
        byPrioridad,
        horasEstimadas,
        horasReales,
        criticas: tasks.filter(t => t.prioridad === 'critica' && t.status !== 'completado').length,
        bloqueadas: byStatus.bloqueado || 0,
      },
    });
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message;
    console.error('[tasks] stats error:', msg);
    res.status(500).json({ success: false, error: msg });
  }
});

// ── POST /api/tasks ───────────────────────────────────────────────────────────

router.post('/', async (req, res) => {
  try {
    if (!AT_KEY) return res.status(503).json({ success: false, error: 'Airtable no configurado' });

    const { titulo, ...rest } = req.body;
    if (!titulo?.trim()) return res.status(400).json({ success: false, error: 'titulo requerido' });

    const fields = mapToFields({
      titulo: titulo.trim(),
      status: 'pendiente',
      prioridad: 'media',
      creadoPor: 'api',
      ...rest,
    });

    const { data } = await axios.post(AT_URL, { fields }, { headers: headers() });
    res.status(201).json({ success: true, task: mapRecord(data) });
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message;
    console.error('[tasks] POST error:', msg);
    res.status(500).json({ success: false, error: msg });
  }
});

// ── PATCH /api/tasks/:id ──────────────────────────────────────────────────────

router.patch('/:id', async (req, res) => {
  try {
    if (!AT_KEY) return res.status(503).json({ success: false, error: 'Airtable no configurado' });

    const { id } = req.params;
    const updates = { ...req.body, updatedAt: new Date().toISOString().split('T')[0] };

    if (updates.status === 'completado' && !updates.completedAt) {
      updates.completedAt = new Date().toISOString().split('T')[0];
    }

    const fields = mapToFields(updates);
    const { data } = await axios.patch(`${AT_URL}/${id}`, { fields }, { headers: headers() });
    res.json({ success: true, task: mapRecord(data) });
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message;
    console.error('[tasks] PATCH error:', msg);
    res.status(err.response?.status === 404 ? 404 : 500).json({ success: false, error: msg });
  }
});

// ── DELETE /api/tasks/:id ─────────────────────────────────────────────────────

router.delete('/:id', async (req, res) => {
  try {
    if (!AT_KEY) return res.status(503).json({ success: false, error: 'Airtable no configurado' });

    await axios.delete(`${AT_URL}/${req.params.id}`, { headers: headers() });
    res.json({ success: true, deleted: req.params.id });
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message;
    console.error('[tasks] DELETE error:', msg);
    res.status(err.response?.status === 404 ? 404 : 500).json({ success: false, error: msg });
  }
});

// ── POST /api/tasks/webhook — Make.com sync ───────────────────────────────────

router.post('/webhook', async (req, res) => {
  try {
    const { action, data } = req.body;

    if (action === 'get_pending') {
      if (!AT_KEY) return res.json({ success: true, pendientes: [], criticas: [] });
      const records = await fetchAll({ filterByFormula: `OR({Status}='pendiente',{Status}='en_progreso',{Prioridad}='critica')` });
      const tasks = records.map(mapRecord);
      return res.json({
        success: true,
        pendientes: tasks.filter(t => t.status === 'pendiente'),
        enProgreso: tasks.filter(t => t.status === 'en_progreso'),
        criticas:   tasks.filter(t => t.prioridad === 'critica' && t.status !== 'completado'),
      });
    }

    if (action === 'bulk_status' && Array.isArray(data)) {
      // Actualizar estado de múltiples tareas a la vez (máx 10 por batch Airtable)
      const chunks = [];
      for (let i = 0; i < data.length; i += 10) chunks.push(data.slice(i, i + 10));
      let updated = 0;
      for (const chunk of chunks) {
        const records = chunk.map(({ id, status }) => ({
          id,
          fields: { Status: status, Fecha_Actualizacion: new Date().toISOString().split('T')[0] },
        }));
        await axios.patch(AT_URL, { records }, { headers: headers() });
        updated += chunk.length;
      }
      return res.json({ success: true, updated });
    }

    res.status(400).json({ success: false, error: `Acción desconocida: ${action}` });
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message;
    console.error('[tasks] webhook error:', msg);
    res.status(500).json({ success: false, error: msg });
  }
});

export default router;
