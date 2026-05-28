/**
 * /api/translate — Centro de traducción automática GuanaGO
 *
 * GET  /api/translate/status          → stats de progreso por idioma
 * GET  /api/translate/records         → lista registros con estado EN/PT
 * POST /api/translate/batch           → traduce un lote usando Claude API
 * PATCH /api/translate/:recordId      → sobreescribir traducción manual
 */

import express  from 'express';
import axios    from 'axios';
import Anthropic from '@anthropic-ai/sdk';

const router = express.Router();

// ── Configuración ─────────────────────────────────────────────────────────────

const AT_KEY  = process.env.AIRTABLE_API_KEY;
const AT_BASE = process.env.AIRTABLE_BASE_ID || 'appiReH55Qhrbv4Lk';
const AT_URL  = `https://api.airtable.com/v0/${AT_BASE}/ServiciosTuristicos_SAI`;

const AT_HEADERS = () => ({
  Authorization: `Bearer ${AT_KEY}`,
  'Content-Type': 'application/json',
});

// IDs de campos (no cambian)
const FIELDS = {
  nombre_ES:  'Servicio',
  desc_ES:    'Descripcion',
  nombre_EN:  'Servicio_EN',
  desc_EN:    'Descripcion_EN',
  nombre_PT:  'Servicio_PT',
  desc_PT:    'Descripcion_PT',
  publicado:  'Publicado',
};

// ── Airtable helpers ──────────────────────────────────────────────────────────

async function fetchAllRecords() {
  const records = [];
  let offset = null;
  do {
    const params = new URLSearchParams({
      pageSize: '100',
      fields: [FIELDS.nombre_ES, FIELDS.desc_ES, FIELDS.nombre_EN,
               FIELDS.desc_EN, FIELDS.nombre_PT, FIELDS.desc_PT, FIELDS.publicado],
    });
    if (offset) params.append('offset', offset);

    const { data } = await axios.get(`${AT_URL}?${params}`, { headers: AT_HEADERS() });
    records.push(...(data.records || []));
    offset = data.offset || null;
  } while (offset);
  return records;
}

async function updateRecord(id, fields) {
  await axios.patch(
    `${AT_URL}/${id}`,
    { fields },
    { headers: AT_HEADERS() }
  );
}

// ── Claude translate helper ────────────────────────────────────────────────────

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function translateWithClaude(nombre, descripcion, targetLang) {
  const langName = targetLang === 'EN' ? 'English' : 'Portuguese (Brazilian)';
  const langCode = targetLang === 'EN' ? 'en' : 'pt-BR';

  const prompt = `You are a professional tourism translator specializing in Caribbean island experiences.
Translate the following Spanish tourism service content to ${langName}.

Rules:
- Keep the warm, experiential tone — this is for tourists booking activities
- Preserve all specific details (prices, times, inclusions, meeting points)
- Keep proper nouns in Spanish (San Andrés, Raizal, Providencia, etc.)
- Return ONLY a JSON object, no explanation

Input:
- Name: "${nombre}"
- Description: "${descripcion?.slice(0, 3000) || ''}"

Return exactly this JSON (no markdown):
{"nombre": "translated name here", "descripcion": "translated description here"}`;

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = msg.content[0]?.text || '{}';
  try {
    return JSON.parse(text);
  } catch {
    // Fallback: extract JSON from possible markdown wrapper
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : { nombre: '', descripcion: '' };
  }
}

// ── GET /api/translate/status ─────────────────────────────────────────────────

router.get('/status', async (req, res) => {
  try {
    if (!AT_KEY) return res.status(503).json({ error: 'Airtable no configurado' });

    const records = await fetchAllRecords();
    const total = records.length;

    let translatedEN = 0, translatedPT = 0, pendingEN = 0, pendingPT = 0;
    records.forEach(r => {
      const f = r.fields;
      if (f[FIELDS.nombre_EN] && f[FIELDS.desc_EN]) translatedEN++;
      else pendingEN++;
      if (f[FIELDS.nombre_PT] && f[FIELDS.desc_PT]) translatedPT++;
      else pendingPT++;
    });

    res.json({
      total,
      EN: { translated: translatedEN, pending: pendingEN, pct: Math.round(translatedEN / total * 100) },
      PT: { translated: translatedPT, pending: pendingPT, pct: Math.round(translatedPT / total * 100) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/translate/records ────────────────────────────────────────────────

router.get('/records', async (req, res) => {
  try {
    if (!AT_KEY) return res.status(503).json({ error: 'Airtable no configurado' });

    const records = await fetchAllRecords();
    const list = records.map(r => {
      const f = r.fields;
      return {
        id:         r.id,
        nombre_ES:  f[FIELDS.nombre_ES] || '',
        desc_ES:    (f[FIELDS.desc_ES]  || '').slice(0, 200),
        nombre_EN:  f[FIELDS.nombre_EN] || '',
        desc_EN:    (f[FIELDS.desc_EN]  || '').slice(0, 200),
        nombre_PT:  f[FIELDS.nombre_PT] || '',
        desc_PT:    (f[FIELDS.desc_PT]  || '').slice(0, 200),
        hasEN:      !!(f[FIELDS.nombre_EN] && f[FIELDS.desc_EN]),
        hasPT:      !!(f[FIELDS.nombre_PT] && f[FIELDS.desc_PT]),
        publicado:  !!f[FIELDS.publicado],
      };
    });

    res.json({ total: list.length, records: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/translate/batch ─────────────────────────────────────────────────
// Body: { lang: "EN" | "PT" | "ALL", limit: 10, force: false }

router.post('/batch', async (req, res) => {
  try {
    if (!AT_KEY)  return res.status(503).json({ error: 'Airtable no configurado' });
    if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'ANTHROPIC_API_KEY no configurado' });

    const { lang = 'EN', limit = 10, force = false } = req.body;
    const langs = lang === 'ALL' ? ['EN', 'PT'] : [lang];

    const records = await fetchAllRecords();

    // Filtrar los que necesitan traducción
    let toTranslate = records.filter(r => {
      const f = r.fields;
      if (!f[FIELDS.nombre_ES]) return false; // sin nombre en ES → skip
      if (force) return true;
      const needsEN = langs.includes('EN') && (!f[FIELDS.nombre_EN] || !f[FIELDS.desc_EN]);
      const needsPT = langs.includes('PT') && (!f[FIELDS.nombre_PT] || !f[FIELDS.desc_PT]);
      return needsEN || needsPT;
    }).slice(0, limit);

    const results = [];
    let ok = 0, errors = 0;

    for (const record of toTranslate) {
      const f = record.fields;
      const nombreES = f[FIELDS.nombre_ES] || '';
      const descES   = f[FIELDS.desc_ES]   || '';
      const updates  = {};

      for (const l of langs) {
        const needsLang = force ||
          (l === 'EN' && (!f[FIELDS.nombre_EN] || !f[FIELDS.desc_EN])) ||
          (l === 'PT' && (!f[FIELDS.nombre_PT] || !f[FIELDS.desc_PT]));

        if (!needsLang) continue;

        try {
          const translated = await translateWithClaude(nombreES, descES, l);
          if (l === 'EN') {
            updates[FIELDS.nombre_EN] = translated.nombre || '';
            updates[FIELDS.desc_EN]   = translated.descripcion || '';
          } else {
            updates[FIELDS.nombre_PT] = translated.nombre || '';
            updates[FIELDS.desc_PT]   = translated.descripcion || '';
          }
        } catch (e) {
          console.error(`[translate] Error record ${record.id} lang ${l}:`, e.message);
          errors++;
        }
      }

      if (Object.keys(updates).length > 0) {
        try {
          await updateRecord(record.id, updates);
          ok++;
          results.push({ id: record.id, nombre: nombreES, status: 'ok', langs: Object.keys(updates) });
        } catch (e) {
          errors++;
          results.push({ id: record.id, nombre: nombreES, status: 'error', error: e.message });
        }
      }
    }

    res.json({
      processed: toTranslate.length,
      ok,
      errors,
      results,
    });
  } catch (err) {
    console.error('[translate] batch error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/translate/:recordId ────────────────────────────────────────────
// Body: { nombre_EN, desc_EN, nombre_PT, desc_PT } (parcial)

router.patch('/:recordId', async (req, res) => {
  try {
    if (!AT_KEY) return res.status(503).json({ error: 'Airtable no configurado' });

    const { recordId } = req.params;
    const { nombre_EN, desc_EN, nombre_PT, desc_PT } = req.body;
    const updates = {};

    if (nombre_EN !== undefined) updates[FIELDS.nombre_EN] = nombre_EN;
    if (desc_EN   !== undefined) updates[FIELDS.desc_EN]   = desc_EN;
    if (nombre_PT !== undefined) updates[FIELDS.nombre_PT] = nombre_PT;
    if (desc_PT   !== undefined) updates[FIELDS.desc_PT]   = desc_PT;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Sin campos para actualizar' });
    }

    await updateRecord(recordId, updates);
    res.json({ success: true, updated: Object.keys(updates) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
