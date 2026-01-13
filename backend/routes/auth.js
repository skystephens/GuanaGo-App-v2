n
import express from 'express';
import * as authController from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Webhook para Make.com (Escenario 1 - Users)
router.post('/webhook', (req, res) => {
  console.log('📥 Webhook recibido:', JSON.stringify(req.body, null, 2));
  res.json({
    success: true,
    message: 'Webhook recibido correctamente',
    timestamp: new Date().toISOString(),
    data: req.body
  });
});

// Rutas públicas
router.post('/login', authController.login);
router.post('/register', authController.register);

// Rutas protegidas
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfile);

export default router;
