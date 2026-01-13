import express from 'express';
import * as chatbotController from '../controllers/chatbotController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Ruta base para verificación
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Chatbot API funcionando',
    endpoints: ['/message', '/conversation/:id']
  });
});

// Chatbot público (sin autenticación requerida)
router.post('/message', chatbotController.sendMessage);

// Historial (requiere autenticación)
router.get('/conversation/:conversationId', 
  authenticateToken, 
  chatbotController.getConversationHistory
);

export default router;
