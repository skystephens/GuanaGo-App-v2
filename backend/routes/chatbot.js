import express from 'express';
import * as chatbotController from '../controllers/chatbotController.js';
import { verifyFirebaseToken } from '../middleware/firebaseAuth.js';

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

// Contacto directo con asesor — sin IA, crea registro pendiente en Airtable (sin auth)
router.post('/atencion/contacto', chatbotController.contactoDirecto);

// Badge: conteo de chats pendientes — sin auth para que el admin lo cargue al entrar
router.get('/atencion/pendientes', chatbotController.pendientesAtencion);

// Listado y actualización de chats (admin autenticado con Firebase)
router.get('/atencion/lista', verifyFirebaseToken, chatbotController.listarChatsAtencion);
router.patch('/atencion/:id', verifyFirebaseToken, chatbotController.actualizarChatAtencion);

// Chatbot público legacy
router.post('/message', chatbotController.sendMessage);

// Historial (requiere autenticación)
router.get('/conversation/:conversationId',
  verifyFirebaseToken,
  chatbotController.getConversationHistory
);

export default router;
