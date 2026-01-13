import express from 'express';
import * as chatbotController from '../controllers/chatbotController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Chatbot público (sin autenticación requerida)
router.post('/message', chatbotController.sendMessage);

// Historial (requiere autenticación)
router.get('/conversation/:conversationId', 
  authenticateToken, 
  chatbotController.getConversationHistory
);

export default router;
