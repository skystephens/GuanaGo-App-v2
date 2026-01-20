import express from 'express';
import * as accommodationsController from '../controllers/accommodationsController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// Crear solicitud de alojamiento (no requiere auth estricta)
router.post('/submissions', accommodationsController.createSubmission);

// Listar solicitudes del socio (requiere auth partner/admin)
router.get('/submissions/partner', authenticateToken, authorizeRole('partner', 'admin'), accommodationsController.listForPartner);

// Listar todas las solicitudes (solo admin)
router.get('/submissions/admin/all', authenticateToken, authorizeRole('admin'), accommodationsController.listAll);

// Actualizar estado de una solicitud (partner/admin)
router.patch('/submissions/:id', authenticateToken, authorizeRole('partner', 'admin'), accommodationsController.updateSubmission);

export default router;
