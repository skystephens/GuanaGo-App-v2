import express from 'express';
import * as availabilityController from '../controllers/availabilityController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// Crear solicitud (no requiere auth estricta; si hay token, se usa usuarioId)
router.post('/', availabilityController.createRequest);

// ⚠️ IMPORTANTE: Las rutas específicas DEBEN venir ANTES que las genéricas
// Listar todas las solicitudes (solo admin)
router.get('/admin/all', authenticateToken, authorizeRole('admin'), availabilityController.listAll);

// Listar solicitudes del usuario (requiere auth)
router.get('/user', authenticateToken, availabilityController.listForUser);

// Rutas de socio: listar y aprobar/rechazar
router.get('/partner', authenticateToken, authorizeRole('partner', 'admin'), availabilityController.listForPartner);
router.patch('/:id', authenticateToken, authorizeRole('partner', 'admin'), availabilityController.updateRequest);

export default router;
