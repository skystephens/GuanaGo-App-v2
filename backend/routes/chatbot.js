import express from 'express';
import * as chatbotController from '../controllers/chatbotController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Ruta base para verificación
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Chatbot API funcionando',
    endpoints: ['/cotizar', '/atencion', '/atencion/pendientes', '/atencion/lista', '/atencion/:id', '/message', '/conversation/:id']
  });
});

// Cotizador inteligente con Claude Haiku (público)
router.post('/cotizar', chatbotController.cotizar);

// Chat de atención general con Groq llama-3.3-70b + RAG público (sin auth)
router.post('/atencion', chatbotController.atender);

// Badge: conteo de chats pendientes — sin auth para que el admin lo cargue al entrar
router.get('/atencion/pendientes', chatbotController.pendientesAtencion);

// Listado y actualización de chats (admin autenticado)
router.get('/atencion/lista', authenticateToken, chatbotController.listarChatsAtencion);
router.patch('/atencion/:id', authenticateToken, chatbotController.actualizarChatAtencion);

// Chatbot público legacy
router.post('/message', chatbotController.sendMessage);

// Historial (requiere autenticación)
router.get('/conversation/:conversationId',
  authenticateToken,
  chatbotController.getConversationHistory
);

export default router;
