/**
 * Health Check Routes
 */

const express = require('express');
const router = express.Router();

/**
 * GET /api/health
 * Verifica el estado del servidor
 */
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3001
  });
});

/**
 * GET /api/health/ping
 * Simple ping test
 */
router.get('/ping', (req, res) => {
  res.json({ pong: true });
});

module.exports = router;
