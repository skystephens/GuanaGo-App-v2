import express from 'express';
import * as servicesController from '../controllers/servicesController.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas
router.get('/', servicesController.getServices);
router.get('/:id', servicesController.getServiceById);
router.post('/check-availability', servicesController.checkAvailability);

// Rutas protegidas (solo partners y admins)
router.post('/', 
  authenticateToken, 
  authorizeRole('partner', 'admin'), 
  servicesController.createOrUpdateService
);

router.put('/:id', 
  authenticateToken, 
  authorizeRole('partner', 'admin'), 
  servicesController.createOrUpdateService
);

export default router;
