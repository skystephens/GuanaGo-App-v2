#!/usr/bin/env node

/**
 * GuanaGO Backend Server
 * Express.js API — GuanaGO + GuíaSAI
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import partnerRoutes   from './routes/partnerRoutes.js';
import healthRoutes    from './routes/healthRoutes.js';
import tasksRoutes     from './routes/tasks.js';
import paymentsRoutes, { resultadoPago } from './routes/payments.js';
import directoryRoutes from './routes/directory.js';
import hubRoutes       from './routes/hub.js';
import leadsRoutes     from './routes/leads.js';
import agentesRoutes   from './routes/agentes.js';

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
// Rutas usadas internamente por el admin; requiere que el URL sea HTTPS y devuelva imagen.
app.get('/api/proxy-image', async (req, res) => {
  const { url } = req.query;
  if (!url || typeof url !== 'string') return res.status(400).json({ error: 'Missing url' });
  if (!url.startsWith('https://'))     return res.status(403).json({ error: 'HTTPS only' });
  try {
    const upstream = await fetch(url, { headers: { 'User-Agent': 'GuanaGO-PDF/1.0' } });
    if (!upstream.ok) return res.status(502).json({ error: 'Upstream error', status: upstream.status });
    const ct = upstream.headers.get('content-type') || 'image/jpeg';
    if (!ct.startsWith('image/')) return res.status(415).json({ error: 'Not an image' });
    const buf = await upstream.arrayBuffer();
    res.set('Content-Type', ct);
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(Buffer.from(buf));
  } catch (err) {
    res.status(502).json({ error: 'Fetch failed', detail: err.message });
  }
});

// ── Leads — formulario público de captura ─────────────────────────────────────
app.use('/api/leads',   leadsRoutes);

// ── Agentes — Jarvis comercial ────────────────────────────────────────────────
app.use('/api/agentes', agentesRoutes);

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
