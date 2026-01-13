import { makeRequest } from '../utils/helpers.js';
import { config } from '../config.js';

/**
 * Enviar mensaje al chatbot Guana
 */
export const sendMessage = async (req, res, next) => {
  try {
    const { message, context, conversationId } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'El mensaje es requerido'
      });
    }

    const result = await makeRequest(
      config.makeWebhooks.chatbot,
      {
        action: 'chat',
        message,
        context,
        conversationId,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      },
      'CHATBOT_MESSAGE'
    );

    res.json({
      success: true,
      response: result.response || result.message,
      conversationId: result.conversationId,
      suggestions: result.suggestions || []
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener historial de conversación
 */
export const getConversationHistory = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    
    const result = await makeRequest(
      config.makeWebhooks.chatbot,
      {
        action: 'getHistory',
        conversationId,
        userId: req.user?.id
      },
      'GET_CHAT_HISTORY'
    );

    res.json({
      success: true,
      data: result.history || []
    });
  } catch (error) {
    next(error);
  }
};
