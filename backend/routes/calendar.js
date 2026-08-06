/**
 * calendar.js — Integración con Google Calendar vía cuenta de servicio.
 *
 * Requiere 2 variables de entorno en Render:
 * - GOOGLE_CALENDAR_SERVICE_ACCOUNT_JSON: el contenido completo del archivo
 *   JSON de la cuenta de servicio (como un solo string).
 * - GOOGLE_CALENDAR_ID: el ID del calendario a leer/escribir. Para el
 *   calendario principal de una cuenta, normalmente es el email de esa
 *   cuenta (ej. sky@guiasanandresislas.com). Se comparte ese calendario
 *   con el email de la cuenta de servicio (permiso "Hacer cambios en
 *   los eventos") antes de que esto funcione.
 */

import express from 'express';
import { JWT } from 'google-auth-library';

const router = express.Router();

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

let cachedClient = null;

function getClient() {
  if (cachedClient) return cachedClient;
  const raw = process.env.GOOGLE_CALENDAR_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const creds = JSON.parse(raw);
    cachedClient = new JWT({
      email: creds.client_email,
      key: creds.private_key,
      scopes: SCOPES,
    });
    return cachedClient;
  } catch (err) {
    console.error('❌ GOOGLE_CALENDAR_SERVICE_ACCOUNT_JSON inválido:', err.message);
    return null;
  }
}

async function calendarFetch(path, options = {}) {
  const client = getClient();
  if (!client) throw new Error('Google Calendar no configurado (falta la variable de entorno)');
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) throw new Error('Falta GOOGLE_CALENDAR_ID en las variables de entorno');

  const { token } = await client.getAccessToken();
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Google Calendar API ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

// GET /api/calendar/events?dias=14 — próximos eventos
router.get('/events', async (req, res) => {
  try {
    const dias = parseInt(req.query.dias) || 14;
    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString();
    const params = new URLSearchParams({
      timeMin, timeMax, singleEvents: 'true', orderBy: 'startTime', maxResults: '50',
    });
    const data = await calendarFetch(`/events?${params.toString()}`);
    const eventos = (data.items || []).map(ev => ({
      id: ev.id,
      titulo: ev.summary || '(Sin título)',
      descripcion: ev.description || '',
      inicio: ev.start?.dateTime || ev.start?.date,
      fin: ev.end?.dateTime || ev.end?.date,
      todoElDia: !ev.start?.dateTime,
      ubicacion: ev.location || '',
      link: ev.htmlLink,
      invitados: (ev.attendees || []).map(a => a.email),
    }));
    res.json(eventos);
  } catch (err) {
    console.error('❌ /api/calendar/events GET:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/calendar/events — crear evento nuevo
router.post('/events', async (req, res) => {
  try {
    const { titulo, descripcion, inicio, fin, todoElDia, ubicacion, invitados } = req.body;
    if (!titulo || !inicio) return res.status(400).json({ error: 'Falta titulo o fecha de inicio' });

    const body = {
      summary: titulo,
      description: descripcion || '',
      location: ubicacion || '',
      ...(todoElDia
        ? { start: { date: inicio.slice(0, 10) }, end: { date: (fin || inicio).slice(0, 10) } }
        : { start: { dateTime: inicio, timeZone: 'America/Bogota' }, end: { dateTime: fin || inicio, timeZone: 'America/Bogota' } }),
      ...(invitados?.length ? { attendees: invitados.map(email => ({ email })) } : {}),
    };

    const creado = await calendarFetch('/events', { method: 'POST', body: JSON.stringify(body) });
    res.json({ id: creado.id, link: creado.htmlLink });
  } catch (err) {
    console.error('❌ /api/calendar/events POST:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/calendar/events/:id
router.delete('/events/:id', async (req, res) => {
  try {
    await calendarFetch(`/events/${req.params.id}`, { method: 'DELETE' });
    res.json({ ok: true });
  } catch (err) {
    console.error('❌ /api/calendar/events DELETE:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
