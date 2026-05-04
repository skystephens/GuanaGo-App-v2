#!/usr/bin/env node

/**
 * GuanaGO Backend Server
 * Express.js API — GuanaGO + GuíaSAI
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import partnerRoutes  from './routes/partnerRoutes.js';
import healthRoutes   from './routes/healthRoutes.js';
import tasksRoutes    from './routes/tasks.js';
import paymentsRoutes, { resultadoPago } from './routes/payments.js';

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

app.use('/api/health',   healthRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/tasks',    tasksRoutes);

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

// 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `${req.method} ${req.path} no existe`,
  });
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
