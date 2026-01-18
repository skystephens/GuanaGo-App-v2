
import express from 'express';
import * as reservationsController from '../controllers/reservationsController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// Obtener todas las reservas (admin/chatbot)
router.get('/all', reservationsController.getAllReservations);

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Crear reserva (turistas)
router.post('/', reservationsController.createReservation);

// Obtener reservas del usuario
router.get('/my-reservations', reservationsController.getUserReservations);

// Cancelar reserva
router.post('/:id/cancel', reservationsController.cancelReservation);

// Rutas para partners
router.get('/partner/reservations', 
  authorizeRole('partner', 'admin'), 
  reservationsController.getPartnerReservations
);

router.post('/validate', 
  authorizeRole('partner', 'admin'), 
  reservationsController.validateReservation
);

// Registrar solicitud/reserva en Airtable (solo admin)
router.post('/sync-to-airtable', 
  authorizeRole('admin'),
  reservationsController.syncToAirtable
);

export default router;
