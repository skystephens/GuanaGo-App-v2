#!/usr/bin/env node

/**
 * GuanaGO Backend Server
 * Express.js API para Partners Dashboard
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Importar rutas
const partnerRoutes = require('./routes/partnerRoutes');
const healthRoutes = require('./routes/healthRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// ==========================================
// MIDDLEWARE
// ==========================================

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
  next();
});

// ==========================================
// RUTAS
// ==========================================

// Health Check
app.use('/api/health', healthRoutes);

// Partner Routes
app.use('/api/partners', partnerRoutes);

// Root endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'GuanaGO Backend API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      partners: '/api/partners',
      docs: '/api/docs'
    }
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `La ruta ${req.method} ${req.path} no existe`,
    availableEndpoints: [
      'GET /api',
      'GET /api/health',
      'POST /api/partners/login',
      'POST /api/partners/register',
      'GET /api/partners/:id',
      'GET /api/partners/:id/dashboard/stats'
    ]
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║      GuanaGO Backend Server 🚀        ║
╚════════════════════════════════════════╝

✓ Servidor escuchando en: http://localhost:${PORT}
✓ API base: http://localhost:${PORT}/api
✓ Health check: http://localhost:${PORT}/api/health
✓ Ambiente: ${process.env.NODE_ENV || 'development'}
✓ CORS habilitado: ${process.env.CORS_ORIGINS || 'todas las origins'}

Endpoints disponibles:
  GET  /api
  GET  /api/health
  POST /api/partners/login
  POST /api/partners/register
  GET  /api/partners/:id
  GET  /api/partners/:id/dashboard/stats
  GET  /api/partners/:id/sales/recent
  GET  /api/partners/:id/products/top

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Presiona Ctrl+C para detener el servidor
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n✓ Servidor detenido');
  process.exit(0);
});

module.exports = app;
