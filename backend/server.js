#!/usr/bin/env node

/**
 * GuanaGO Backend Server
 * Express.js API — GuanaGO + GuíaSAI
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import partnerRoutes      from './routes/partnerRoutes.js';
import healthRoutes       from './routes/healthRoutes.js';
import tasksRoutes        from './routes/tasks.js';
import paymentsRoutes, { resultadoPago } from './routes/payments.js';
import directoryRoutes    from './routes/directory.js';
import hubRoutes          from './routes/hub.js';
import leadsRoutes        from './routes/leads.js';
import agentesRoutes      from './routes/agentes.js';
import firebaseAuthRoutes from './routes/firebaseAuth.js';
import adminUsersRoutes   from './routes/adminUsers.js';
import agentRoutes        from './routes/agent.js';
import dinamicasRoutes    from './routes/dinamicas.js';
import taxiZonesRoutes    from './routes/taxiZones.js';
import translateRoutes    from './routes/translate.js';
import docsRoutes        from './routes/docs.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
  next();
});

// ── Rutas ─────────────────────────────────────────────────────────────────────

app.use('/api/health',    healthRoutes);
app.use('/api/partners',  partnerRoutes);
app.use('/api/tasks',     tasksRoutes);
app.use('/api/directory', directoryRoutes);
app.use('/api/dinamicas',   dinamicasRoutes);
app.use('/api/taxi-zones', taxiZonesRoutes);
app.use('/api/translate',  translateRoutes);
app.use('/api/docs',       docsRoutes);

// Pagos: /api/payments/create  /api/payments/webhook
//        /pagar/:ref            /pago-resultado
app.use('/api/payments', paymentsRoutes);
app.use('/pagar',        paymentsRoutes);
app.get('/pago-resultado', resultadoPago); // PayU responseUrl redirect

// Root
app.get('/api', (req, res) => {
  res.json({
    name: 'GuanaGO Backend API',
    version: '2.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health:   '/api/health',
      partners: '/api/partners',
      tasks:    '/api/tasks',
      payments: '/api/payments/create  POST',
      webhook:  '/api/payments/webhook POST',
      pagar:    '/pagar/:referenceCode GET',
      resultado:'/pago-resultado       GET',
    },
  });
});

// ── Image proxy — evita CORS en html2canvas al generar PDFs ──────────────────
// Axios en lugar de fetch global para compatibilidad con Node < 18.
// Acepta cualquier respuesta binaria (Airtable a veces devuelve octet-stream).
app.get('/api/proxy-image', async (req, res) => {
  const { url } = req.query;
  if (!url || typeof url !== 'string') return res.status(400).json({ error: 'Missing url' });
  if (!url.startsWith('https://'))     return res.status(403).json({ error: 'HTTPS only' });
  try {
    const upstream = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: { 'User-Agent': 'GuanaGO-PDF/1.0' },
      timeout: 10000,
    });
    const ct = upstream.headers['content-type'] || 'image/jpeg';
    // Forzar tipo imagen incluso si el CDN devuelve octet-stream
    const safeType = ct.startsWith('image/') ? ct : 'image/jpeg';
    res.set('Content-Type', safeType);
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(Buffer.from(upstream.data));
  } catch (err) {
    console.error('[proxy-image] error:', err.message, '| url:', url.substring(0, 80));
    res.status(502).json({ error: 'Fetch failed' });
  }
});

// ── Auth Firebase + perfiles ─────────────────────────────────────────────────
app.use('/api/firebase-auth', firebaseAuthRoutes);

// ── Admin: gestión de usuarios ───────────────────────────────────────────────
app.use('/api/admin/users', adminUsersRoutes);

// ── Leads — formulario público de captura ─────────────────────────────────────
app.use('/api/leads',   leadsRoutes);

// ── Agentes — Jarvis comercial ────────────────────────────────────────────────
app.use('/api/agentes', agentesRoutes);

// ── Agente IA chat (dashboard admin) ─────────────────────────────────────────
app.use('/api/agent',   agentRoutes);

// ── Formulario de cotización pública ──────────────────────────────────────────
const docsPath = join(__dirname, 'docs');
app.get('/cotizar', (req, res) => res.sendFile(join(docsPath, 'cotizar.html')));

// ── Hub interno ───────────────────────────────────────────────────────────────
app.use('/hub', hubRoutes);

// ── Frontend React (SPA) ──────────────────────────────────────────────────────
// Sirve el build de Vite. /pagar y /api/* ya están manejados arriba.
const distPath = join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// SPA catch-all: cualquier ruta no reconocida → index.html (React Router)
app.get('*', (req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

// Error handler
app.use((err, req, res, _next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🌴 GuanaGO Backend corriendo en puerto ${PORT}`);
  console.log(`   PayU test mode: ${process.env.PAYU_TEST === '0' ? '🔴 PRODUCCIÓN' : '🟡 SANDBOX'}`);
});
